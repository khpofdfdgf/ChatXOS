const express = require("express")
const auth = require("../middleware/auth")
const db = require("../db/sqlite")

const router = express.Router()

router.get("/", auth, (req, res) => {
  db.all(
    `
    SELECT session_name
    FROM chats
    WHERE username=? AND is_deleted=0
    GROUP BY session_name
    `,
    [req.user],
    (_, rows) => {
      res.json({
        sessions: (rows || []).map(r => ({ title: r.session_name })),
      })
    }
  )
})

router.post("/delete", auth, (req, res) => {
  const { session_name } = req.body
  db.run(
    "UPDATE chats SET is_deleted=1 WHERE username=? AND session_name=?",
    [req.user, session_name],
    () => res.json({ ok: true })
  )
})

module.exports = router
