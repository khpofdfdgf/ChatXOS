import streamlit as st
import requests
import time
import os
from dotenv import load_dotenv
#========PROXY DISABLED==========================#
for k in (
    "HTTP_PROXY", "HTTPS_PROXY",
    "http_proxy", "https_proxy",
    "ALL_PROXY"
):
    os.environ.pop(k, None)
# =================ENV CONFIG=======================
load_dotenv()
# ================= CONFIG =================
API_BASE = os.getenv("API")
TIMEOUT = 1000000
A="gemma:1b"
B="llama3:8b"
C="gpt-oss:20b"
session = requests.Session()
session.trust_env = False
MODEL_CHOICES = {
    "Model cơ bản": "gemma3:1b",
    "Model tầm trung": "llama3:8b",
    "Model cao cấp ver 1": "gpt-oss:20b",
    "Model cao cấp ver 2": "gpt-oss:120b-cloud"

}
token = st.session_state.get("token", "")
CHUNK_SIZE = 20      # render mỗi 20 ký tự
RENDER_DELAY = 0.05 # 50ms

# ================= PAGE ==================
st.set_page_config(
    page_title="AI Học tập 3.1",
    page_icon="🤖",
    layout="centered"
)

# =============== SESSION =================
for key, default in {
    "logged_in": False,
    "token": None,
    "username": None,
    "messages": [],
    "model": "gemma3:1b",
    "chat_history_list": [],
    "current_chat_index": -1,
    "streaming": False
}.items():
    if key not in st.session_state:
        st.session_state[key] = default
# ========================================
#==============IP LOG========================
# real_ip = (
#     request.headers.get("cf-connecting-ip")
#     or request.headers.get("x-forwarded-for", "").split(",")[0].strip()
#     or request.client.host
# )

# bodyIP = {"IP-Addr:": real_ip}

# ============== HELPER ===================
def load_chats_from_server():
    headers = {"Authorization": f"Bearer {st.session_state.token}"}
 
    try:
        # Lấy danh sách session từ server
        res = session.get(f"{API_BASE}/sessions", headers=headers, timeout=10)
        if res.status_code == 200:
            sessions = res.json().get("sessions", [])
            st.session_state.chat_history_list = []

            for s in sessions:
                session_name = s["title"]
                # Load messages cho từng session
                res2 = session.get(f"{API_BASE}/chat?session_name={session_name}", headers=headers, timeout=10)
                messages = res2.json().get("messages", []) if res2.status_code == 200 else []
                st.session_state.chat_history_list.append({
                    "title": session_name,
                    "messages": messages
                })

            # Chọn session đầu tiên nếu có
            if st.session_state.chat_history_list:
                st.session_state.current_chat_index = 0
                st.session_state.messages = st.session_state.chat_history_list[0]["messages"]
            else:
                st.session_state.current_chat_index = -1
                st.session_state.messages = []
        else:
            st.session_state.chat_history_list = []
            st.session_state.current_chat_index = -1
            st.session_state.messages = []
    except Exception as e:
        st.warning("Không load được chat cũ từ server")
        st.exception(e)

# ========================================
# "IP-Addr:": real_ip

# ============== AUTH UI ==================
def login_ui():
    st.subheader("🔐 Đăng nhập")
    user = st.text_input("👤 Username")
    pwd = st.text_input("🔑 Password", type="password")
    if st.button("🚀 Login"):
        try:
            res = session.post(f"{API_BASE}/login", json={"username": user, "password": pwd, }, timeout=1000)
            if res.status_code == 200:
                data = res.json()
                st.session_state.logged_in = True
                st.session_state.token = data["token"]
                st.session_state.username = user
                # Load chat history ngay sau login
                load_chats_from_server()
                st.success("Login OK 😎")
                if not st.session_state.streaming:
                    st.rerun()
            else:
                st.error("Sai tài khoản hoặc mật khẩu 💀")
        except Exception as e:
            st.error("Server có lỗi 💀")
            st.exception(e)

def register_ui():
    st.subheader("📝 Đăng ký")
    user = st.text_input("👤 Username", key="reg_user")
    pwd = st.text_input("🔑 Password", type="password", key="reg_pwd")
    if st.button("🧬 Register"):
        try:
            res = session.post(f"{API_BASE}/register", json={"username": user, "password": pwd}, timeout=10)
            if res.status_code == 200:
                st.success("Đăng ký xong nhấn nút Login đi")
            else:
                st.error("User tồn tại rồi ")
        except Exception as e:
            st.error("Server sập 💀")
            st.exception(e)
# ========================================

# ============ LOGIN GATE =================
if not st.session_state.logged_in:
    st.title("🤖 AI Học tập 3.1")
    st.caption("Ai hỗ trợ mọi ngóc ngách trong học tập")
    tab1, tab2 = st.tabs(["🔐 Login", "📝 Register"])
    with tab1:
        login_ui()
    with tab2:
        register_ui()
    st.stop()
# ========================================

# ============== SIDEBAR ==================
st.sidebar.header("⚙️ Cấu hình")
st.sidebar.markdown(f"👤 **{st.session_state.username}**")

selected_name = st.sidebar.selectbox("🧠 Chọn model ", list(MODEL_CHOICES.keys()))
# Khi gửi lên backend / gọi AI thì lấy tên thật
st.session_state.model = MODEL_CHOICES[selected_name]


# Chọn chat cũ
if st.session_state.chat_history_list:
    titles = [c["title"] for c in st.session_state.chat_history_list]
    sel = st.sidebar.selectbox(
        "🗂 Chọn chat cũ", titles,
        index=max(st.session_state.current_chat_index, 0)
    )
    st.session_state.current_chat_index = titles.index(sel)
    st.session_state.messages = st.session_state.chat_history_list[st.session_state.current_chat_index]["messages"]

# Tạo chat mới
if st.sidebar.button("🆕 Chat mới"):
    new_title = f"Chat {len(st.session_state.chat_history_list)+1}"
    st.session_state.chat_history_list.append({"title": new_title, "messages": []})
    st.session_state.current_chat_index = len(st.session_state.chat_history_list)-1
    st.session_state.messages = []
    if not st.session_state.streaming:
        st.rerun()

if st.sidebar.button("🧹 Clear chat (UI only)"):
    st.session_state.confirm_clear = True

if st.session_state.get("confirm_clear"):
    st.warning("Xóa chat này luôn hả m? 💀")

    col1, col2 = st.columns(2)

    if col1.button("✅ Xóa"):
        idx = st.session_state.current_chat_index
        if 0 <= idx < len(st.session_state.chat_history_list):
            session_name = st.session_state.chat_history_list[idx].get("title")
            
            # 📨 Gửi request xóa lên server
            if session_name and token:
                try:
                    res = requests.post(
                        f"{API_BASE}/session/delete",
                        headers={
                            "Content-Type": "application/json",
                            "Authorization": f"Bearer {token}"
                        },
                        json={"session_name": session_name}
                    )
                    if res.status_code == 200:
                        st.success(f'Xóa chat "{session_name}" thành công 😎')
                    else:
                        st.error("Xóa server không thành công 💀")
                except Exception as e:
                    st.error(f"Lỗi gửi server: {e}")
            
            # 🧹 Clear UI
            st.session_state.chat_history_list[idx]["messages"] = []
            st.session_state.messages = []

        st.session_state.confirm_clear = False
        if not st.session_state.streaming:
            st.rerun()

    if col2.button("❌ Thôi"):
        st.session_state.confirm_clear = False
        if not st.session_state.streaming:
            st.rerun()()

# Logout
if st.sidebar.button("🚪 Logout"):
    st.session_state.logged_in = False
    st.session_state.token = None
    st.session_state.username = None
    st.session_state.messages = []
    st.session_state.chat_history_list = []
    st.session_state.current_chat_index = -1
    if not st.session_state.streaming:
        st.rerun()
# ========================================

# ================= MAIN ==================
st.title("🤖 AI Học tập 3.1")
st.caption("Level 3 memory | Sucess to future")
st.markdown("---")
st.markdown("❤️ Cảm ơn sự tài trợ từ **thuychi.vn** =)")
st.markdown("---")



# ============ CLASS RENDER CHAT ============
class ChatRenderer:
    def __init__(self, text: str):
        self.text = text

    def _fix_inline_math(self, text: str) -> str:
        """
        Fix các pattern kiểu (a), (b), a^2
        KHÔNG dùng re
        """
        out = ""
        i = 0
        while i < len(text):
            # (a), (b)
            if (
                text[i] == "(" and
                i + 2 < len(text) and
                text[i+2] == ")" and
                text[i+1].isalpha()
            ):
                out += r"\(" + text[i+1] + r"\)"
                i += 3
                continue

            # a^2
            if (
                i + 2 < len(text) and
                text[i].isalpha() and
                text[i+1] == "^" and
                text[i+2].isdigit()
            ):
                out += r"\(" + text[i:i+3] + r"\)"
                i += 3
                continue

            out += text[i]
            i += 1

        return out

    def render(self, container):
        s = self.text
        i = 0
        buffer = ""

        container.empty()      # 💥 xoá cũ → không nhân widget

        with container:
            while i < len(s):
                if s[i:i+2] == r"\[":
                    if buffer.strip():
                        st.markdown(self._fix_inline_math(buffer))
                        buffer = ""

                    i += 2
                    end = s.find(r"\]", i)
                    if end == -1:
                        end = len(s)

                    st.latex(s[i:end].strip())
                    i = end + 2
                else:
                    buffer += s[i]
                    i += 1

            if buffer.strip():
                st.markdown(self._fix_inline_math(buffer))




# ============ CHAT HISTORY ============
if "messages" not in st.session_state:
    st.session_state.messages = []

if "chat_history_list" not in st.session_state:
    st.session_state.chat_history_list = [{"title": "Chat 1", "messages": []}]
    st.session_state.current_chat_index = 0

# render lịch sử
for msg in st.session_state.messages:
    with st.chat_message(msg["role"]):
        container = st.container()
        ChatRenderer(msg["content"]).render(container)
container = st.container()

# ============== INPUT =================
prompt = st.chat_input("Nhập nội dung...")

if prompt:
    # ===== ENSURE CHAT LIST EXISTS =====
    if "chat_history_list" not in st.session_state:
        st.session_state.chat_history_list = []

    if "current_chat_index" not in st.session_state:
        st.session_state.current_chat_index = 0

    # ===== CREATE CHAT IF NONE EXISTS =====
    if len(st.session_state.chat_history_list) == 0:
        new_chat = {
            "title": prompt[:30],
            "messages": []
        }
        st.session_state.chat_history_list.append(new_chat)
        st.session_state.current_chat_index = 0
        st.session_state.messages = new_chat["messages"]

    current_chat = st.session_state.chat_history_list[
        st.session_state.current_chat_index
    ]

    # ===== CREATE NEW CHAT IF CURRENT IS EMPTY =====
    if len(current_chat["messages"]) == 0 and current_chat["title"] == "New chat":
        current_chat["title"] = prompt[:30]

    # ===== APPEND USER MESSAGE =====
    st.session_state.messages.append(
        {"role": "user", "content": prompt}
    )

    st.session_state.chat_history_list[
        st.session_state.current_chat_index
    ]["messages"] = st.session_state.messages

    with st.chat_message("user"):
        ChatRenderer(prompt).render(container)

    # ===== ASSISTANT =====
    with st.chat_message("assistant"):
        placeholder = st.empty()
        renderer = ChatRenderer("")
        last_len = 0
        last_render = time.time()

        payload = {
            "model": st.session_state.get("model", "llama3:8b"),
            "message": prompt,
            "session_name": st.session_state.chat_history_list[
                st.session_state.current_chat_index
            ]["title"]
        }

        headers = {
            "Authorization": f"Bearer {st.session_state.get('token','')}",
            "User-Agent": "Mozilla/5.0 (ChatFrontend/1.0)"
        }

        try:
            st.session_state.streaming = True
            
            res = requests.post(
                f"{API_BASE}/chat",
                json=payload,
                headers=headers,
                stream=True,
                timeout=TIMEOUT,
                proxies={"http":None,"https":None}
            )
            if res.status_code !=200:
                st.session_state.streaming=False
                st.error("AI Server co van de !!!!!!!")
                st.stop()

            last_chunk_time=time.time()
            for chunk in res.iter_content(chunk_size=32,decode_unicode=True):
                now = time.time()

                if chunk:
                    renderer.text += chunk
                    last_chunk_time = now
                #keep-alive for cf btw =))))
                if (
                        len(renderer.text) - last_len >= 20
                        or (now - last_render) > 0.05
                        or (now - last_chunk_time) > 0.8
                  ):
                    placeholder.empty()
                    renderer.render(placeholder)
                    last_len = len(renderer.text)
                    last_render = now
                #lan cuoi thu ma :>>>>
            placeholder.empty()
            renderer.render(placeholder)
            st.session_state.messages.append({
                "role":"assistant",
                "content": renderer.text
            })    

            st.session_state.streaming = False
        except Exception as e:
            st.session_state.streaming = False
            st.error("Serrver bay mauf rooif cacs bes baats ngowf chuwa :>>>")
            st.exception(e)
            st.stop()