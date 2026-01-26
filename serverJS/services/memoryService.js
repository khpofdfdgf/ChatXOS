const db = require("../db/sqlite")

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
    ON CONFLICT(username) DO UPDATE SET summary=excluded.summary
    `,
    [username, summary]
  )
}

module.exports = { getMemory, saveMemory }
