// ═══════════════════════════════════════════════
// Aperture — Multi-backend session scanner
// Ported from CC Switch session_manager/providers/*
// ═══════════════════════════════════════════════

import { readdirSync, readFileSync, existsSync, statSync, watch } from 'fs'
import { join, basename } from 'path'
import { homedir } from 'os'
import type { BrowserWindow } from 'electron'

// ─── Types ─────────────────────────────────────

export interface SessionMeta {
  providerId: string       // 'claude' | 'codex' | 'gemini' | 'hermes' | 'opencode' | 'openclaw'
  sessionId: string
  title: string | null
  projectDir: string | null
  createdAt: number | null   // ms
  lastActiveAt: number | null
  sourcePath: string
  resumeCommand: string | null
}

export interface SessionMessage {
  role: string
  content: string
  thinking?: string
  ts: number | null
}

// ─── Backend scanner registry ──────────────────

type Scanner = () => SessionMeta[]
type MessageLoader = (path: string) => SessionMessage[]

const scanners: Record<string, Scanner> = {}
const loaders: Record<string, MessageLoader> = {}

export function registerScanner(providerId: string, scan: Scanner, load: MessageLoader) {
  scanners[providerId] = scan
  loaders[providerId] = load
}

export function scanAll(): SessionMeta[] {
  const all: SessionMeta[] = []
  for (const [providerId, scan] of Object.entries(scanners)) {
    try { all.push(...scan()) } catch { /* skip broken scanners */ }
  }
  all.sort((a, b) => (b.lastActiveAt ?? 0) - (a.lastActiveAt ?? 0))
  return all
}

export function loadMessages(providerId: string, path: string): SessionMessage[] {
  return loaders[providerId]?.(path) ?? []
}

// ─── Helpers ───────────────────────────────────

function parseTs(val: unknown): number | null {
  if (typeof val === 'number') return val
  if (typeof val === 'string') { const d = new Date(val).getTime(); return isNaN(d) ? null : d }
  return null
}

function truncate(s: string, max: number): string {
  return s.length <= max ? s : s.slice(0, max - 3) + '...'
}

function collectFiles(dir: string, ext: string, out: string[]): void {
  if (!existsSync(dir)) return
  try {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, e.name)
      if (e.isDirectory()) collectFiles(p, ext, out)
      else if (p.endsWith(ext)) out.push(p)
    }
  } catch { /* skip */ }
}

function readLines(path: string): string[] {
  try { return readFileSync(path, 'utf-8').split('\n').filter(Boolean) } catch { return [] }
}

function headTail(lines: string[], headN: number, tailN: number): [string[], string[]] {
  return [lines.slice(0, headN), lines.slice(-tailN)]
}

// ─── Claude ────────────────────────────────────

function claudeProjectsDir() {
  return join(process.env.CLAUDE_CONFIG_DIR || join(homedir(), '.claude'), 'projects')
}

/** Find a Claude session's JSONL file path by sessionId. Returns null if not found. */
export function findClaudeSessionPath(sessionId: string): string | null {
  const files: string[] = []
  collectFiles(claudeProjectsDir(), '.jsonl', files)
  return findInFiles(files, sessionId)
}

/** Scans collected files for a matching sessionId. Shared by all find*SessionPath helpers. */
function findInFiles(files: string[], sessionId: string): string | null {
  for (const f of files) {
    const base = basename(f, '.jsonl')
    if (base === sessionId || base.replace(/-session$/, '') === sessionId) return f
    // Also check inside the file for matching session_id
    try {
      const lines = readLines(f)
      for (const line of lines.slice(0, 3)) {
        const obj = JSON.parse(line)
        if (obj.sessionId === sessionId || obj.session_id === sessionId) return f
      }
    } catch { continue }
  }
  return null
}

/** Find a Codex session's JSONL file path by sessionId. */
export function findCodexSessionPath(sessionId: string): string | null {
  const files: string[] = []
  for (const dir of codexDir()) collectFiles(dir, '.jsonl', files)
  return findInFiles(files, sessionId)
}

/** Find a Gemini session's JSON file path by sessionId. */
export function findGeminiSessionPath(sessionId: string): string | null {
  const dir = geminiDir()
  if (!existsSync(dir)) return null
  const files: string[] = []
  collectFiles(dir, '.json', files)
  for (const f of files) {
    if (basename(f, '.json') === sessionId) return f
    try {
      const data = JSON.parse(readFileSync(f, 'utf-8'))
      if (data.sessionId === sessionId) return f
    } catch { continue }
  }
  return null
}

/** Find a Hermes session's JSONL file path by sessionId. */
export function findHermesSessionPath(sessionId: string): string | null {
  const sessionsDir = join(hermesDir(), 'sessions')
  if (!existsSync(sessionsDir)) return null
  const files: string[] = []
  collectFiles(sessionsDir, '.jsonl', files)
  collectFiles(sessionsDir, '.json', files)
  return findInFiles(files, sessionId)
}

/** Find an OpenCode session's JSON file path by sessionId. */
export function findOpenCodeSessionPath(sessionId: string): string | null {
  const dir = opencodeDir()
  if (!existsSync(dir)) return null
  const files: string[] = []
  collectFiles(dir, '.json', files)
  return findInFiles(files, sessionId)
}

/** Find an OpenClaw session's JSONL file path by sessionId. */
export function findOpenClawSessionPath(sessionId: string): string | null {
  const dir = openclawDir()
  if (!existsSync(dir)) return null
  const files: string[] = []
  collectFiles(dir, '.jsonl', files)
  return findInFiles(files, sessionId)
}

/** Generic session path finder — delegates to provider-specific finders. */
export function findSessionPath(providerId: string, sessionId: string): string | null {
  switch (providerId) {
    case 'claude':   return findClaudeSessionPath(sessionId)
    case 'codex':    return findCodexSessionPath(sessionId)
    case 'gemini':   return findGeminiSessionPath(sessionId)
    case 'hermes':   return findHermesSessionPath(sessionId)
    case 'opencode':  return findOpenCodeSessionPath(sessionId)
    case 'openclaw': return findOpenClawSessionPath(sessionId)
    default:         return null
  }
}

registerScanner('claude', () => {
  const files: string[] = []
  collectFiles(claudeProjectsDir(), '.jsonl', files)
  return files
    .filter(p => !basename(p).startsWith('agent-'))
    .map(parseClaudeMeta)
    .filter((m): m is SessionMeta => m !== null)
}, (path) => {
  return readLines(path).map(line => {
    try {
      const obj = JSON.parse(line)
      if (obj.isMeta) return null
      const msg = obj.message; if (!msg) return null
      let role = msg.role || 'unknown'
      const content = msg.content
      const ts = parseTs(obj.timestamp)
      if (role === 'user' && Array.isArray(content) && content.every((b: any) => b.type === 'tool_result')) role = 'tool'
      let text = ''
      let thinking: string | undefined
      if (Array.isArray(content)) {
        for (const b of content) {
          if (b.type === 'text') text += b.text || ''
          else if (b.type === 'thinking') thinking = (thinking || '') + (b.thinking || '')
          else if (b.type === 'tool_use') text += `[Tool: ${b.name}]`
          else if (b.type === 'tool_result') text += typeof b.content === 'string' ? b.content : JSON.stringify(b.content)
        }
      } else if (typeof content === 'string') text = content
      if (!text.trim() && !thinking) return null
      return { role, content: text, thinking, ts } as SessionMessage
    } catch { return null }
  }).filter((m): m is SessionMessage => m !== null)
})

function parseClaudeMeta(path: string): SessionMeta | null {
  const lines = readLines(path)
  if (!lines.length) return null
  let sessionId: string | null = null, cwd: string | null = null, createdAt: number | null = null
  let title: string | null = null, lastActiveAt: number | null = null
  for (const line of lines) {
    try {
      const obj = JSON.parse(line)
      if (!sessionId) sessionId = obj.sessionId || obj.session_id
      if (!cwd) cwd = obj.cwd
      if (!createdAt) createdAt = parseTs(obj.timestamp) ?? createdAt
      if (!title && (obj.type === 'user' || obj.message?.role === 'user')) {
        const text = extractText(obj)
        if (text && !text.includes('<local-command-caveat>')) title = truncate(text, 50)
      }
      if (sessionId && cwd && createdAt && title) break
    } catch { continue }
  }
  for (let i = lines.length - 1; i >= 0; i--) {
    try {
      const obj = JSON.parse(lines[i])
      if (!lastActiveAt) lastActiveAt = parseTs(obj.timestamp)
      if (obj.type === 'custom-title' && obj.customTitle) title = truncate(obj.customTitle, 50) || title
      if (lastActiveAt && title) break
    } catch { continue }
  }
  if (!sessionId) sessionId = basename(path, '.jsonl').replace(/-session$/, '')
  if (!sessionId) return null
  return { providerId: 'claude', sessionId, title, projectDir: cwd, createdAt, lastActiveAt, sourcePath: path, resumeCommand: `claude --resume ${sessionId}` }
}

function extractText(obj: any): string | null {
  const msg = obj.message; const content = msg?.content
  if (typeof content === 'string') return content
  if (Array.isArray(content)) return content.filter((b: any) => b.type === 'text').map((b: any) => b.text || '').join('')
  return null
}

// ─── Codex ─────────────────────────────────────

function codexDir() {
  const base = process.env.CODEX_CONFIG_DIR || join(homedir(), '.codex')
  return [join(base, 'sessions'), join(base, 'archived_sessions')]
}

registerScanner('codex', () => {
  const files: string[] = []
  for (const dir of codexDir()) collectFiles(dir, '.jsonl', files)
  return files.map(parseCodexMeta).filter((m): m is SessionMeta => m !== null)
}, (path) => {
  return readLines(path).map(line => {
    try {
      const obj = JSON.parse(line)
      if (obj.type !== 'response_item') return null
      const p = obj.payload; if (!p) return null
      const ts = parseTs(obj.timestamp)
      if (p.type === 'message') {
        const role = p.role || 'unknown'
        const content = typeof p.content === 'string' ? p.content : ''
        if (!content.trim()) return null
        return { role, content, ts }
      }
      if (p.type === 'function_call') return { role: 'assistant', content: `[Tool: ${p.name}]`, ts }
      if (p.type === 'function_call_output') return { role: 'tool', content: p.output || '', ts }
      return null
    } catch { return null }
  }).filter((m): m is SessionMessage => m !== null)
})

function parseCodexMeta(path: string): SessionMeta | null {
  const lines = readLines(path)
  const [head, tail] = headTail(lines, 10, 10)
  let sessionId: string | null = null, cwd: string | null = null, createdAt: number | null = null
  let title: string | null = null, lastActiveAt: number | null = null
  for (const line of head) {
    try {
      const obj = JSON.parse(line)
      if (!createdAt) createdAt = parseTs(obj.timestamp) ?? createdAt
      if (obj.type === 'session_meta' && obj.payload) {
        if (obj.payload.source?.subagent) return null
        if (!sessionId) sessionId = obj.payload.id
        if (!cwd) cwd = obj.payload.cwd
      }
      if (!title && obj.type === 'response_item' && obj.payload?.type === 'message' && obj.payload.role === 'user') {
        const text = obj.payload.content as string
        if (text && !text.startsWith('# AGENTS.md') && !text.startsWith('<environment_context>')) {
          title = truncate(text, 50)
        }
      }
    } catch { continue }
  }
  for (const line of tail.reverse()) {
    try {
      const obj = JSON.parse(line)
      if (!lastActiveAt) lastActiveAt = parseTs(obj.timestamp)
    } catch { continue }
  }
  if (!sessionId) return null
  return { providerId: 'codex', sessionId, title, projectDir: cwd, createdAt, lastActiveAt, sourcePath: path, resumeCommand: `codex resume ${sessionId}` }
}

// ─── Gemini ────────────────────────────────────

function geminiDir() { return join(homedir(), '.gemini', 'tmp') }

registerScanner('gemini', () => {
  const dir = geminiDir()
  if (!existsSync(dir)) return []
  const sessions: SessionMeta[] = []
  try {
    for (const proj of readdirSync(dir, { withFileTypes: true })) {
      if (!proj.isDirectory()) continue
      const chatsDir = join(dir, proj.name, 'chats')
      if (!existsSync(chatsDir)) continue
      const projectRoot = (() => { try { return readFileSync(join(dir, proj.name, '.project_root'), 'utf-8').trim() } catch { return null } })()
      for (const f of readdirSync(chatsDir)) {
        if (!f.endsWith('.json')) continue
        const path = join(chatsDir, f)
        try {
          const data = JSON.parse(readFileSync(path, 'utf-8'))
          const sessionId = data.sessionId; if (!sessionId) continue
          const createdAt = parseTs(data.startTime)
          const lastActiveAt = parseTs(data.lastUpdated) ?? createdAt
          const title = data.messages?.find((m: any) => m.type === 'user')?.content?.trim()?.slice(0, 50) || null
          sessions.push({ providerId: 'gemini', sessionId, title: title ? truncate(title, 50) : null, projectDir: projectRoot, createdAt, lastActiveAt, sourcePath: path, resumeCommand: `gemini --resume ${sessionId}` })
        } catch { continue }
      }
    }
  } catch { /* skip */ }
  return sessions
}, (path) => {
  try {
    const data = JSON.parse(readFileSync(path, 'utf-8'))
    return (data.messages || []).map((m: any) => {
      const type = m.type; if (type === 'info' || type === 'error') return null
      const role = type === 'gemini' ? 'assistant' : type === 'user' ? 'user' : null
      if (!role) return null
      let content = typeof m.content === 'string' ? m.content : Array.isArray(m.content) ? m.content.filter((b: any) => b.text).map((b: any) => b.text).join('\n') : ''
      if (m.toolCalls) for (const tc of m.toolCalls) content += (content ? '\n' : '') + `[Tool: ${tc.name}]`
      if (!content.trim()) return null
      return { role, content, ts: parseTs(m.timestamp) }
    }).filter(Boolean) as SessionMessage[]
  } catch { return [] }
})

// ─── Hermes ────────────────────────────────────

function hermesDir() { return join(homedir(), '.hermes') }

registerScanner('hermes', () => {
  const sessionsDir = join(hermesDir(), 'sessions')
  if (!existsSync(sessionsDir)) return []
  const files: string[] = []
  try {
    for (const f of readdirSync(sessionsDir)) {
      if (f.endsWith('.jsonl') || f.endsWith('.json')) files.push(join(sessionsDir, f))
    }
  } catch { return [] }
  return files.map(parseHermesMeta).filter((m): m is SessionMeta => m !== null)
}, (path) => {
  return readLines(path).map(line => {
    try {
      const obj = JSON.parse(line)
      if (obj.type === 'message') {
        const msg = obj.message; if (!msg) return null
        const role = msg.role; if (!role) return null
        const content = typeof msg.content === 'string' ? msg.content : ''
        if (!content.trim()) return null
        return { role, content, ts: parseTs(obj.timestamp) }
      }
      const role = obj.role; if (!role) return null
      const content = typeof obj.content === 'string' ? obj.content : ''
      if (!content.trim()) return null
      return { role, content, ts: parseTs(obj.timestamp) }
    } catch { return null }
  }).filter((m): m is SessionMessage => m !== null)
})

function parseHermesMeta(path: string): SessionMeta | null {
  const lines = readLines(path)
  const [head, tail] = headTail(lines, 30, 5)
  let sessionId: string | null = null, title: string | null = null, cwd: string | null = null
  let firstTs: number | null = null, lastTs: number | null = null
  for (const line of head) {
    try {
      const obj = JSON.parse(line)
      const ts = parseTs(obj.timestamp)
      if (!firstTs) firstTs = ts
      if (obj.type === 'session' || obj.type === 'init') {
        if (!sessionId) sessionId = obj.id || obj.sessionId
        if (!title) title = obj.title
        if (!cwd) cwd = obj.cwd || obj.directory
      }
      if (!title) {
        const role = obj.role || obj.message?.role
        if (role === 'user') {
          const text = typeof obj.content === 'string' ? obj.content : ''
          if (text.trim()) title = truncate(text, 50)
        }
      }
    } catch { continue }
  }
  for (const line of tail.reverse()) {
    try { const ts = parseTs(JSON.parse(line).timestamp); if (ts) { lastTs = ts; break } } catch { continue }
  }
  if (!sessionId) sessionId = basename(path).replace(/\.(jsonl?|json)$/, '')
  return { providerId: 'hermes', sessionId, title, projectDir: cwd, createdAt: firstTs, lastActiveAt: lastTs ?? firstTs, sourcePath: path, resumeCommand: null }
}

// ─── OpenCode ──────────────────────────────────

function opencodeDir() {
  const xdg = process.env.XDG_DATA_HOME || join(homedir(), '.local', 'share')
  return join(xdg, 'opencode', 'storage', 'session')
}

registerScanner('opencode', () => {
  const dir = opencodeDir()
  if (!existsSync(dir)) return []
  const files: string[] = []
  collectFiles(dir, '.json', files)
  return files.map(parseOpenCodeMeta).filter((m): m is SessionMeta => m !== null)
}, (path) => {
  return readLines(path).map(line => {
    try {
      const obj = JSON.parse(line)
      const role = obj.role || obj.message?.role
      if (!role) return null
      const content = typeof obj.content === 'string' ? obj.content : obj.message?.content
      if (typeof content !== 'string' || !content.trim()) return null
      return { role, content, ts: parseTs(obj.timestamp) }
    } catch { return null }
  }).filter((m): m is SessionMessage => m !== null)
})

function parseOpenCodeMeta(path: string): SessionMeta | null {
  const lines = readLines(path)
  let sessionId: string | null = null, title: string | null = null, firstTs: number | null = null
  for (const line of lines.slice(0, 30)) {
    try {
      const obj = JSON.parse(line)
      if (!firstTs) firstTs = parseTs(obj.timestamp)
      if (!sessionId) sessionId = obj.sessionId || obj.session_id
      const role = obj.role || obj.message?.role
      if (!title && role === 'user') {
        const content = obj.content || obj.message?.content
        if (typeof content === 'string' && content.trim()) title = truncate(content, 50)
      }
    } catch { continue }
  }
  if (!sessionId) sessionId = basename(path, '.json').replace(/-session$/, '')
  if (!sessionId) return null
  return { providerId: 'opencode', sessionId, title, projectDir: null, createdAt: firstTs, lastActiveAt: firstTs, sourcePath: path, resumeCommand: null }
}

// ─── OpenClaw ──────────────────────────────────

function openclawDir() { return join(homedir(), '.openclaw', 'agents') }

registerScanner('openclaw', () => {
  const dir = openclawDir()
  if (!existsSync(dir)) return []
  const sessions: SessionMeta[] = []
  try {
    for (const agent of readdirSync(dir, { withFileTypes: true })) {
      if (!agent.isDirectory()) continue
      const sd = join(dir, agent.name, 'sessions')
      if (!existsSync(sd)) continue
      for (const f of readdirSync(sd)) {
        if (!f.endsWith('.jsonl')) continue
        const path = join(sd, f)
        const meta = parseOpenClawMeta(path)
        if (meta) sessions.push(meta)
      }
    }
  } catch { /* skip */ }
  return sessions
}, (path) => {
  return readLines(path).map(line => {
    try {
      const obj = JSON.parse(line)
      const role = obj.role; if (!role) return null
      const content = typeof obj.content === 'string' ? obj.content : ''
      // Strip OpenClaw message_id suffix
      const idx = content.lastIndexOf('\n[message_id:')
      const clean = idx > 0 ? content.slice(0, idx).trimEnd() : content
      if (!clean.trim()) return null
      return { role, content: clean, ts: parseTs(obj.timestamp) }
    } catch { return null }
  }).filter((m): m is SessionMessage => m !== null)
})

function parseOpenClawMeta(path: string): SessionMeta | null {
  const lines = readLines(path)
  let sessionId: string | null = null, title: string | null = null, firstTs: number | null = null
  for (const line of lines.slice(0, 30)) {
    try {
      const obj = JSON.parse(line)
      if (!firstTs) firstTs = parseTs(obj.timestamp)
      if (obj.type === 'session' || obj.type === 'init') {
        if (!sessionId) sessionId = obj.id || obj.sessionId || obj.uuid
      }
      if (!title && obj.role === 'user' && typeof obj.content === 'string' && obj.content.trim()) {
        title = truncate(obj.content, 50)
      }
    } catch { continue }
  }
  if (!sessionId) sessionId = basename(path, '.jsonl')
  return { providerId: 'openclaw', sessionId, title, projectDir: null, createdAt: firstTs, lastActiveAt: firstTs, sourcePath: path, resumeCommand: null }
}

// ─── File-system watcher ─────────────────────

let watcher: ReturnType<typeof watch> | null = null

export function startWatching(window: BrowserWindow) {
  stopWatching()
  const dir = claudeProjectsDir()
  if (!existsSync(dir)) return

  let timer: NodeJS.Timeout | null = null
  watcher = watch(dir, { recursive: true }, () => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      const sessions = scanAll()
      window.webContents.send('session:scanned', sessions)
    }, 500)
  })
}

export function stopWatching() {
  if (watcher) { watcher.close(); watcher = null }
}
