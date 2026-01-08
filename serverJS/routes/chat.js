const express = require("express")
const auth = require("../middleware/auth")
const { getRecentHistory, saveMessage } = require("../services/chatService")
const { getMemory } = require("../services/memoryService")
const { streamAI } = require("../services/aiService")
const { summarizeIfNeeded } = require("../utils/summarize")


const router = express.Router()

router.post("/", auth, async (req, res) => {
  const { model, message, session_name } = req.body
  const username = req.user
summarizeIfNeeded(username, session_name)
  if (!session_name || !message)
    return res.status(400).json({ error: "Thiếu dữ liệu" })

  saveMessage(username, session_name, "user", message)

  const history = await getRecentHistory(username, session_name)
  const memory = await getMemory(username)

  res.setHeader("Content-Type", "text/plain; charset=utf-8")
  res.setHeader("Transfer-Encoding", "chunked")
  res.flushHeaders()

  try {
    const reply = await streamAI(
      { model, message, history, memory },
      res
    )

    saveMessage(username, session_name, "assistant", reply)
    res.end()
  } catch {
    res.end("\n[AI ERROR]\n")
  }
})

module.exports = router
