import asyncio
import time
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from fastapi.responses import StreamingResponse
from ollama import Client

# ================= APP =================
app = FastAPI()
client = Client()

# ================= CONFIG =================
ALLOWED_MODELS = {
    "gemma3:1b": {"max_tokens": 1000, "max_context": 20},
    "llama3:8b": {"max_tokens": 2000, "max_context": 40},
    "gpt-oss:20b": {"max_tokens": 3000, "max_context": 60},
    "gpt-oss:120b-cloud": {"max_tokens": 4000, "max_context": 80},
}

SUMMARY_MODEL = "llama3:8b"
MAX_HISTORY_BEFORE_SUMMARY = 20
MAX_CONCURRENT = 5

semaphore = asyncio.Semaphore(MAX_CONCURRENT)

# ================= SCHEMA =================
class AIMessage(BaseModel):
    role: str
    content: str

class GenerateRequest(BaseModel):
    model: str
    message: str
    history: List[AIMessage] = []
    memory: Optional[str] = None

# ================= SUMMARY =================
async def summarize_history(history: List[AIMessage], memory: Optional[str]):
    prompt = (
        "Hãy tóm tắt các thông tin quan trọng cần nhớ cho hội thoại sau.\n"
        "- Mục tiêu người dùng\n"
        "- Kiến thức đã thống nhất\n"
        "- Quyết định quan trọng\n"
        "Viết ngắn gọn."
    )

    messages = [{"role": "system", "content": prompt}]

    if memory:
        messages.append({
            "role": "system",
            "content": f"Ký ức cũ:\n{memory}"
        })

    for m in history:
        messages.append({"role": m.role, "content": m.content})

    loop = asyncio.get_event_loop()

    def call():
        res = client.chat(
            model=SUMMARY_MODEL,
            messages=messages,
            options={"num_predict": 256}
        )
        return res["message"]["content"]

    return await loop.run_in_executor(None, call)

# ================= MODEL STREAM =================
def run_model_stream(model: str, message: str, history: list, memory: Optional[str]):
    cfg = ALLOWED_MODELS[model]
    history = history[-cfg["max_context"]:]

    messages = [{
        "role": "system",
        "content": "Bạn là trợ lý AI thông minh, trả lời rõ ràng, súc tích."
    }]

    if memory:
        messages.append({
            "role": "system",
            "content": f"Thông tin đã ghi nhớ:\n{memory}"
        })

    for m in history:
        messages.append({"role": m.role, "content": m.content})

    messages.append({"role": "user", "content": message})

    def generator():
        try:
            for chunk in client.chat(
                model=model,
                messages=messages,
                options={"num_predict": cfg["max_tokens"]},
                stream=True
            ):
                token = chunk["message"]["content"]
                yield token

        except (asyncio.CancelledError, GeneratorExit):
            # btw client cook ddeer k nha(chuwea bt lamf j)
            return

        except Exception as e:
            # LOG SERVER, ĐỪNG YIELD
            print("[OLLAMA STREAM ERROR]", repr(e))
            return


    return generator

# ================= API =================
@app.post("/generate")
async def generate(req: GenerateRequest):
    if req.model not in ALLOWED_MODELS:
        raise HTTPException(400, "Model không được phép")

    memory = req.memory
    history = req.history.copy()

    if len(history) > MAX_HISTORY_BEFORE_SUMMARY:
        memory = await summarize_history(history, memory)
        history = history[-ALLOWED_MODELS[req.model]["max_context"]:]

    gen_fn = run_model_stream(
        req.model,
        req.message,
        history,
        memory
    )

    async def event_stream():
        full_reply = ""
        last_send = time.time()
        HEARTBEAT = 0.7  # < 1s cho Cloudflare đỡ nổi điên

        gen = gen_fn()

        try:
            for token in gen:
                full_reply += token
                yield token
                last_send = time.time()
                await asyncio.sleep(0)

                # 💓 heartbeat nếu model đứng hình
                while time.time() - last_send > HEARTBEAT:
                    yield " "
                    last_send = time.time()
                    await asyncio.sleep(0.3)

        except asyncio.CancelledError:
            # client out sớm → kệ mẹ
            return

        history.append(AIMessage(role="user", content=req.message))
        history.append(AIMessage(role="assistant", content=full_reply))

    return StreamingResponse(
        event_stream(),
        media_type="text/plain; charset=utf-8",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        }
    )
