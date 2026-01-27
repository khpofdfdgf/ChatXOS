const axios = require("axios")
const db = require("../db/sqlite")
const { AI_API } = require("../config/env")

const SUMMARY_MODEL = "llama3:8b"

// ===== LẤY HISTORY =====
function getRecentHistory(username, session_name, limit = 40) {
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
    )
  })
}

// ===== MEMORY =====
function getMemory(username) {
  return new Promise(resolve => {
    db.get(
      "SELECT summary FROM memory WHERE username=?",
      [username],
      (_, row) => resolve(row?.summary || null)
    )
  })
}

function saveMemory(username, summary) {
  db.run(
    `
    INSERT INTO memory(username, summary)
    VALUES (?, ?)
    ON CONFLICT(username)
    DO UPDATE SET summary=excluded.summary
    `,
    [username, summary]
  )
}

// ===== SUMMARIZE =====
async function summarizeIfNeeded(username, session_name) {
  try {
    const history = await getRecentHistory(username, session_name)

    // chưa đủ dài thì khỏi tóm
    if (history.length < 30) return

    const oldMemory = await getMemory(username)

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
    })

    if (res?.data?.reply) {
      saveMemory(username, res.data.reply)
    }
  } catch (err) {
    console.error("💥 SUMMARIZE FAIL:", err.message)
  }
}

module.exports = {
  summarizeIfNeeded
}
