# ChatXOS 🚀

© 2026 **ChatBotXOS Team**. All rights reserved.

⚠️ **Private Project**  
Dự án này là nội bộ. Không được redistribute, public fork, hay sử dụng cho mục đích thương mại nếu chưa có sự cho phép.

---

## 🔥 Giới thiệu

**ChatXOS** là một hệ thống chat đa tầng (multi-layer chat system) được xây dựng theo hướng **platform-oriented**, tập trung vào khả năng mở rộng, kiểm soát luồng dữ liệu và thử nghiệm kiến trúc backend hiện đại.

Đây không phải một app chat “cho vui”, mà là một project dùng để:
- nghiên cứu kiến trúc hệ thống thực tế
- thử nghiệm giao tiếp giữa nhiều backend
- xây nền cho các tính năng realtime & AI chat trong tương lai
- BỎ hạn chế ngu loz của Zalo  cho phép chat + tích hợp AI vào

---

## 🧠 Kiến trúc tổng quan

ChatXOS được chia thành 3 lớp chính:

- **FastAPI (Python)**  
  Xử lý logic lõi, AI, xử lý dữ liệu và các service nền.

- **Node.js Server**  
  Đóng vai trò server trung gian: auth,database,realtime, session, routing, socket, bridge giữa frontend và backend.

- **React Frontend**  
  Giao diện người dùng, realtime UI/UX, tương tác trực tiếp với server.

Thiết kế theo hướng module hóa → dễ thay thế, dễ scale, dễ debug.

---

## 🛠️ Tech Stack

- Backend: **Python / FastAPI/NodeJS**
- Server: **Node.js**
- Frontend: **React**
- Package Manager: `pip`, `npm`
- Environment: Virtual Environment (venv)
- Model AI:# ================= CONFIG =================
ALLOWED_MODELS = {
    "gemma3:1b": {"max_tokens": 1000, "max_context": 20},
    "llama3:8b": {"max_tokens": 2000, "max_context": 40},
    "gpt-oss:20b": {"max_tokens": 3000, "max_context": 60},
    "gpt-oss:120b-cloud": {"max_tokens": 4000, "max_context": 80},
}


---

## 🚧 Trạng thái dự án

- Project đang trong giai đoạn **active development**
- Có thể còn bug, thiếu feature
- Ưu tiên kiến trúc & logic hơn polish UI

---

## 🔒 License & Usage

This project is proprietary and confidential.
All source code in this repository is owned by the ChatBotXOS Team.

Unauthorized copying, redistribution, public forking, or commercial use of this project,
in whole or in part, is strictly prohibited without explicit permission.

This project may integrate third-party open-source libraries and AI models
(e.g. FastAPI, React, Gemma, LLaMA, GPT-OSS), each governed by their own respective licenses.
Use of those components does not grant any rights to this project’s source code.


---

🔥 ChatXOS — build để hiểu hệ thống, không build cho màu mè.  
Code ngu thì sửa, đừng hoảng 😎
