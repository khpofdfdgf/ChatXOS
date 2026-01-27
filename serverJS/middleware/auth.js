const jwt = require("jsonwebtoken")
const { JWT_SECRET } = require("../config/env")

module.exports = function auth(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1]
  if (!token) return res.status(401).json({ error: "Thiếu token" })
  try {
    req.user = jwt.verify(token, JWT_SECRET).user
    next()
  } catch {
    res.status(401).json({ error: "Token lỗi" })
  }
}
