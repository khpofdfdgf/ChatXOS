from browser_use import Agent, ChatBrowserUse
from dotenv import load_dotenv
import asyncio

load_dotenv()

async def main():
    llm = ChatBrowserUse()
    task = "Vô tràng chatgpt  chat 10 tin nhắn về lập trình khi chatgpt chưa trả lời xong không được nhấn nút enter nhé!"
    agent = Agent(task=task, llm=llm)
    await agent.run()

if __name__ == "__main__":
    asyncio.run(main())