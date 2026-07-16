// ═══════════════════════════════════════════════
// Aperture — Database migration (sql.js)
// ═══════════════════════════════════════════════

import type { Database as SqlJsDb } from 'sql.js'
import { getDb } from './connection'

const MIGRATIONS = [
  `CREATE TABLE IF NOT EXISTS sessions (
    id          TEXT PRIMARY KEY,
    title       TEXT,
    backend_id  TEXT NOT NULL,
    provider_id TEXT,
    cwd         TEXT NOT NULL DEFAULT '',
    model       TEXT,
    permission  TEXT NOT NULL DEFAULT 'ask',
    status      TEXT NOT NULL DEFAULT 'active',
    pinned      INTEGER NOT NULL DEFAULT 0,
    message_count INTEGER NOT NULL DEFAULT 0,
    created_at  TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
  )`,

  `CREATE TABLE IF NOT EXISTS messages (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id   TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    role         TEXT NOT NULL,
    content      TEXT,
    thinking     TEXT,
    tool_calls   TEXT,
    tool_results TEXT,
    token_count  INTEGER,
    created_at   TEXT NOT NULL DEFAULT (datetime('now'))
  )`,

  `CREATE INDEX IF NOT EXISTS idx_messages_session ON messages(session_id)`,

  `CREATE TABLE IF NOT EXISTS providers (
    id             TEXT PRIMARY KEY,
    name           TEXT NOT NULL,
    backend_id     TEXT NOT NULL,
    api_url        TEXT,
    api_key_enc    TEXT,
    model          TEXT,
    is_default     INTEGER NOT NULL DEFAULT 0,
    sort_order     INTEGER NOT NULL DEFAULT 0,
    extra_config   TEXT,
    created_at     TEXT NOT NULL DEFAULT (datetime('now'))
  )`,

  `CREATE TABLE IF NOT EXISTS settings (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
  )`,


]

export async function runMigrations(): Promise<void> {
  const db = await getDb()

  db.run(`CREATE TABLE IF NOT EXISTS _migrations (version INTEGER PRIMARY KEY)`)
  const result = db.exec('SELECT MAX(version) as version FROM _migrations')
  const applied: number = result.length > 0 && result[0].values.length > 0
    ? (result[0].values[0][0] as number) ?? 0
    : 0

  for (let i = applied; i < MIGRATIONS.length; i++) {
    db.run(MIGRATIONS[i])
    db.run('INSERT INTO _migrations (version) VALUES (?)', [i + 1])
  }

  // sql.js auto-save is handled by connection.ts interval
}
