import { app, BrowserWindow, shell, ipcMain, Menu } from 'electron'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'
import { homedir } from 'os'
import { startAgent, killAgent, sendUserMessage, listActiveAgents } from './agent/manager'
import { claudeBackend } from './agent/claude'
import { loadMessages, findSessionPath, scanAll, startWatching, stopWatching } from './agent/session-scanner'
import type { StartParams } from '../shared/types'
import { runMigrations } from './db/migrate'
import {
  listSessions as dbListSessions, getSession, createSession,
  deleteSession, renameSession, pinSession, archiveSession
} from './db/repositories'
import { readCCSwitchSettings, readCCSwitchProviders, readCCSwitchCurrentProviders, readCCSwitchUsage, debugCCSwitch } from './ccswitch-reader'
import { scanAllAgents, toApertureProvider, debugAgentConfigs } from './agent-config-reader'

let mainWindow: BrowserWindow | null = null

// ─── Window ───────────────────────────────────────

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1400, height: 900,
    minWidth: 900, minHeight: 600,
    title: 'Aperture',
    frame: false,
    backgroundColor: '#F8FAFF',
    show: false,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  mainWindow.once('ready-to-show', () => mainWindow?.show())

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:') || url.startsWith('http:')) shell.openExternal(url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL'])
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  else
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))

  mainWindow.once('ready-to-show', () => mainWindow?.show())
}

// ─── Window controls IPC ────────────────────────

ipcMain.handle('window:minimize', () => mainWindow?.minimize())
ipcMain.handle('window:maximize', () => mainWindow?.isMaximized() ? mainWindow.unmaximize() : mainWindow?.maximize())
ipcMain.handle('window:close', () => mainWindow?.close())
ipcMain.handle('app:open-path', async (_e, p: string) => shell.openPath(p))

// ─── App lifecycle ──────────────────────────────

app.whenReady().then(() => {
  runMigrations()
  Menu.setApplicationMenu(null)
  createWindow()
  startWatching(mainWindow!)
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow() })
})

app.on('window-all-closed', () => { stopWatching(); if (process.platform !== 'darwin') app.quit() })

// ─── IPC: Agent (CLI spawn) ─────────────────────

ipcMain.handle('agent:start', async (_e, p: StartParams & { providerId?: string }) => {
  if (!mainWindow) throw new Error('No window')
  const result = await startAgent({
    backendId: p.backendId,
    prompt: p.prompt,
    cwd: p.cwd,
    model: p.model,
    sessionId: p.sessionId,
    permissionMode: p.permissionMode ?? 'bypassPermissions',
    env: p.env,
  }, mainWindow)
  return { pid: result.pid, sessionId: result.sessionId }
})

ipcMain.handle('agent:permission', async () => { /* no-op in bypassPermissions mode */ })
ipcMain.handle('agent:send-message', async (_e, p: { pid: number; text: string }) => {
  if (!mainWindow) throw new Error('No window')
  sendUserMessage(p.pid, p.text, mainWindow)
})
ipcMain.handle('agent:kill', async (_e, pid: number) => killAgent(pid))
ipcMain.handle('agent:set-permission-mode', async (_e, pid: number, mode: string) => {
  // Runtime permission mode switching: local state only — CLI spawn locks mode at launch.
  // The frontend localStorage already tracks the mode for future sessions.
  console.log(`[agent:set-permission-mode] pid=${pid} mode=${mode} (no-op: mode locked at spawn)`)
})
ipcMain.handle('agent:list', async () => {
  const agents = listActiveAgents()
  return agents.map(a => ({ pid: a.pid, backendId: a.backendId, sessionId: a.sessionId }))
})

// ─── IPC: Backend ───────────────────────────────

ipcMain.handle('backend:list', async () => [
  { id: 'claude', name: 'Claude Code', description: 'Anthropic Claude Code (CLI)' },
  { id: 'codex', name: 'Codex CLI', description: 'OpenAI Codex CLI' },
  { id: 'gemini', name: 'Gemini CLI', description: 'Google Gemini CLI' },
  { id: 'hermes', name: 'Hermes Agent', description: 'Hermes Agent' },
  { id: 'opencode', name: 'OpenCode', description: 'OpenCode AI Coding Agent' },
  { id: 'openclaw', name: 'OpenClaw', description: 'OpenClaw AI Agent' },
])
ipcMain.handle('backend:detect', async (_event, backendId: string) => {
  if (backendId === 'claude') {
    return await claudeBackend.detect()
  }
  // Generic fallback: run `where <binary>` or `which <binary>`
  try {
    const cmd = process.platform === 'win32'
      ? `where ${backendId} 2>nul`
      : `which ${backendId} 2>/dev/null`
    const { execSync } = await import('child_process')
    const result = execSync(cmd, { encoding: 'utf-8' }).trim()
    return { installed: result.length > 0, path: result || undefined }
  } catch {
    return { installed: false, error: `Backend not found: ${backendId}` }
  }
})

// ─── IPC: Session (DB) ──────────────────────────

ipcMain.handle('session:list', async () => dbListSessions())
ipcMain.handle('session:get', async (_e, id: string) => ({ session: getSession(id), messages: [] }))
ipcMain.handle('session:create', async (_e, o: { backendId: string; cwd: string; model?: string }) => createSession(o.backendId, o.cwd, o.model))
ipcMain.handle('session:delete', async (_e, idOrParams: string | { id: string; sourcePath?: string; providerId?: string }) => {
  if (typeof idOrParams === 'string') {
    return deleteSession(idOrParams)
  }
  return deleteSession(idOrParams.id, { sourcePath: idOrParams.sourcePath, providerId: idOrParams.providerId })
})
ipcMain.handle('session:rename', async (_e, id: string, title: string) => renameSession(id, title))
ipcMain.handle('session:rename-scanned', async (_e, sessionId: string, title: string) => {
  // Rename in filesystem via DB rename (scanned sessions get synced)
  renameSession(sessionId, title)
})
ipcMain.handle('session:pin', async (_e, id: string, pinned: boolean) => pinSession(id, pinned))
ipcMain.handle('session:archive', async (_e, id: string) => archiveSession(id))

// ─── Session scanner (filesystem) ──────────────

ipcMain.handle('session:scan', async () => {
  const sessions = scanAll()
  return sessions.map(s => ({
    providerId: s.providerId,
    sessionId: s.sessionId,
    title: s.title || null,
    sourcePath: s.sourcePath,
    projectDir: s.projectDir || null,
    resumeCommand: s.resumeCommand || null,
    lastActiveAt: s.lastActiveAt || null,
  }))
})

ipcMain.handle('session:messages', async (_e, providerId: string, sessionId: string, sourcePath?: string) => {
  // Use sourcePath if provided (avoids re-scanning filesystem)
  const path = sourcePath || findSessionPath(providerId, sessionId)
  if (!path) return []
  return loadMessages(providerId, path)
})

// ─── Agent Config Reader ────────────────────────

ipcMain.handle('agent-config:scan', async () => scanAllAgents())
ipcMain.handle('agent-config:import', async () => {
  const agents = scanAllAgents()
  return agents.map(toApertureProvider)
})
ipcMain.handle('agent-config:debug', async () => debugAgentConfigs())

// ─── CC Switch Import (optional) ────────────────

ipcMain.handle('ccswitch:read-settings', async () => readCCSwitchSettings())
ipcMain.handle('ccswitch:read-providers', async () => readCCSwitchProviders())
ipcMain.handle('ccswitch:read-current-providers', async () => readCCSwitchCurrentProviders())
ipcMain.handle('ccswitch:read-usage', async (_e, days?: number) => readCCSwitchUsage(days ?? 90))
ipcMain.handle('ccswitch:test-read', async () => {
  const providers = await readCCSwitchProviders()
  return { count: providers.length, sample: providers.slice(0, 3).map(p => ({ id: p.id, name: p.name, appType: p.appType, isCurrent: p.isCurrent })) }
})
ipcMain.handle('ccswitch:debug-paths', async () => debugCCSwitch())

// ─── Stubs ─────────────────────────────────────

ipcMain.handle('provider:list', async () => [])
ipcMain.handle('provider:save', async () => {})
ipcMain.handle('provider:delete', async () => {})
ipcMain.handle('provider:test', async () => ({ success: false }))
ipcMain.handle('file:list', async () => [])
ipcMain.handle('file:read', async () => '')
ipcMain.handle('file:write', async () => {})
ipcMain.handle('settings:get', async () => null)
ipcMain.handle('settings:set', async () => {})
ipcMain.handle('app:getVersion', () => app.getVersion())
ipcMain.handle('app:getHome', () => homedir())
