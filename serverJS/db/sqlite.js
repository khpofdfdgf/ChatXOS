const sqlite3 = require("sqlite3").verbose()
const db = new sqlite3.Database("./data.db")

// init tables (copy nguyên SQL của m vô)
module.exports = db
