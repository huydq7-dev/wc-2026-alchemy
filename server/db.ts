import 'dotenv/config';
import { createClient } from '@libsql/client';

const client = createClient({
  url: process.env.TURSO_DATABASE_URL || 'file:data/wc2026.db',
  authToken: process.env.TURSO_AUTH_TOKEN,
});

let initialized = false;

export async function initDB() {
  if (initialized) return;

  await client.execute('PRAGMA foreign_keys = ON');

  await client.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      avatar TEXT NOT NULL,
      pin TEXT NOT NULL DEFAULT '1234',
      paid INTEGER DEFAULT 0,
      debt_paid INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    )
  `);

  await client.execute(`
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
    )
  `);

  await client.execute(`
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
    )
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS teams (
      name TEXT PRIMARY KEY,
      fifa_code TEXT NOT NULL,
      flag_icon TEXT NOT NULL,
      group_name TEXT NOT NULL
    )
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS rules (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      sort_order INTEGER DEFAULT 0
    )
  `);

  const migrate = async (sql: string) => {
    try { await client.execute(sql); } catch { /* column already exists */ }
  };
  await migrate('ALTER TABLE users ADD COLUMN pin TEXT NOT NULL DEFAULT "1234"');
  await migrate('ALTER TABLE users ADD COLUMN debt_paid INTEGER DEFAULT 0');
  await migrate('ALTER TABLE predictions ADD COLUMN bet_amount INTEGER DEFAULT 5000');
  await migrate('ALTER TABLE users ADD COLUMN is_admin INTEGER DEFAULT 0');
  await migrate('ALTER TABLE users ADD COLUMN pin_changed INTEGER DEFAULT 0');
  await migrate('ALTER TABLE predictions ADD COLUMN auto_loss INTEGER DEFAULT 0');
  await migrate('ALTER TABLE matches ADD COLUMN deal_manual INTEGER DEFAULT 0');

  await client.execute(`
    CREATE TABLE IF NOT EXISTS activity_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      user_name TEXT NOT NULL,
      action TEXT NOT NULL,
      details TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  initialized = true;
}

export default client;
