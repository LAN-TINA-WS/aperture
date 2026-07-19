// Aperture — Agent Process Manager (CLI spawn)
// Spawns Claude Code CLI via cmd.exe /d /c on Windows.
// No SDK dependency — pure child_process.spawn.

import { spawn, ChildProcess } from 'child_process'
import { BrowserWindow } from 'electron'
import { claudeBackend } from './claude'

// ─── Types ──────────────────────────────────────

interface ActiveProcess {
  process: ChildProcess
  pid: number
  backendId: string
  sessionId: string
  buffer: string
}

// ─── State ──────────────────────────────────────

const activeSessions = new Map<number, ActiveProcess>()
let queryCounter = 0

// ─── Env cleaning ───────────────────────────────

const CLEANED_KEYS = [
  'ANTHROPIC_AUTH_TOKEN', 'ANTHROPIC_API_KEY', 'ANTHROPIC_BASE_URL',
  'CLAUDE_API_KEY', 'CLAUDE_CODE_API_KEY', 'CODEX_API_KEY', 'OPENAI_API_KEY'
]

function cleanEnv(): Record<string, string | undefined> {
  const env: Record<string, string | undefined> = { ...process.env }
  for (const k of CLEANED_KEYS) delete env[k]
  return env
}

// ─── Public API ─────────────────────────────────

export function startAgent(
  params: {
    backendId: string
    prompt: string
    cwd: string
    model?: string
    sessionId?: string
    permissionMode?: string
    env?: Record<string, string>
  },
  window: BrowserWindow
): { pid: number; sessionId: string } {
  const backend = claudeBackend
  const cmd = backend.buildCommand({
    backendId: params.backendId,
    prompt: params.prompt,
    cwd: params.cwd,
    model: params.model,
    sessionId: params.sessionId,
    permissionMode: (params.permissionMode as any) ?? 'bypass',
  })

  const sessionId = params.sessionId || `sid-${++queryCounter}`
  const pid = ++queryCounter

  const env = cleanEnv()
  if (params.env) Object.assign(env, params.env)

  // Windows: spawn via cmd.exe /d /c
  console.log(`[agent ${pid}] spawning cmd.exe /d /c ${cmd.command} ${cmd.args.join(' ')}`)
  console.log(`[agent ${pid}] cwd: ${cmd.cwd}`)
  const child = spawn('cmd.exe', ['/d', '/c', cmd.command, ...cmd.args], {
    cwd: cmd.cwd,
    env: env as Record<string, string>,
    stdio: ['pipe', 'pipe', 'pipe'],
    windowsHide: true,
  })

  const session: ActiveProcess = {
    process: child,
    pid,
    backendId: params.backendId,
    sessionId,
    buffer: '',
  }

  // ── stdout NDJSON parser ──────────────────
  child.stdout?.on('data', (data: Buffer) => {
    const chunk = data.toString()
    console.log(`[agent ${pid} stdout:${chunk.length}B]`, chunk.slice(0, 200))
    session.buffer += chunk
    const lines = session.buffer.split('\n')
    session.buffer = lines.pop() || ''

    for (const line of lines) {
      if (!line.trim()) continue
      let events: ReturnType<typeof backend.parseLine> = []
      try {
        events = backend.parseLine(line)
      } catch (parseErr: any) {
        console.error(`[agent ${pid} parse error]`, parseErr.message, 'RAW:', line.slice(0, 200))
      }
      for (const evt of events) {
        console.log(`[agent ${pid} event] type=${evt.type}` + ('subtype' in evt ? ` subtype=${(evt as any).subtype}` : '') + ('text' in evt ? ` text=${JSON.stringify((evt as any).text).slice(0, 80)}` : ''))

        // Capture sessionId from system/init
        if (evt.type === 'system' && evt.subtype === 'init') {
          const data = evt.data as Record<string, unknown> | undefined
          if (data?.session_id) session.sessionId = String(data.session_id)
        }

        if (evt.type === 'done') {
          window.webContents.send('stream:done', {
            pid,
            sessionId: session.sessionId,
            exitCode: evt.exitCode ?? 0,
            usage: evt.usage,
            cost: evt.cost,
          })
        } else if (evt.type === 'error') {
          window.webContents.send('stream:error', { pid, sessionId: session.sessionId, message: evt.message })
        } else {
          window.webContents.send('stream:event', { pid, sessionId: session.sessionId, event: evt })
        }
      }
    }
  })

  // ── stderr logging ────────────────────────
  child.stderr?.on('data', (data: Buffer) => {
    console.error(`[agent ${pid} stderr]`, data.toString())
  })

  // ── lifecycle ─────────────────────────────
  child.on('exit', (code) => {
    console.log(`[agent ${pid}] process exited code=${code}, residual buffer=${JSON.stringify(session.buffer.slice(0, 200))}`)
    // Flush any residual buffer
    if (session.buffer.trim()) {
      const flushed = backend.parseLine(session.buffer)
      for (const evt of flushed) {
        console.log(`[agent ${pid} flush event] type=${evt.type}`)
        if (evt.type === 'done') {
          window.webContents.send('stream:done', { pid, sessionId: session.sessionId, exitCode: evt.exitCode ?? 0, usage: evt.usage, cost: evt.cost })
        } else if (evt.type === 'error') {
          window.webContents.send('stream:error', { pid, sessionId: session.sessionId, message: evt.message })
        } else {
          window.webContents.send('stream:event', { pid, sessionId: session.sessionId, event: evt })
        }
      }
    }
    window.webContents.send('stream:done', { pid, sessionId: session.sessionId, exitCode: code ?? 0 })
    activeSessions.delete(pid)
  })

  child.on('error', (err) => {
    window.webContents.send('stream:error', { pid, sessionId: session.sessionId, message: err.message })
    activeSessions.delete(pid)
  })

  activeSessions.set(pid, session)
  return { pid, sessionId }
}

export function killAgent(pid: number): void {
  const s = activeSessions.get(pid)
  if (!s) return

  // On Windows, use taskkill /t to kill the whole process tree
  if (process.platform === 'win32') {
    spawn('taskkill', ['/pid', String(s.process.pid), '/t', '/f'], { windowsHide: true })
  } else {
    s.process.kill('SIGTERM')
  }
  activeSessions.delete(pid)
}

export function sendUserMessage(pid: number, text: string, _window: BrowserWindow): void {
  const s = activeSessions.get(pid)
  if (!s) return

  const stdin = s.process.stdin
  if (stdin?.writable) {
    const msg = JSON.stringify({
      type: 'user',
      message: { role: 'user', content: [{ type: 'text', text }] },
    })
    stdin.write(msg + '\n')
  }
}

export function listActiveAgents(): Array<{ pid: number; backendId: string; sessionId: string }> {
  return Array.from(activeSessions.values()).map((s) => ({
    pid: s.pid,
    backendId: s.backendId,
    sessionId: s.sessionId,
  }))
}
