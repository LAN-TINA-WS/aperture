// ═══════════════════════════════════════════════
// Aperture — Database (sql.js — pure JS SQLite)
// ═══════════════════════════════════════════════

import initSqlJs, { Database as SqlJsDb } from 'sql.js'
import { join } from 'path'
import { app } from 'electron'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'

let db: SqlJsDb | null = null
let dbPath = ''

function saveToDisk(): void {
  if (db && dbPath) {
    const data = db.export()
    writeFileSync(dbPath, Buffer.from(data))
  }
}

export async function getDb(): Promise<SqlJsDb> {
  if (db) return db

  const dir = join(app.getPath('userData'), 'data')
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  dbPath = join(dir, 'aperture.db')

  const SQL = await initSqlJs()

  if (existsSync(dbPath)) {
    const buffer = readFileSync(dbPath)
    db = new SQL.Database(buffer)
  } else {
    db = new SQL.Database()
  }

  db.run('PRAGMA foreign_keys = ON')

  // Auto-save every 5 seconds
  setInterval(saveToDisk, 5000)

  return db
}

export function saveDb(): void {
  saveToDisk()
}

export function closeDb(): void {
  saveToDisk()
  db?.close()
  db = null
}
