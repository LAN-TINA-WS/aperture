// ═══════════════════════════════════════════════
// Aperture — Settings Store (CC Switch 1:1 完整集成)
//
// Provider: 完整 CC Switch Provider 模型
//   - settingsConfig 包含 auth + endpoint + models + apiFormat + headers + 高级
//   - meta: costMultiplier, customUserAgent, maxOutputTokens, endpointAutoSelect
//   - 预设系统: 65+ 内置 provider 预设
// Proxy: 完整代理 + 超时 + 熔断器 + 故障转移
// MCP: 服务器配置管理 + app 启用矩阵
// ═══════════════════════════════════════════════

import { create } from 'zustand'

/* ─── 基础类型 ─────────────────────────────────── */

export type BackendId = 'claude' | 'claude-desktop' | 'codex' | 'gemini' | 'opencode' | 'openclaw' | 'hermes'

export type ApiFormat = 'anthropic' | 'openai_chat' | 'openai_responses' | 'gemini_native'

export type ProviderCategory =
  | 'official' | 'cn_official' | 'cloud_provider'
  | 'aggregator' | 'third_party' | 'custom'

export type PromptCacheRoutingMode = 'auto' | 'enabled' | 'disabled'

/* ─── Provider Meta ────────────────────────────── */

export interface ProviderMeta {
  costMultiplier?: string
  customUserAgent?: string
  maxOutputTokens?: number
  endpointAutoSelect?: boolean
  pricingModelSource?: string
  apiFormat?: ApiFormat
  isFullUrl?: boolean
  promptCacheRouting?: PromptCacheRoutingMode
  commonConfigEnabled?: boolean
  authBinding?: { source: 'provider_config' | 'managed_account'; authProvider?: string; accountId?: string }
  claudeDesktopMode?: 'direct' | 'proxy'
  endpointCandidates?: string[]
  impersonateClaudeCode?: boolean
  codexFastMode?: boolean
  localProxyRequestOverrides?: { headers?: Record<string, string>; body?: Record<string, unknown> }
  providerType?: string
}

/* ─── Provider 配置 ────────────────────────────── */

export interface ProviderConfig {
  id: string
  backendId: BackendId
  name: string
  apiKey: string
  endpoint: string
  models: string[]
  enabled: boolean
  headers?: Record<string, string>
  meta?: ProviderMeta
  usageScript?: UsageScriptConfig
  sortIndex?: number
  notes?: string
  createdAt?: number
  // 预设相关
  category?: ProviderCategory
  websiteUrl?: string
  apiKeyUrl?: string
  icon?: string
  iconColor?: string
  isPartner?: boolean
  isOfficial?: boolean
  presetKey?: string
  inFailoverQueue?: boolean
}

export interface UsageScriptConfig {
  enabled: boolean
  scriptType?: 'custom' | 'general' | 'newapi' | 'token_plan' | 'balance' | 'official_subscription'
  url?: string
  apiKey?: string
  autoIntervalMinutes?: number
  headers?: Record<string, string>
  accessToken?: string
  userId?: string
  codingPlanProvider?: string
}

/* ─── Proxy ───────────────────────────────────── */

export interface ProxyConfig {
  enabled: boolean
  protocol: 'http' | 'https' | 'socks5'
  host: string
  port: number
  username?: string
  password?: string
  bypass?: string
  streamingFirstByteTimeout: number
  streamingIdleTimeout: number
  nonStreamingTimeout: number
  circuitFailureThreshold: number
  circuitSuccessThreshold: number
  circuitTimeoutSeconds: number
}

export interface FailoverConfig {
  enabled: boolean
  /** per-app failover queue (provider IDs ordered by priority) */
  queues: Partial<Record<BackendId, string[]>>
  failureThreshold: number
  successThreshold: number
  timeoutSeconds: number
}

/* ─── MCP ──────────────────────────────────────── */

export type McpTransportType = 'stdio' | 'http' | 'sse'

export interface McpServerSpec {
  type?: McpTransportType
  command?: string
  args?: string[]
  env?: Record<string, string>
  cwd?: string
  url?: string
  headers?: Record<string, string>
}

export interface McpApps {
  claude: boolean
  'claude-desktop'?: boolean
  codex: boolean
  gemini: boolean
  opencode: boolean
  openclaw: boolean
  hermes: boolean
}

export interface McpServer {
  id: string
  name: string
  server: McpServerSpec
  enabled?: boolean
  apps?: Partial<McpApps>
  tags?: string[]
  homepage?: string
  docs?: string
  description?: string
}

/* ─── Directory Overrides ─────────────────────── */

export interface DirectoryOverrides {
  claude?: string
  'claude-desktop'?: string
  codex?: string
  gemini?: string
  opencode?: string
  openclaw?: string
  hermes?: string
}

/* ─── General / Advanced Settings ──────────────── */

export type SkillSyncMethod = 'auto' | 'symlink' | 'copy'
export type SkillStorageLocation = 'cc_switch' | 'unified'

export interface GeneralSettings {
  theme: 'light' | 'dark'
  fontSize?: string   // 默认 '14px'，自由输入
  language: 'zh' | 'en'
  launchAtStartup: boolean
  visibleBackends: Record<BackendId, boolean>
  preferredTerminal?: string
  showInTray?: boolean
  minimizeToTrayOnClose?: boolean
  skillSyncMethod?: SkillSyncMethod
  skillStorageLocation?: SkillStorageLocation
  /** 是否显示故障转移开关 */
  enableFailoverToggle?: boolean
}

export interface AdvancedSettings {
  configDir?: string
  directoryOverrides?: DirectoryOverrides
  usagePollInterval: number
  logLevel: 'debug' | 'info' | 'warn' | 'error'
  backupIntervalHours: number
  backupRetainCount: number
  /** WebDAV / S3 sync (占位，后续对接) */
  webdavSync?: { enabled: boolean; autoSync: boolean; baseUrl?: string; username?: string; password?: string }
  s3Sync?: { enabled: boolean; autoSync: boolean; region?: string; bucket?: string; endpoint?: string }
}

/* ─── Provider Preset ──────────────────────────── */

export interface ProviderPreset {
  /** 预设唯一标识 */
  key: string
  /** 显示名称 */
  name: string
  /** 所属后端 */
  backendId: BackendId
  /** 网站链接 */
  websiteUrl: string
  /** 获取 API Key 链接 */
  apiKeyUrl?: string
  /** 默认 endpoint */
  endpoint: string
  /** 默认模型列表 */
  models: string[]
  /** API 格式 */
  apiFormat?: ApiFormat
  /** 分类 */
  category?: ProviderCategory
  /** 是否为官方 */
  isOfficial?: boolean
  /** 是否为合作伙伴 */
  isPartner?: boolean
  /** 置顶合作伙伴（顶级） */
  primePartner?: boolean
  /** 合作伙伴促销 key */
  partnerPromotionKey?: string
  /** 图标名称 */
  icon?: string
  /** 图标颜色 */
  iconColor?: string
  /** 是否在 UI 中隐藏 */
  hidden?: boolean
  /** API Key 字段名 */
  apiKeyField?: 'ANTHROPIC_AUTH_TOKEN' | 'ANTHROPIC_API_KEY'
  /** 端点候选列表（用于测速） */
  endpointCandidates?: string[]
  /** 模板变量 */
  templateValues?: Record<string, { label: string; placeholder: string; defaultValue?: string }>
  /** 专用描述 */
  description?: string
}

/* ─── Backend 基础配置 ─────────────────────────── */

export const BACKEND_DEFAULTS: Record<BackendId, { name: string; endpoint: string; models: string[]; description: string }> = {
  'claude':         { name: 'Claude Code',    endpoint: 'https://api.anthropic.com/v1/messages',          models: ['claude-sonnet-5', 'claude-opus-4-8'],       description: 'Anthropic Claude Code CLI' },
  'claude-desktop': { name: 'Claude Desktop', endpoint: 'https://api.anthropic.com/v1/messages',          models: ['claude-sonnet-5'],                            description: 'Claude Desktop App' },
  'codex':          { name: 'Codex CLI',      endpoint: 'https://api.openai.com/v1/chat/completions',     models: ['gpt-5.5', 'gpt-5.5-mini'],                  description: 'OpenAI Codex CLI' },
  'gemini':         { name: 'Gemini CLI',     endpoint: 'https://generativelanguage.googleapis.com/v1beta', models: ['gemini-3.5-flash', 'gemini-3.5-pro'],       description: 'Google Gemini CLI' },
  'hermes':         { name: 'Hermes Agent',   endpoint: 'https://api.openai.com/v1/chat/completions',     models: ['deepseek-v4-pro', 'gpt-5.5'],               description: 'Hermes Agent' },
  'opencode':       { name: 'OpenCode',       endpoint: 'https://api.openai.com/v1/chat/completions',     models: ['gpt-5.5', 'claude-sonnet-5'],               description: 'OpenCode AI Coding Agent' },
  'openclaw':       { name: 'OpenClaw',       endpoint: 'https://api.openai.com/v1/chat/completions',     models: ['gpt-5.5', 'gemini-3.5-pro'],                description: 'OpenClaw AI Agent' },
}

export const BACKEND_LIST: BackendId[] = ['claude', 'codex', 'gemini', 'hermes', 'opencode', 'openclaw']

/* ─── Store ─────────────────────────────────── */

interface SettingsState {
  providers: ProviderConfig[]
  proxy: ProxyConfig
  failover: FailoverConfig
  general: GeneralSettings
  advanced: AdvancedSettings
  mcpServers: McpServer[]
  agentCwd: string   // Claude Code 项目目录

  // Provider CRUD
  addProvider: (p: Omit<ProviderConfig, 'id' | 'createdAt'>) => string
  updateProvider: (id: string, patch: Partial<ProviderConfig>) => void
  removeProvider: (id: string) => void

  // Proxy
  setProxy: (p: Partial<ProxyConfig>) => void

  // Failover
  setFailover: (f: Partial<FailoverConfig>) => void
  toggleFailoverForBackend: (bid: BackendId, enabled: boolean) => void

  // General
  setGeneral: (g: Partial<GeneralSettings>) => void

  // Advanced
  setAdvanced: (a: Partial<AdvancedSettings>) => void

  // Agent CWD
  setAgentCwd: (cwd: string) => void

  // MCP
  addMcpServer: (s: Omit<McpServer, 'id'>) => string
  updateMcpServer: (id: string, patch: Partial<McpServer>) => void
  removeMcpServer: (id: string) => void
  toggleMcpApp: (serverId: string, app: keyof McpApps, enabled: boolean) => void

  // Persistence
  load: () => void
  save: () => void

  // Export/Import
  exportConfig: () => string
  importConfig: (json: string) => boolean
}

const STORAGE_KEY = 'aperture-settings'
let _idCounter = 1

const defaultProxy: ProxyConfig = {
  enabled: false, protocol: 'http', host: '', port: 7890,
  username: '', password: '', bypass: 'localhost,127.0.0.1',
  streamingFirstByteTimeout: 30, streamingIdleTimeout: 120, nonStreamingTimeout: 300,
  circuitFailureThreshold: 5, circuitSuccessThreshold: 2, circuitTimeoutSeconds: 30,
}

const defaultGeneral: GeneralSettings = {
  theme: 'light', fontSize: '14px', language: 'zh', launchAtStartup: false,
  visibleBackends: { claude: true, 'claude-desktop': false, codex: true, gemini: true, hermes: true, opencode: true, openclaw: true },
  showInTray: true, minimizeToTrayOnClose: true,
  skillSyncMethod: 'auto', skillStorageLocation: 'cc_switch',
  enableFailoverToggle: false,
}

const defaultAdvanced: AdvancedSettings = {
  usagePollInterval: 60, logLevel: 'info',
  backupIntervalHours: 24, backupRetainCount: 10,
}

const defaultFailover: FailoverConfig = {
  enabled: false,
  queues: {},
  failureThreshold: 5,
  successThreshold: 2,
  timeoutSeconds: 30,
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  providers: [],
  proxy: { ...defaultProxy },
  failover: { ...defaultFailover },
  general: { ...defaultGeneral },
  advanced: { ...defaultAdvanced },
  mcpServers: [],
  agentCwd: 'D:\\Deploy\\Claude Code',

  // ─── Provider CRUD ───

  addProvider: (p) => {
    const id = `prov_${_idCounter++}_${Date.now()}`
    set((s) => ({ providers: [...s.providers, { ...p, id, createdAt: Date.now() }] }))
    get().save()
    return id
  },
  updateProvider: (id, patch) => {
    set((s) => ({ providers: s.providers.map((p) => (p.id === id ? { ...p, ...patch } : p)) }))
    get().save()
  },
  removeProvider: (id) => {
    set((s) => ({ providers: s.providers.filter((p) => p.id !== id) }))
    get().save()
  },

  // ─── Proxy ───

  setProxy: (p) => { set((s) => ({ proxy: { ...s.proxy, ...p } })); get().save() },

  // ─── Failover ───

  setFailover: (f) => { set((s) => ({ failover: { ...s.failover, ...f } })); get().save() },
  toggleFailoverForBackend: (bid, enabled) => {
    set((s) => {
      const queues = { ...s.failover.queues }
      if (enabled) {
        // auto-populate with enabled providers for this backend
        const pids = s.providers.filter((p) => p.backendId === bid && p.enabled).map((p) => p.id)
        queues[bid] = pids
      } else {
        delete queues[bid]
      }
      return { failover: { ...s.failover, queues } }
    })
    get().save()
  },

  // ─── General ───

  setGeneral: (g) => { set((s) => ({ general: { ...s.general, ...g } })); setTimeout(() => get().save(), 0) },

  // ─── Advanced ───

  setAdvanced: (a) => { set((s) => ({ advanced: { ...s.advanced, ...a } })); get().save() },

  // ─── Agent CWD ───

  setAgentCwd: (cwd) => { set({ agentCwd: cwd }); get().save() },

  // ─── MCP ───

  addMcpServer: (s) => {
    const id = `mcp_${_idCounter++}_${Date.now()}`
    set((st) => ({ mcpServers: [...st.mcpServers, { ...s, id }] }))
    get().save()
    return id
  },
  updateMcpServer: (id, patch) => {
    set((st) => ({ mcpServers: st.mcpServers.map((m) => (m.id === id ? { ...m, ...patch } : m)) }))
    get().save()
  },
  removeMcpServer: (id) => {
    set((st) => ({ mcpServers: st.mcpServers.filter((m) => m.id !== id) }))
    get().save()
  },
  toggleMcpApp: (serverId, app, enabled) => {
    set((st) => ({
      mcpServers: st.mcpServers.map((m) =>
        m.id === serverId
          ? { ...m, apps: { ...(m.apps ?? {}), [app]: enabled } as McpApps }
          : m
      )
    }))
    get().save()
  },

  // ─── Persistence ───

  load: () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const data = JSON.parse(raw)
        console.log('[Aperture] load general.fontSize:', data.general?.fontSize)
        set({
          providers: data.providers ?? [],
          proxy: { ...defaultProxy, ...data.proxy },
          failover: { ...defaultFailover, ...data.failover },
          general: { ...defaultGeneral, ...data.general, fontSize: data.general?.fontSize === 'medium' ? '14px' : (data.general?.fontSize || '14px') },
          advanced: { ...defaultAdvanced, ...data.advanced },
          mcpServers: data.mcpServers ?? [],
          agentCwd: data.agentCwd ?? 'D:\\Deploy\\Claude Code',
        })
      }
    } catch { /* ignore */ }
  },
  save: () => {
    const { providers, proxy, failover, general, advanced, mcpServers, agentCwd } = get()
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ providers, proxy, failover, general, advanced, mcpServers, agentCwd }))
  },

  // ─── Export/Import ───

  exportConfig: () => {
    const { providers, proxy, failover, general, advanced, mcpServers, agentCwd } = get()
    return JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), providers, proxy, failover, general, advanced, mcpServers, agentCwd }, null, 2)
  },
  importConfig: (json) => {
    try {
      const data = JSON.parse(json)
      if (data.providers) set({ providers: data.providers })
      if (data.proxy) set((s) => ({ proxy: { ...s.proxy, ...data.proxy } }))
      if (data.failover) set((s) => ({ failover: { ...s.failover, ...data.failover } }))
      if (data.general) set((s) => ({ general: { ...s.general, ...data.general } }))
      if (data.advanced) set((s) => ({ advanced: { ...s.advanced, ...data.advanced } }))
      if (data.mcpServers) set({ mcpServers: data.mcpServers })
      if (data.agentCwd) set({ agentCwd: data.agentCwd })
      get().save()
      return true
    } catch {
      return false
    }
  },
}))
