// ═══════════════════════════════════════════════
// Aperture — CC Switch Config Reader (SQLite)
//
// 读取 ~/.cc-switch/cc-switch.db (SQLite)
// Provider 数据在 providers 表中，is_current 标记当前活跃
// ═══════════════════════════════════════════════

import { readFileSync, existsSync } from 'fs'
import { join } from 'path'
import { homedir } from 'os'
import initSqlJs, { type Database } from 'sql.js'

const CC_SWITCH_DIR = join(homedir(), '.cc-switch')
const DB_PATH = join(CC_SWITCH_DIR, 'cc-switch.db')

/* ─── 类型 ────────────────────────────────────── */

export interface CCSwitchProvider {
  id: string
  appType: string
  name: string
  settingsConfig: Record<string, unknown>
  websiteUrl?: string
  category?: string
  createdAt?: number
  sortIndex?: number
  notes?: string
  icon?: string
  iconColor?: string
  meta: Record<string, unknown>
  isCurrent: boolean
  inFailoverQueue: boolean
  costMultiplier: string
}

export interface UsageRow {
  date: string
  input_tokens: number
  output_tokens: number
  request_count: number
  total_cost_usd: string
}

export interface CCSwitchSettings {
  showInTray?: boolean
  language?: string
  currentProviderClaude?: string
  currentProviderCodex?: string
  currentProviderGemini?: string
  skillSyncMethod?: string
  skillStorageLocation?: string
  preferredTerminal?: string
  [key: string]: unknown
}

/* ─── sql.js 单例 ─────────────────────────────── */

let _SQL: Awaited<ReturnType<typeof initSqlJs>> | null = null

async function getSQL() {
  if (!_SQL) _SQL = await initSqlJs()
  return _SQL
}

/* ─── 读取函数 ────────────────────────────────── */

export function readCCSwitchSettings(): CCSwitchSettings | null {
  const path = join(CC_SWITCH_DIR, 'settings.json')
  try {
    if (!existsSync(path)) return null
    return JSON.parse(readFileSync(path, 'utf-8'))
  } catch { return null }
}

export async function readCCSwitchProviders(): Promise<CCSwitchProvider[]> {
  if (!existsSync(DB_PATH)) return []
  try {
    const SQL = await getSQL()
    const buf = readFileSync(DB_PATH)
    const db = new SQL.Database(buf)
    const rows = db.exec('SELECT * FROM providers ORDER BY app_type, sort_index')
    db.close()
    if (!rows.length) return []

    const cols = rows[0].columns
    return rows[0].values.map((row: any[]) => {
      const p: Record<string, any> = {}
      cols.forEach((col: string, i: number) => { p[col] = row[i] })
      return {
        id: p.id,
        appType: p.app_type,
        name: p.name,
        settingsConfig: safeJSON(p.settings_config, {}),
        websiteUrl: p.website_url || undefined,
        category: p.category || undefined,
        createdAt: p.created_at || undefined,
        sortIndex: p.sort_index || undefined,
        notes: p.notes || undefined,
        icon: p.icon || undefined,
        iconColor: p.icon_color || undefined,
        meta: safeJSON(p.meta, {}),
        isCurrent: Boolean(p.is_current),
        inFailoverQueue: Boolean(p.in_failover_queue),
        costMultiplier: p.cost_multiplier || '1.0',
      } as CCSwitchProvider
    })
  } catch (err) {
    console.error('[ccswitch-reader] DB error:', err)
    return []
  }
}

export async function readCCSwitchCurrentProviders(): Promise<Record<string, CCSwitchProvider | undefined>> {
  const providers = await readCCSwitchProviders()
  const result: Record<string, CCSwitchProvider | undefined> = {}
  const seen = new Set<string>()
  for (const p of providers) {
    if (p.isCurrent) result[p.appType] = p
  }
  if (Object.keys(result).length === 0) {
    for (const p of providers) {
      if (!seen.has(p.appType)) { seen.add(p.appType); result[p.appType] = p }
    }
  }
  return result
}

/* ─── 映射 ────────────────────────────────────── */

export function mapCCSwitchToAperture(ccs: CCSwitchProvider): {
  backendId: string; name: string; endpoint: string; apiKey: string
  models: string[]; category?: string; websiteUrl?: string
  icon?: string; iconColor?: string; notes?: string; enabled: boolean
} {
  const cfg = ccs.settingsConfig
  let endpoint = '', apiKey = ''
  let models: string[] = []

  if (cfg.env && typeof cfg.env === 'object') {
    const env = cfg.env as Record<string, string>
    endpoint = env.ANTHROPIC_BASE_URL || env.GOOGLE_GEMINI_BASE_URL || env.OPENAI_BASE_URL || ''
    apiKey = env.ANTHROPIC_AUTH_TOKEN || env.ANTHROPIC_API_KEY || env.GEMINI_API_KEY || env.OPENAI_API_KEY || ''
    const m = env.ANTHROPIC_MODEL || env.GEMINI_MODEL || env.OPENAI_MODEL || ''
    if (m) models = [m]
  }
  if ((cfg as any).baseUrl || (cfg as any).base_url) {
    endpoint = (cfg as any).baseUrl || (cfg as any).base_url || endpoint
    apiKey = (cfg as any).apiKey || (cfg as any).api_key || apiKey
    if (Array.isArray((cfg as any).models)) {
      models = (cfg as any).models.map((m: any) => typeof m === 'string' ? m : m.id).filter(Boolean)
    }
  }
  if (cfg.auth && typeof cfg.auth === 'object') {
    apiKey = (cfg.auth as Record<string, string>).OPENAI_API_KEY || apiKey
  }

  return {
    backendId: ccs.appType === 'claude-desktop' ? 'claude-desktop' : ccs.appType,
    name: ccs.name, endpoint, apiKey, models,
    category: ccs.category, websiteUrl: ccs.websiteUrl,
    icon: ccs.icon, iconColor: ccs.iconColor, notes: ccs.notes,
    enabled: true,
  }
}

export async function readCCSwitchAsAperture(): Promise<ReturnType<typeof mapCCSwitchToAperture>[]> {
  return (await readCCSwitchProviders()).map(mapCCSwitchToAperture)
}

/* ─── 调试 ────────────────────────────────────── */

export async function debugCCSwitch(): Promise<Record<string, unknown>> {
  return {
    dbExists: existsSync(DB_PATH),
    dbSize: existsSync(DB_PATH) ? readFileSync(DB_PATH).length : 0,
    settingsExists: existsSync(join(CC_SWITCH_DIR, 'settings.json')),
    providerCount: (await readCCSwitchProviders()).length,
  }
}

/* ─── 用量读取 ────────────────────────────────── */

/**
 * 从 CC Switch SQLite 读取用量数据
 * 优先查 usage_daily_rollups，为空时 fallback 到 proxy_request_logs 聚合
 * 按日期聚合 input_tokens, output_tokens, request_count, total_cost_usd
 * 返回最近 days 天的数据
 */
export async function readCCSwitchUsage(days = 90): Promise<UsageRow[]> {
  if (!existsSync(DB_PATH)) return []
  try {
    const SQL = await getSQL()
    const buf = readFileSync(DB_PATH)
    const db = new SQL.Database(buf)

    // 计算日期范围：最近 days 天
    const endDate = new Date()
    endDate.setDate(endDate.getDate() + 1) // 包含今天
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const startStr = startDate.toISOString().slice(0, 10)
    const endStr = endDate.toISOString().slice(0, 10)

    // 1. 先查 rollups
    let result = db.exec(
      `SELECT
        date,
        SUM(input_tokens) AS input_tokens,
        SUM(output_tokens) AS output_tokens,
        SUM(request_count) AS request_count,
        SUM(CAST(total_cost_usd AS REAL)) AS total_cost_usd
      FROM usage_daily_rollups
      WHERE date >= ? AND date < ?
      GROUP BY date
      ORDER BY date ASC`,
      [startStr, endStr],
    )

    // 2. rollups 为空 → fallback 到 proxy_request_logs 聚合
    if (!result.length || !result[0].values.length) {
      const startTs = Math.floor(startDate.getTime() / 1000)
      const endTs = Math.floor(endDate.getTime() / 1000)

      result = db.exec(
        `SELECT
          date(created_at, 'unixepoch') AS date,
          SUM(input_tokens) AS input_tokens,
          SUM(output_tokens) AS output_tokens,
          COUNT(*) AS request_count,
          SUM(CAST(total_cost_usd AS REAL)) AS total_cost_usd
        FROM proxy_request_logs
        WHERE created_at >= ? AND created_at < ?
        GROUP BY date(created_at, 'unixepoch')
        ORDER BY date ASC`,
        [startTs, endTs],
      )
    }

    db.close()

    if (!result.length || !result[0].values.length) return []

    return result[0].values.map((row: any[]) => ({
      date: String(row[0]),
      input_tokens: Number(row[1]),
      output_tokens: Number(row[2]),
      request_count: Number(row[3]),
      total_cost_usd: String(row[4]),
    }))
  } catch (err) {
    console.error('[ccswitch-reader] readCCSwitchUsage error:', err)
    return []
  }
}

function safeJSON(raw: string, fallback: any): any {
  try { return JSON.parse(raw) } catch { return fallback }
}
