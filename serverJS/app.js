const express = require("express")
const corsConfig = require("./config/cors")
const logger = require("./middleware/logger")
const authRoutes = require("./routes/auth")
const chatRoutes = require("./routes/chat")
const sessionRoutes = require("./routes/seesions")
const { summarizeIfNeeded } = require("./utils/summarize")

const env = require("./config/env")
const app = express()
app.use(express.json())
app.use(logger)


const allowedOrigins = [
  env.FE1,
  env.FE2,
  env.LOCAL_FE1,
  env.LOCAL_FE2,
].filter(Boolean)

app.use(corsConfig(allowedOrigins))

app.use("/", authRoutes)

app.use("/chat", chatRoutes)
app.use("/session", sessionRoutes)

app.listen(3500, "0.0.0.0", () => {
  console.log("🔥 Server chạy cổng 3500")
})
