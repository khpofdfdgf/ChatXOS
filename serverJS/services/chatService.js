const db = require("../db/sqlite")

function getRecentHistory(username, session, limit = 10) {
  return new Promise(resolve => {
    db.all(
      `
      SELECT role, content
      FROM chats
      WHERE username=? AND session_name=? AND is_deleted=0
      ORDER BY id ASC
      LIMIT ?
      `,
      [username, session, limit],
      (_, rows) => resolve(rows || [])
    )
  })
}

function saveMessage(username, session, role, content) {
  db.run(
    `
    INSERT INTO chats(username, session_name, is_deleted, role, content)
    VALUES (?, ?, 0, ?, ?)
    `,
    [username, session, role, content]
  )
}

module.exports = { getRecentHistory, saveMessage }
