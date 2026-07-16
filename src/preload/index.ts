import { contextBridge, ipcRenderer } from 'electron'

// ─── Type-safe IPC bridge ────────────────────────────

const api = {
  // Agent
  agent: {
    start: (params: unknown) => ipcRenderer.invoke('agent:start', params),
    kill: (pid: number) => ipcRenderer.invoke('agent:kill', pid),
    resume: (params: unknown) => ipcRenderer.invoke('agent:resume', params),
    permission: (response: unknown) => ipcRenderer.invoke('agent:permission', response),
    control: (action: unknown) => ipcRenderer.invoke('agent:control', action),
    list: () => ipcRenderer.invoke('agent:list'),
    sendMessage: (params: { pid: number; text: string }) => ipcRenderer.invoke('agent:send-message', params),
    setPermissionMode: (pid: number, mode: string) => ipcRenderer.invoke('agent:set-permission-mode', pid, mode),
  },

  // Session
  session: {
    list: () => ipcRenderer.invoke('session:list'),
    get: (id: string) => ipcRenderer.invoke('session:get', id),
    create: (opts: unknown) => ipcRenderer.invoke('session:create', opts),
    delete: (id: string) => ipcRenderer.invoke('session:delete', id),
    rename: (id: string, title: string) => ipcRenderer.invoke('session:rename', id, title),
    renameScanned: (sessionId: string, title: string) => ipcRenderer.invoke('session:rename-scanned', sessionId, title),
    pin: (id: string, pinned: boolean) => ipcRenderer.invoke('session:pin', id, pinned),
    archive: (id: string) => ipcRenderer.invoke('session:archive', id)
  },

  // Session scanner
  scanner: {
    scan: () => ipcRenderer.invoke('session:scan'),
    messages: (providerId: string, sessionId: string) => ipcRenderer.invoke('session:messages', providerId, sessionId)
  },

  // Provider
  provider: {
    list: () => ipcRenderer.invoke('provider:list'),
    save: (p: unknown) => ipcRenderer.invoke('provider:save', p),
    delete: (id: string) => ipcRenderer.invoke('provider:delete', id),
    test: (id: string) => ipcRenderer.invoke('provider:test', id)
  },

  // Backend
  backend: {
    list: () => ipcRenderer.invoke('backend:list'),
    detect: (id: string) => ipcRenderer.invoke('backend:detect', id),
    install: (id: string) => ipcRenderer.invoke('backend:install', id)
  },

  // File
  file: {
    list: (dir: string) => ipcRenderer.invoke('file:list', dir),
    read: (path: string) => ipcRenderer.invoke('file:read', path),
    write: (path: string, content: string) => ipcRenderer.invoke('file:write', path, content)
  },

  // Settings
  settings: {
    get: (key: string) => ipcRenderer.invoke('settings:get', key),
    set: (key: string, value: unknown) => ipcRenderer.invoke('settings:set', key, value)
  },

  // Agent Config Reader (原生配置读取)
  agentConfig: {
    scan: () => ipcRenderer.invoke('agent-config:scan'),
    import: () => ipcRenderer.invoke('agent-config:import'),
    debug: () => ipcRenderer.invoke('agent-config:debug'),
  },

  // CC Switch Integration (optional import)
  ccswitch: {
    readSettings: () => ipcRenderer.invoke('ccswitch:read-settings'),
    readProviders: () => ipcRenderer.invoke('ccswitch:read-providers'),
    readCurrentProviders: () => ipcRenderer.invoke('ccswitch:read-current-providers'),
    readAperture: () => ipcRenderer.invoke('ccswitch:read-aperture'),
    readUsage: (days?: number) => ipcRenderer.invoke('ccswitch:read-usage', days),
    debugPaths: () => ipcRenderer.invoke('ccswitch:debug-paths'),
  },

  // System
  app: {
    getVersion: () => ipcRenderer.invoke('app:getVersion'),
    getHome: () => ipcRenderer.invoke('app:getHome'),
    openPath: (p: string) => ipcRenderer.invoke('app:open-path', p),
    minimize: () => ipcRenderer.invoke('window:minimize'),
    maximize: () => ipcRenderer.invoke('window:maximize'),
    close: () => ipcRenderer.invoke('window:close')
  },

  // Stream listeners (Main → Renderer push)
  onStreamEvent: (cb: (event: unknown) => void) => {
    const handler = (_: unknown, data: unknown) => cb(data)
    ipcRenderer.on('stream:event', handler)
    return () => ipcRenderer.removeListener('stream:event', handler)
  },
  onStreamDone: (cb: (data: unknown) => void) => {
    const handler = (_: unknown, data: unknown) => cb(data)
    ipcRenderer.on('stream:done', handler)
    return () => ipcRenderer.removeListener('stream:done', handler)
  },
  onStreamError: (cb: (data: unknown) => void) => {
    const handler = (_: unknown, data: unknown) => cb(data)
    ipcRenderer.on('stream:error', handler)
    return () => ipcRenderer.removeListener('stream:error', handler)
  },
  onFileChanged: (cb: (data: unknown) => void) => {
    const handler = (_: unknown, data: unknown) => cb(data)
    ipcRenderer.on('file:changed', handler)
    return () => ipcRenderer.removeListener('file:changed', handler)
  }
}

contextBridge.exposeInMainWorld('api', api)

export type ApertureAPI = typeof api
