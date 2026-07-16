// ═══════════════════════════════════════════════
// Aperture — Agent Config Reader
//
// 直接读取各 AI Agent 的原生配置文件（不依赖 CC Switch）
// Claude Code → ~/.claude/settings.json
// Codex CLI   → ~/.codex/auth.json + config.toml
// ═══════════════════════════════════════════════

import { readFileSync, existsSync } from 'fs'
import { join } from 'path'
import { homedir } from 'os'

const HOME = homedir()

/* ─── 类型 ────────────────────────────────────── */

export interface AgentProviderInfo {
  agentId: string           // claude | codex | gemini | hermes | opencode | openclaw
  agentName: string
  providerName: string      // 推断的 provider 名称
  endpoint: string
  apiKey: string            // 部分遮蔽 (sk-****xxxx)
  apiKeyFull?: string       // 仅在需要时提供完整 key
  models: string[]
  rawConfig: Record<string, unknown>
  installed: boolean
}

/* ─── Claude Code ─────────────────────────────── */

const CLAUDE_DIR = join(HOME, '.claude')
const CLAUDE_SETTINGS = join(CLAUDE_DIR, 'settings.json')

function readClaudeCode(): AgentProviderInfo | null {
  if (!existsSync(CLAUDE_SETTINGS)) return null
  try {
    const raw = JSON.parse(readFileSync(CLAUDE_SETTINGS, 'utf-8'))
    const env = raw.env || {}
    const endpoint = env.ANTHROPIC_BASE_URL || ''
    const apiKey = env.ANTHROPIC_AUTH_TOKEN || env.ANTHROPIC_API_KEY || ''
    const models = [
      env.ANTHROPIC_MODEL,
      env.ANTHROPIC_DEFAULT_SONNET_MODEL,
      env.ANTHROPIC_DEFAULT_OPUS_MODEL,
      env.ANTHROPIC_DEFAULT_HAIKU_MODEL,
    ].filter(Boolean)

    // 从 endpoint 推断 provider 名称
    const providerName = guessProvider(endpoint, 'Claude Code')

    return {
      agentId: 'claude',
      agentName: 'Claude Code',
      providerName,
      endpoint,
      apiKey: maskKey(apiKey),
      apiKeyFull: apiKey || undefined,
      models: [...new Set(models)] as string[],
      rawConfig: { env },
      installed: true,
    }
  } catch { return null }
}

/* ─── Codex CLI ───────────────────────────────── */

const CODEX_DIR = join(HOME, '.codex')
const CODEX_AUTH = join(CODEX_DIR, 'auth.json')

function readCodexCli(): AgentProviderInfo | null {
  if (!existsSync(CODEX_AUTH)) return null
  try {
    const auth = JSON.parse(readFileSync(CODEX_AUTH, 'utf-8'))
    const authMode = auth.auth_mode || 'unknown'

    // Codex 通过 OAuth (ChatGPT) 登录，没有直接的 API key
    // 但可以检测是否已登录
    const loggedIn = !!(auth.tokens?.access_token)

    return {
      agentId: 'codex',
      agentName: 'Codex CLI',
      providerName: authMode === 'chatgpt' ? 'OpenAI (ChatGPT OAuth)' : authMode,
      endpoint: 'https://api.openai.com/v1',
      apiKey: loggedIn ? 'OAuth (已登录)' : '',
      models: [],
      rawConfig: { auth_mode: authMode, logged_in: loggedIn },
      installed: true,
    }
  } catch { return null }
}

/* ─── 扫描所有 Agent ──────────────────────────── */

export function scanAllAgents(): AgentProviderInfo[] {
  const results: AgentProviderInfo[] = []
  const claude = readClaudeCode()
  if (claude) results.push(claude)
  const codex = readCodexCli()
  if (codex) results.push(codex)
  return results
}

/** 转换为 Aperture ProviderConfig 格式 */
export function toApertureProvider(info: AgentProviderInfo) {
  return {
    backendId: info.agentId,
    name: info.providerName,
    endpoint: info.endpoint,
    apiKey: info.apiKeyFull || '',
    models: info.models.length > 0 ? info.models : ['default'],
    enabled: true,
    category: info.agentId === 'codex' ? 'official' : undefined,
    icon: info.agentId === 'claude' ? 'anthropic' : 'openai',
    notes: `从 ${info.agentName} 原生配置读取`,
  }
}

/* ─── 工具 ────────────────────────────────────── */

function maskKey(key: string): string {
  if (!key) return ''
  if (key.length <= 12) return key.slice(0, 4) + '****'
  return key.slice(0, 8) + '••••' + key.slice(-4)
}

function guessProvider(endpoint: string, fallback: string): string {
  const u = endpoint.toLowerCase()
  if (u.includes('deepseek')) return 'DeepSeek'
  if (u.includes('anthropic')) return 'Anthropic (Official)'
  if (u.includes('openai')) return 'OpenAI'
  if (u.includes('openrouter')) return 'OpenRouter'
  if (u.includes('shengsuanyun')) return 'Shengsuanyun'
  if (u.includes('volces') || u.includes('ark')) return '火山引擎'
  if (u.includes('moonshot') || u.includes('kimi')) return 'Kimi'
  if (u.includes('bigmodel') || u.includes('zhipu')) return 'Zhipu GLM'
  return fallback
}

export function debugAgentConfigs() {
  return {
    claude: existsSync(CLAUDE_SETTINGS) ? readClaudeCode()?.providerName : 'not found',
    codex: existsSync(CODEX_AUTH) ? readCodexCli()?.providerName : 'not found',
  }
}
