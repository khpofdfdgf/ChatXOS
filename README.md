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

---

## 🚧 Trạng thái dự án

- Project đang trong giai đoạn **active development**
- Có thể còn bug, thiếu feature
- Ưu tiên kiến trúc & logic hơn polish UI

---

## 🔒 License & Usage

This project is proprietary and confidential.  
Unauthorized copying, distribution, or commercial use is strictly prohibited.

---

🔥 ChatXOS — build để hiểu hệ thống, không build cho màu mè.  
Code ngu thì sửa, đừng hoảng 😎
