import sqlite3
from pathlib import Path
from typing import Optional


DB_PATH = Path(__file__).with_name("game.db")

def get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_conn()
    cur = conn.cursor()

    cur.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tg_id INTEGER UNIQUE NOT NULL,
        first_name TEXT,
        username TEXT,
        coins INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    """)

    conn.commit()
    conn.close()

def upsert_user(tg_id: int, first_name: Optional[str], username: Optional[str]):
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("""
    INSERT INTO users (tg_id, first_name, username, coins)
    VALUES (?, ?, ?, 0)
    ON CONFLICT(tg_id) DO UPDATE SET
        first_name=excluded.first_name,
        username=excluded.username
    """, (tg_id, first_name, username))
    conn.commit()
    conn.close()

def get_user(tg_id: int):
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("SELECT tg_id, first_name, username, coins FROM users WHERE tg_id=?", (tg_id,))
    row = cur.fetchone()
    conn.close()
    return dict(row) if row else None

def add_coins(tg_id: int, amount: int) -> int:
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("UPDATE users SET coins = coins + ? WHERE tg_id=?", (amount, tg_id))
    conn.commit()
    cur.execute("SELECT coins FROM users WHERE tg_id=?", (tg_id,))
    coins = cur.fetchone()["coins"]
    conn.close()
    return coins

