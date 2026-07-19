// ═══════════════════════════════════════════════
// Aperture — Repositories (sql.js)
// ═══════════════════════════════════════════════

import { randomUUID } from 'crypto'
import { homedir } from 'os'
import { join, dirname } from 'path'
import { mkdirSync, writeFileSync } from 'fs'
import { unlinkSync, existsSync } from 'fs'
import type { SqlJsStatic, Database as SqlJsDb, BindParams } from 'sql.js'
import { getDb, saveDb } from './connection'
import { findSessionPath } from '../agent/session-scanner'
import type { Session, Message } from '../../shared/types'

type Row = Record<string, unknown>

function rowToObj(columns: string[], values: unknown[]): Row {
  const obj: Row = {}
  columns.forEach((col, i) => { obj[col] = values[i] })
  return obj
}

function queryAll(db: SqlJsDb, sql: string, params?: BindParams): Row[] {
  const stmt = db.prepare(sql)
  if (params) (stmt as { bind: (p: unknown[]) => void }).bind(params as unknown[])
  const rows: Row[] = []
  while (stmt.step()) rows.push(rowToObj(stmt.getColumnNames(), stmt.get()))
  stmt.free()
  return rows
}

function queryOne(db: SqlJsDb, sql: string, params?: BindParams): Row | undefined {
  return queryAll(db, sql, params)[0]
}

function castRows<T>(rows: Row[]): T[] { return rows as unknown as T[] }
function castRow<T>(row?: Row): T | undefined { return row as unknown as T | undefined }

async function dbRun(sql: string, params?: BindParams): Promise<void> {
  const db = await getDb()
  db.run(sql, params)
  saveDb()
}

// ─── Sessions ───────────────────────────────────

export async function listSessions(): Promise<Session[]> {
  const db = await getDb()
  return castRows<Session>(queryAll(db, 'SELECT * FROM sessions WHERE status != ? ORDER BY pinned DESC, updated_at DESC', ['archived']))
    .map(s => ({ ...s, title: s.title || '新对话' }))
}

export async function getSession(id: string): Promise<Session | undefined> {
  const db = await getDb()
  const row = queryOne(db, 'SELECT * FROM sessions WHERE id = ?', [id])
  if (!row) return undefined
  return castRow<Session>(row)!
}

export async function createSession(backendId: string, cwd: string, model?: string): Promise<Session> {
  const id = randomUUID()
  const now = new Date().toISOString()
  await dbRun('INSERT INTO sessions (id, backend_id, cwd, model, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)', [id, backendId, cwd, model ?? null, now, now])

  // Create empty .jsonl file so CC can discover this session
  try {
    const projectsDir = join(homedir(), '.claude', 'projects')
    // Encode workdir path: C:\path\to\dir → C--path-to-dir
    const dirName = cwd.replace(/^([A-Z]):/, '$1--').replace(/[\/:]/g, '-')
    const sessionFile = join(projectsDir, dirName, `${id}.jsonl`)
    mkdirSync(dirname(sessionFile), { recursive: true })
    writeFileSync(sessionFile, '')
  } catch (_) {
    // Non-fatal: session will be created on first message anyway
  }

  return (await getSession(id))!
}

export async function deleteSession(
  id: string,
  sessionMeta?: { sourcePath?: string; providerId?: string }
): Promise<{ deleted: boolean; fileDeleted?: boolean; error?: string }> {
  // Step 0: Resolve filesystem path (use provided sourcePath, or find by providerId+sessionId)
  let sourcePath = sessionMeta?.sourcePath
  if (!sourcePath && sessionMeta?.providerId) {
    sourcePath = findSessionPath(sessionMeta.providerId, id) ?? undefined
  }

  // Step 1: Delete the session file from disk
  let fileDeleted = false
  if (sourcePath && existsSync(sourcePath)) {
    try {
      unlinkSync(sourcePath)
      fileDeleted = true
    } catch (e: any) {
      // Non-fatal: file deletion is best-effort; DB cleanup still runs
      console.error(`[deleteSession] Failed to delete file ${sourcePath}:`, e.message)
    }
  }

  // Step 2: Delete messages first (defense-in-depth — sql.js FK enforcement is unreliable)
  await dbRun('DELETE FROM messages WHERE session_id = ?', [id])

  // Step 3: Delete the session row
  await dbRun('DELETE FROM sessions WHERE id = ?', [id])

  return { deleted: true, fileDeleted }
}

export async function renameSession(id: string, title: string): Promise<void> {
  await dbRun("UPDATE sessions SET title = ?, updated_at = datetime('now') WHERE id = ?", [title, id])
}

export async function pinSession(id: string, pinned: boolean): Promise<void> {
  await dbRun("UPDATE sessions SET pinned = ?, updated_at = datetime('now') WHERE id = ?", [pinned ? 1 : 0, id])
}

export async function archiveSession(id: string): Promise<void> {
  await dbRun("UPDATE sessions SET status = 'archived', updated_at = datetime('now') WHERE id = ?", [id])
}

// ─── Messages ───────────────────────────────────

export async function addMessage(
  sessionId: string, role: string, content?: string,
  thinking?: string, toolCalls?: string, toolResults?: string
): Promise<Message> {
  const db = await getDb()
  db.run('INSERT INTO messages (session_id, role, content, thinking, tool_calls, tool_results) VALUES (?, ?, ?, ?, ?, ?)', [sessionId, role, content ?? null, thinking ?? null, toolCalls ?? null, toolResults ?? null])
  await dbRun("UPDATE sessions SET message_count = (SELECT COUNT(*) FROM messages WHERE session_id = ?), updated_at = datetime('now') WHERE id = ?", [sessionId, sessionId])
  return castRow<Message>(queryOne(db, 'SELECT * FROM messages WHERE id = last_insert_rowid()'))!
}

export async function getMessages(sessionId: string): Promise<Message[]> {
  const db = await getDb()
  return castRows<Message>(queryAll(db, 'SELECT * FROM messages WHERE session_id = ? ORDER BY id ASC', [sessionId]))
}
