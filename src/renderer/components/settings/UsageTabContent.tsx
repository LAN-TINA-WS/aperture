// ═══════════════════════════════════════════════
// Aperture — Usage Tab (用量查询配置)
// ═══════════════════════════════════════════════

import { useState } from 'react'
import { useSettingsStore, type ProviderConfig } from '../../stores/settingsStore'
import { SectionHeader } from './primitives'

interface Props {
  /** 可选：从外部传入providers列表（如果parent已有） */
  providers?: ProviderConfig[]
}

export default function UsageTabContent({ providers: extProviders }: Props) {
  const storeProviders = useSettingsStore((s) => s.providers)
  const updateProvider = useSettingsStore((s) => s.updateProvider)
  const providers = extProviders ?? storeProviders

  const [expandedId, setExpandedId] = useState<string | null>(null)

  return (
    <div className="space-y-4">
      {/* ── Section Header ── */}
      <SectionHeader title="用量统计" subtitle="配置用量查询脚本和 API 端点" />

      {/* 用量统计总览（占位） */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        {[
          { label: '今日 Token', value: '—', hint: '需配置用量查询' },
          { label: '本月花费', value: '—', hint: '需配置用量查询' },
          { label: '总请求数', value: '—', hint: '需配置用量查询' },
          { label: '活跃 Provider', value: `${providers.filter((p) => p.enabled).length}`, hint: '' },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-sm border p-4 text-center"
            style={{ borderColor: 'var(--ap-border)' }}
          >
            <div className="text-2xl font-bold">{s.value}</div>
            <div className="text-xs mt-1" style={{ color: 'var(--ap-muted-foreground)' }}>
              {s.label}
            </div>
            {s.hint && (
              <div className="text-[10px] mt-0.5" style={{ color: 'var(--ap-muted-foreground)', opacity: 0.6 }}>
                {s.hint}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Provider 用量配置列表 */}
      <div>
        <h4 className="text-sm font-medium mb-2">Provider 用量脚本</h4>
        {providers.length === 0 ? (
          <p className="text-xs" style={{ color: 'var(--ap-muted-foreground)' }}>
            暂无 Provider。请先在「API 配置」中添加 Provider，然后在此处配置用量查询。
          </p>
        ) : (
          <div className="space-y-3">
            {providers.filter((p) => p.enabled).map((p) => (
              <UsageProviderCard
                key={p.id}
                provider={p}
                expanded={expandedId === p.id}
                onToggle={() => setExpandedId(expandedId === p.id ? null : p.id)}
                onSave={(script) => {
                  updateProvider(p.id, { usageScript: script })
                  setExpandedId(null)
                }}
              />
            ))}
            {providers.filter((p) => !p.enabled).length > 0 && (
              <p className="text-xs mt-2" style={{ color: 'var(--ap-muted-foreground)', opacity: 0.6 }}>
                还有 {providers.filter((p) => !p.enabled).length} 个已禁用的 Provider 未显示。
              </p>
            )}
          </div>
        )}
      </div>

      {/* 用量轮询设置 */}
      <UsagePollSettings />
    </div>
  )
}

/* ─── Provider 用量配置卡片 ──────────────────── */
function UsageProviderCard({
  provider: p,
  expanded,
  onToggle,
  onSave,
}: {
  provider: ProviderConfig
  expanded: boolean
  onToggle: () => void
  onSave: (script: ProviderConfig['usageScript']) => void
}) {
  const [scriptType, setScriptType] = useState(p.usageScript?.scriptType ?? 'general')
  const [apiKey, setApiKey] = useState(p.usageScript?.apiKey ?? '')
  const [url, setUrl] = useState(p.usageScript?.url ?? '')
  const [interval, setInterval_] = useState(p.usageScript?.autoIntervalMinutes ?? 0)
  const [accessToken, setAccessToken] = useState(p.usageScript?.accessToken ?? '')
  const [userId, setUserId] = useState(p.usageScript?.userId ?? '')

  const hasConfig = p.usageScript?.enabled

  const handleSave = () => {
    onSave({
      enabled: true,
      scriptType: scriptType as any,
      apiKey: apiKey || undefined,
      url: url || undefined,
      autoIntervalMinutes: interval,
      accessToken: accessToken || undefined,
      userId: userId || undefined,
    })
  }

  const handleDisable = () => {
    onSave({ enabled: false })
  }

  return (
    <div
      className="rounded-sm border"
      style={{ borderColor: hasConfig ? 'var(--ap-agent-done)' : 'var(--ap-border)' }}
    >
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:opacity-80 transition-opacity"
      >
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ backgroundColor: hasConfig ? 'var(--ap-agent-done)' : 'var(--ap-muted-foreground)' }}
          />
          <span className="text-sm font-medium truncate">{p.name}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded" style={{
            backgroundColor: hasConfig ? 'color-mix(in srgb, var(--ap-agent-done) 15%, transparent)' : 'var(--ap-muted)',
            color: hasConfig ? 'var(--ap-agent-done)' : 'var(--ap-muted-foreground)',
          }}>
            {hasConfig ? '已配置' : '未配置'}
          </span>
        </div>
        <svg
          width="14" height="14" viewBox="0 0 16 16" fill="none"
          style={{
            transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s',
          }}
        >
          <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </button>

      {/* Expanded form */}
      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t" style={{ borderColor: 'var(--ap-border)' }}>
          {/* Template type */}
          <div className="pt-4">
            <label className="text-xs font-medium block mb-1">查询模板</label>
            <select
              value={scriptType}
              onChange={(e) => setScriptType(e.target.value as typeof scriptType)}
              className="w-full px-3 py-2 rounded-sm text-sm border outline-none"
              style={{ backgroundColor: 'var(--ap-input)', color: 'var(--ap-foreground)', borderColor: 'var(--ap-border)' }}
            >
              <option value="general">通用模板 (API Key + URL)</option>
              <option value="newapi">NewAPI (Token + UserID)</option>
              <option value="token_plan">Token Plan</option>
              <option value="balance">余额查询</option>
              <option value="official_subscription">官方订阅</option>
              <option value="custom">自定义脚本</option>
            </select>
          </div>

          {/* API Key (用量专用) */}
          {(scriptType === 'general' || scriptType === 'balance') && (
            <div>
              <label className="text-xs font-medium block mb-1">用量 API Key (与推理 Key 分开)</label>
              <input type="password" value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="用量查询专用的 API Key"
                className="w-full px-3 py-2 rounded-sm text-sm border outline-none font-mono"
                style={{ backgroundColor: 'var(--ap-input)', color: 'var(--ap-foreground)', borderColor: 'var(--ap-border)' }}
              />
            </div>
          )}

          {/* URL */}
          {(scriptType === 'general' || scriptType === 'balance') && (
            <div>
              <label className="text-xs font-medium block mb-1">查询 URL</label>
              <input value={url} onChange={(e) => setUrl(e.target.value)}
                placeholder="https://api.example.com/v1/usage"
                className="w-full px-3 py-2 rounded-sm text-sm border outline-none font-mono"
                style={{ backgroundColor: 'var(--ap-input)', color: 'var(--ap-foreground)', borderColor: 'var(--ap-border)' }}
              />
            </div>
          )}

          {/* NewAPI 字段 */}
          {scriptType === 'newapi' && (
            <>
              <div>
                <label className="text-xs font-medium block mb-1">Access Token</label>
                <input type="password" value={accessToken}
                  onChange={(e) => setAccessToken(e.target.value)}
                  className="w-full px-3 py-2 rounded-sm text-sm border outline-none font-mono"
                  style={{ backgroundColor: 'var(--ap-input)', color: 'var(--ap-foreground)', borderColor: 'var(--ap-border)' }}
                />
              </div>
              <div>
                <label className="text-xs font-medium block mb-1">User ID</label>
                <input value={userId} onChange={(e) => setUserId(e.target.value)}
                  className="w-full px-3 py-2 rounded-sm text-sm border outline-none"
                  style={{ backgroundColor: 'var(--ap-input)', color: 'var(--ap-foreground)', borderColor: 'var(--ap-border)' }}
                />
              </div>
            </>
          )}

          {/* Auto interval */}
          <div>
            <label className="text-xs font-medium block mb-1">自动查询间隔 (分钟, 0=禁用)</label>
            <input type="number" value={interval}
              onChange={(e) => setInterval_(Number(e.target.value) || 0)}
              min={0} max={1440}
              className="w-32 px-3 py-2 rounded-sm text-sm border outline-none"
              style={{ backgroundColor: 'var(--ap-input)', color: 'var(--ap-foreground)', borderColor: 'var(--ap-border)' }}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button onClick={handleSave}
              className="px-4 py-2 rounded-sm text-xs font-medium"
              style={{ backgroundColor: 'var(--ap-primary)', color: 'var(--ap-primary-foreground)' }}>
              保存配置
            </button>
            {hasConfig && (
              <button onClick={handleDisable}
                className="px-4 py-2 rounded-sm text-xs font-medium"
                style={{ backgroundColor: 'var(--ap-muted)', color: 'var(--ap-destructive)' }}>
                禁用
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

/* ─── 用量轮询全局设置 ───────────────────────── */
function UsagePollSettings() {
  const advanced = useSettingsStore((s) => s.advanced)
  const setAdvanced = useSettingsStore((s) => s.setAdvanced)

  return (
    <div className="pt-4 border-t" style={{ borderColor: 'var(--ap-border)' }}>
      <h4 className="text-sm font-medium mb-3">用量仪表盘</h4>
      <p className="text-xs mb-3" style={{ color: 'var(--ap-muted-foreground)' }}>
        完整用量仪表盘（趋势图表、按 Provider/模型分组统计、成本分析）需连接 CC Switch 后端。
        当前仅支持本地用量查询脚本配置。
      </p>

      <div className="flex gap-6">
        <div>
          <label className="text-xs font-medium block mb-1">仪表盘刷新间隔 (秒)</label>
          <input type="number" value={advanced.usagePollInterval}
            onChange={(e) => setAdvanced({ usagePollInterval: Number(e.target.value) || 60 })}
            min={10} max={3600}
            className="w-32 px-3 py-2 rounded-sm text-sm border outline-none"
            style={{ backgroundColor: 'var(--ap-input)', color: 'var(--ap-foreground)', borderColor: 'var(--ap-border)' }}
          />
        </div>
      </div>
    </div>
  )
}
