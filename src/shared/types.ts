// ═══════════════════════════════════════════════
// Aperture — Shared Types
// Used by both Main process and Renderer
// ═══════════════════════════════════════════════

// ─── Agent Backend ─────────────────────────────

export type PermissionMode = 'ask' | 'code' | 'plan' | 'bypass'
export type ThinkingLevel = 'off' | 'low' | 'medium' | 'high' | 'max'

export interface StartParams {
  backendId: string
  prompt: string
  cwd: string
  model?: string
  sessionId?: string
  permissionMode?: PermissionMode
  thinkingLevel?: ThinkingLevel
  providerId?: string
  env?: Record<string, string>
}

export interface SpawnCommand {
  command: string
  args: string[]
  cwd: string
  env?: Record<string, string>
}

export interface DetectResult {
  installed: boolean
  path?: string
  version?: string
  error?: string
}

export interface InstallResult {
  success: boolean
  error?: string
}

// ─── Agent Events (standardized) ───────────────

export type AgentEvent =
  | { type: 'thinking'; text: string }
  | { type: 'content'; text: string }
  | { type: 'tool_use'; id: string; name: string; input: unknown }
  | { type: 'tool_result'; id: string; content: string; isError?: boolean }
  | { type: 'permission'; requestId: string; toolName: string; input: unknown; description?: string }
  | { type: 'system'; subtype: 'init' | 'model_change' | 'mode_change'; data: unknown }
  | { type: 'error'; message: string; fatal?: boolean }
  | { type: 'done'; exitCode?: number; usage?: { input_tokens: number; output_tokens: number; cache_creation_input_tokens?: number; cache_read_input_tokens?: number }; cost?: number }

// ─── Session ───────────────────────────────────

export interface Session {
  id: string
  title: string | null
  backendId: string
  providerId: string | null
  cwd: string
  model: string | null
  permission: PermissionMode
  status: 'active' | 'archived'
  pinned: boolean
  messageCount: number
  createdAt: string
  updatedAt: string
}

export interface Message {
  id: number
  sessionId: string
  role: 'user' | 'assistant' | 'system'
  content: string | null
  thinking: string | null
  toolCalls: ToolCall[] | null
  toolResults: ToolResult[] | null
  tokenCount: number | null
  createdAt: string
}

export interface ToolCall {
  id: string
  name: string
  input: unknown
}

export interface ToolResult {
  id: string
  content: string
  isError?: boolean
}

// ─── Provider ──────────────────────────────────

export interface Provider {
  id: string
  name: string
  backendId: string
  apiUrl: string | null
  model: string | null
  extraConfig: Record<string, unknown> | null
  isDefault: boolean
  sortOrder: number
}

export interface ProviderInput {
  name: string
  backendId: string
  apiUrl?: string
  apiKey?: string
  model?: string
  extraConfig?: Record<string, unknown>
}

export interface TestResult {
  success: boolean
  latencyMs?: number
  error?: string
}

// ─── Backend Meta ──────────────────────────────

export interface BackendMeta {
  id: string
  name: string
  description: string
  installed: boolean
  version?: string
}

// ─── File ──────────────────────────────────────

export interface FileNode {
  name: string
  path: string
  isDirectory: boolean
  size?: number
  modifiedAt?: string
  children?: FileNode[]
}

// ─── Settings ──────────────────────────────────

export interface AppSettings {
  theme: 'light' | 'dark' | 'system'
  fontSize: number
  language: 'zh' | 'en'
  proxyUrl: string | null
  defaultBackend: string | null
  sidebarWidth: number
  detailPanelWidth: number
}

// ─── IPC Channel Names ─────────────────────────

export const IPC = {
  // Agent
  AGENT_START: 'agent:start',
  AGENT_KILL: 'agent:kill',
  AGENT_RESUME: 'agent:resume',
  AGENT_PERMISSION: 'agent:permission',
  AGENT_CONTROL: 'agent:control',
  AGENT_LIST: 'agent:list',

  // Session
  SESSION_LIST: 'session:list',
  SESSION_GET: 'session:get',
  SESSION_DELETE: 'session:delete',
  SESSION_RENAME: 'session:rename',
  SESSION_PIN: 'session:pin',
  SESSION_ARCHIVE: 'session:archive',
  SESSION_EXPORT: 'session:export',

  // Provider
  PROVIDER_LIST: 'provider:list',
  PROVIDER_SAVE: 'provider:save',
  PROVIDER_DELETE: 'provider:delete',
  PROVIDER_TEST: 'provider:test',

  // Backend
  BACKEND_LIST: 'backend:list',
  BACKEND_DETECT: 'backend:detect',
  BACKEND_INSTALL: 'backend:install',

  // File
  FILE_LIST: 'file:list',
  FILE_READ: 'file:read',
  FILE_WRITE: 'file:write',

  // Settings
  SETTINGS_GET: 'settings:get',
  SETTINGS_SET: 'settings:set',

  // App
  APP_VERSION: 'app:getVersion',
  APP_UPDATE: 'app:checkUpdate',

  // Stream (Main → Renderer push)
  STREAM_EVENT: 'stream:event',
  STREAM_DONE: 'stream:done',
  STREAM_ERROR: 'stream:error',
  FILE_CHANGED: 'file:changed',
  APP_UPDATE_AVAILABLE: 'app:updateAvailable'
} as const
