const fetch = global.fetch
const { AI_API } = require("../config/env")

async function streamAI({ model, message, history, memory }, res) {
  const upstream = await fetch(AI_API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: model || "llama3:8b",
      message,
      history,
      memory,
    }),
  })

  if (!upstream.ok || !upstream.body) {
    throw new Error("AI upstream fail")
  }

  const reader = upstream.body.getReader()
  const decoder = new TextDecoder()
  let full = ""

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    const chunk = decoder.decode(value, { stream: true })
    full += chunk
    res.write(chunk)
  }

  return full
}

module.exports = { streamAI }
