const cors = require("cors")

module.exports = (allowedOrigins) =>
  cors({
    origin(origin, cb) {
      if (!origin) return cb(null, true)
      if (allowedOrigins.includes(origin)) return cb(null, true)
      cb(new Error("CORS blocked"))
    },
    credentials: true,
  })
