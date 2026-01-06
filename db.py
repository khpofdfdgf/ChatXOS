import sqlite3

conn = sqlite3.connect("chat.db", check_same_thread=False)
cur = conn.cursor()

cur.execute("""
CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT,
    role TEXT,
    content TEXT,
    ts DATETIME DEFAULT CURRENT_TIMESTAMP
)
""")

conn.commit()

def save_message(username, role, content):
    cur.execute(
        "INSERT INTO messages (username, role, content) VALUES (?, ?, ?)",
        (username, role, content)
    )
    conn.commit()

def load_history(username, limit=50):
    cur.execute(
        """
        SELECT role, content FROM messages
        WHERE username = ?
        ORDER BY id ASC
        LIMIT ?
        """,
        (username, limit)
    )
    return cur.fetchall()
