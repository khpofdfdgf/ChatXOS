const express = require("express")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
const db = require("../db/sqlite")
const { JWT_SECRET } = require("../config/env")

const router = express.Router()

router.post("/register", async (req, res) => {
  const { username, password } = req.body
  const hash = await bcrypt.hash(password, 10)

  db.run(
    "INSERT INTO users(username, password) VALUES (?, ?)",
    [username.toLowerCase(), hash],
    err => {
      if (err) return res.status(409).json({ error: "Username tồn tại" })
      res.json({ ok: true })
    }
  )
})

router.post("/login", (req, res) => {
  const { username, password } = req.body

  db.get(
    "SELECT * FROM users WHERE username=?",
    [username.toLowerCase()],
    async (_, row) => {
      if (!row) return res.status(401).json({ error: "Sai login" })

      const ok = await bcrypt.compare(password, row.password)
      if (!ok) return res.status(401).json({ error: "Sai login" })

      const token = jwt.sign({ user: row.username }, JWT_SECRET, {
        expiresIn: "7d",
      })

      res.json({ token })
    }
  )
})

module.exports = router
