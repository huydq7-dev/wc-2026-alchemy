import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'data', 'wc2026.db');

const db = new Database(DB_PATH);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initDB() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      avatar TEXT NOT NULL,
      pin TEXT NOT NULL DEFAULT '1234',
      paid INTEGER DEFAULT 0,
      debt_paid INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS matches (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      time TEXT NOT NULL,
      team_a_name TEXT NOT NULL,
      team_a_code TEXT NOT NULL,
      team_a_flag TEXT NOT NULL,
      team_b_name TEXT NOT NULL,
      team_b_code TEXT NOT NULL,
      team_b_flag TEXT NOT NULL,
      deal TEXT NOT NULL,
      deal_side TEXT NOT NULL,
      venue TEXT,
      stage TEXT NOT NULL,
      status TEXT DEFAULT 'upcoming',
      score_a INTEGER,
      score_b INTEGER
    );

    CREATE TABLE IF NOT EXISTS predictions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      match_id TEXT NOT NULL,
      pick TEXT NOT NULL,
      result TEXT,
      points INTEGER,
      bet_amount INTEGER DEFAULT 5000,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      UNIQUE(user_id, match_id),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (match_id) REFERENCES matches(id)
    );

    CREATE TABLE IF NOT EXISTS teams (
      name TEXT PRIMARY KEY,
      fifa_code TEXT NOT NULL,
      flag_icon TEXT NOT NULL,
      group_name TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS rules (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      sort_order INTEGER DEFAULT 0
    );
  `);

  // Migration: add columns if missing (safe for existing DBs)
  const migrate = (sql: string) => {
    try { db.exec(sql); } catch { /* column already exists */ }
  };
  migrate('ALTER TABLE users ADD COLUMN pin TEXT NOT NULL DEFAULT "1234"');
  migrate('ALTER TABLE users ADD COLUMN debt_paid INTEGER DEFAULT 0');
  migrate('ALTER TABLE predictions ADD COLUMN bet_amount INTEGER DEFAULT 5000');
}

export default db;
