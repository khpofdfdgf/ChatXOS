const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const sqlite3 = require("sqlite3").verbose();
const axios = require("axios");
const cors = require("cors");
const env = require("dotenv")
const path = require("path")
const fs = require("fs");
const app = express();
app.use(express.json());
require("dotenv").config()


const JWT_SECRET = process.env.JWT;
const AI_API = process.env.AIGEN;
const front_end_link_1= process.env.FE1addr
const front_end_link_2= process.env.FE2addr
const local_fe1= process.env.localFE1addr
const local_fe2= process.env.localFE2addr
const cloud_ip = process.env.CLOUDFLARE_IPS
const LOG_FILE = path.join(process.cwd(), "requests.log");
console.log(local_fe1, local_fe2, front_end_link_1, front_end_link_2, AI_API);
const SUMMARY_MODEL = "llama3:8b";
app.set("trust proxy", 1)
const allowedOrigins = [
  local_fe1,
  local_fe2,
  front_end_link_1,
  front_end_link_2,
  AI_API
].filter(Boolean)

app.use(cors({
  origin(origin, cb) {
        console.log("👉 REQ ORIGIN =", origin)
    console.log("✅ ALLOWED =", allowedOrigins)

    if (!origin) return cb(null, true) // postman/curl

    if (allowedOrigins.includes(origin)) {
      return cb(null, true)
    }

    return cb(new Error("CORS blocked 😤"))
  },
  credentials: true,
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}))
// app.use(cors({
//   origin: true, // 🚪 mở toang
//   credentials: true,
// }));

const db = new sqlite3.Database("./data.db");

// users
db.run(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE,
  password TEXT
)`);

// chats
db.run(`
CREATE TABLE IF NOT EXISTS chats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT,
  session_name TEXT,
  is_deleted INTEGER DEFAULT 0,
  role TEXT,
  content TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`);

// memory
db.run(`
CREATE TABLE IF NOT EXISTS memory (
  username TEXT PRIMARY KEY,
  summary TEXT
)`);
app.use((req, res, next) => {
  const time = new Date().toISOString();

  const ipCF = req.headers["cf-connecting-ip"] || "UNKNOWN";

const clientIp =
  req.headers["cf-connecting-ip"]

  const logText = `
==================== REQUEST ====================
Time   : ${time}
IP-CLOUDFLARE : ${ipCF}
IP-CLIENT     : ${clientIp}
Method : ${req.method}
URL    : ${req.originalUrl}

--- Headers ---
${JSON.stringify(req.headers, null, 2)}

--- Body ---
${JSON.stringify(req.body, null, 2)}

================================================
`;

  fs.appendFile(LOG_FILE, logText, (err) => {
    if (err) console.error("💥 Log ghi k đc:", err);
  });

  next();
});

// ===== AUTH =====
function auth(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Thiếu token" });
  try {
    req.user = jwt.verify(token, JWT_SECRET).user;
    next();
  } catch {
    res.status(401).json({ error: "Token lỗi" });
  }
}
app.get("/ip", (req, res) => {
  res.json({
    cf: req.headers["cf-connecting-ip"],
    xff: req.headers["x-forwarded-for"],
    ip: req.ip,
  });
});


// ===== REGISTER =====
app.post("/register", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ error: "Thiếu dữ liệu" });

  const hash = await bcrypt.hash(password, 10);
  db.run(
    "INSERT INTO users(username, password) VALUES (?, ?)",
    [username.toLowerCase(), hash],
    err => {
      if (err) return res.status(409).json({ error: "Username tồn tại" });
      res.json({ ok: true });
    }
  );
});

// ===== LOGIN =====
app.post("/login", (req, res) => {
  const { username, password } = req.body;
  db.get(
    "SELECT * FROM users WHERE username=?",
    [username.toLowerCase()],
    async (_, row) => {
      if (!row) return res.status(401).json({ error: "Sai login" });
      const ok = await bcrypt.compare(password, row.password);
      if (!ok) return res.status(401).json({ error: "Sai login" });

      const token = jwt.sign({ user: row.username }, JWT_SECRET, {
        expiresIn: "7d"
      });
      res.json({ token });
    }
  );
});

app.get("/sessions", auth, (req, res) => {
  db.all(
    `
    SELECT session_name
    FROM chats
    WHERE username=? AND is_deleted=0
    GROUP BY session_name
    ORDER BY MIN(created_at) ASC
    `,
    [req.user],
    (err, rows) => {
      if (err) {
        console.error("DB error:", err);
        return res.status(500).json({ error: "Database error" });
      }

      rows = rows || []; // chống undefined

      res.json({
        sessions: rows.map(r => ({
          title: r.session_name
        }))
      });
    }
  );
});


// ===== HISTORY =====
function getRecentHistory(username, session_name, limit = 20) {
  return new Promise(resolve => {
    db.all(
      `
      SELECT role, content
      FROM chats
      WHERE username=?
        AND session_name=?
        AND is_deleted=0
      ORDER BY id ASC
      LIMIT ?
      `,
      [username, session_name, limit],
      (_, rows) => resolve(rows || [])
    );
  });
}

// ===== MEMORY =====
function getMemory(username) {
  return new Promise(resolve => {
    db.get(
      "SELECT summary FROM memory WHERE username=?",
      [username],
      (_, row) => resolve(row?.summary || null)
    );
  });
}

function saveMemory(username, summary) {
  db.run(
    `
    INSERT INTO memory(username, summary)
    VALUES (?, ?)
    ON CONFLICT(username) DO UPDATE SET summary=excluded.summary
    `,
    [username, summary]
  );
}

// ===== SUMMARIZE =====
async function summarizeIfNeeded(username, session_name) {
  const history = await getRecentHistory(username, session_name, 40);
  if (history.length < 30) return;

  const oldMemory = await getMemory(username);

  const res = await axios.post(AI_API, {
    model: SUMMARY_MODEL,
    message:
      "Tóm tắt các thông tin quan trọng cần nhớ cho các cuộc hội thoại sau. Viết ngắn gọn.",
    history: [
      ...(oldMemory
        ? [{ role: "system", content: "Ký ức cũ:\n" + oldMemory }]
        : []),
      ...history
    ]
  });

  saveMemory(username, res.data.reply);
}


// ===== CHAT (STREAMING) =====
app.post("/chat", auth, async (req, res) => {
  const startTime = Date.now()

  try {
    const { model, message, session_name } = req.body
    const username = req.user

    // ===== VALIDATE =====
    if (!session_name)
      return res.status(400).json({ error: "Thiếu session_name" })

    if (!message || typeof message !== "string")
      return res.status(400).json({ error: "Message không hợp lệ" })

    // ===== SAVE USER MESSAGE =====
    db.run(
      `
      INSERT INTO chats(username, session_name, is_deleted, role, content)
      VALUES (?, ?, 0, ?, ?)
      `,
      [username, session_name, "user", message]
    )

    // ===== LOAD CONTEXT =====
    const history = await getRecentHistory(username, session_name, 10)
    const memory = await getMemory(username)

    // ===== CALL FASTAPI (STREAM) =====
    const upstream = await fetch(AI_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: model || "llama3:8b",
        message,
        history,
        memory,
      }),
    })

    if (!upstream.ok || !upstream.body) {
      console.error("🔥 AI upstream fail:", upstream.status)
      return res.status(502).json({ error: "AI server lỗi 💀" })
    }

    // ===== SET STREAM HEADERS =====
    res.setHeader("Content-Type", "text/plain; charset=utf-8")
    res.setHeader("Transfer-Encoding", "chunked")
    res.setHeader("Cache-Control", "no-cache")
    res.flushHeaders()

    const reader = upstream.body.getReader()
    const decoder = new TextDecoder()

    let fullReply = ""
    let clientClosed = false

    // detect client disconnect
    res.on("close", () => {
      clientClosed = true
      console.warn("⚠️ Client closed connection early")
    })

    // ===== STREAM LOOP =====
    while (!clientClosed) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value, { stream: true })
      fullReply += chunk
      res.write(chunk)
    }

    res.end()

    // ===== SAVE AI MESSAGE (AFTER STREAM) =====
    if (!clientClosed && fullReply.trim()) {
      db.run(
        `
        INSERT INTO chats(username, session_name, is_deleted, role, content)
        VALUES (?, ?, 0, ?, ?)
        `,
        [username, session_name, "assistant", fullReply]
      )
    }

    // ===== BACKGROUND SUMMARY =====
    summarizeIfNeeded(username, session_name).catch(console.error)

    console.log(
      `✅ CHAT DONE ${username}/${session_name} (${Date.now() - startTime}ms)`
    )

  } catch (err) {
    console.error("💥 CHAT STREAM CRASH:", err)

    // nếu headers chưa gửi
    if (!res.headersSent) {
      return res.status(500).json({ error: "Server nổ 💣" })
    }

    // nếu đang stream → gửi error cuối
    try {
      res.write("\n[SERVER ERROR]\n")
      res.end()
    } catch (_) {}
  }
})

// ===== GET CHAT =====
app.get("/chat", auth, (req, res) => {
  const { session_name } = req.query;
  db.all(
    `
    SELECT role, content
    FROM chats
    WHERE username=?
      AND session_name=?
      AND is_deleted=0
    ORDER BY id ASC
    `,
    [req.user, session_name],
    (_, rows) => res.json({ messages: rows || [] })
  );
});

// ===== SOFT DELETE SESSION =====
app.post("/session/delete", auth, (req, res) => {
  const { session_name } = req.body;
  if (!session_name)
    return res.status(400).json({ error: "Thiếu session_name" });

  db.run(
    `
    UPDATE chats
    SET is_deleted=1
    WHERE username=? AND session_name=?
    `,
    [req.user, session_name],
    () => res.json({ ok: true })
  );
});

// ===== CLEAN OLD SOFT-DELETED =====
setInterval(() => {
  db.run(`
    DELETE FROM chats
    WHERE is_deleted=1
      AND created_at < datetime('now', '-2 years')
  `);
}, 1000 * 60 * 60 * 24);

// ===== RUN =====
app.listen(3500, "0.0.0.0", () => {
  console.log("🔥 NodeJS server chạy 3000");
});
