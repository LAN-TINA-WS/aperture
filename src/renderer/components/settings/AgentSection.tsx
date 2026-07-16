// ═══════════════════════════════════════════════
// Aperture — Agent Section
//
// Agent backend status, config directory, working directory, installation management
// ═══════════════════════════════════════════════

import { useState, useEffect } from 'react'
import { useSettingsStore } from '../../stores/settingsStore'
import { SettingCard, SectionHeader, SettingRow } from './primitives'

/* ─── WorkingDirCard ──────────────────────────── */

function WorkingDirCard() {
  const agentCwd = useSettingsStore((s) => s.agentCwd)
  const setAgentCwd = useSettingsStore((s) => s.setAgentCwd)
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(agentCwd)

  return (
    <>
      {editing ? (
        <div className="flex items-center gap-2">
          <input
            autoFocus
            value={value}
            onChange={e => setValue(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { setAgentCwd(value); setEditing(false) } }}
            className="flex-1 px-3 py-1.5 rounded-sm border text-xs outline-none font-mono"
            style={{ backgroundColor: 'var(--ap-input)', borderColor: 'var(--ap-primary)', color: 'var(--ap-foreground)' }}
          />
          <button
            className="px-3 py-1.5 rounded-sm text-xs font-medium"
            style={{ backgroundColor: 'var(--ap-primary)', color: 'var(--ap-primary-foreground)' }}
            onClick={() => { setAgentCwd(value); setEditing(false) }}
          >确认</button>
          <button
            className="px-3 py-1.5 rounded-sm text-xs border"
            style={{ borderColor: 'var(--ap-border)', color: 'var(--ap-muted-foreground)', backgroundColor: 'transparent' }}
            onClick={() => { setValue(agentCwd); setEditing(false) }}
          >取消</button>
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-mono">{agentCwd || '未设置'}</p>
          </div>
          <button
            className="px-3 py-1.5 rounded-sm text-xs font-medium border"
            style={{ borderColor: 'var(--ap-primary)', color: 'var(--ap-primary)', backgroundColor: 'transparent' }}
            onClick={() => { setValue(agentCwd); setEditing(true) }}
          >修改</button>
        </div>
      )}
    </>
  )
}

/* ─── AgentSettingsTab ────────────────────────── */

export default function AgentSection() {
  const [agentInfo, setAgentInfo] = useState<{
    claudeConfigDir?: string
    activeProvider?: { endpoint?: string; model?: string; apiKey?: string }
    agents?: Array<{ agentName: string; installed: boolean; providerName?: string; endpoint?: string }>
  } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        const debug = await window.api.agentConfig.debug() as any
        const scan = await window.api.agentConfig.scan()
        if (!cancelled) {
          setAgentInfo({
            claudeConfigDir: debug?.claudeConfigDir,
            activeProvider: debug?.activeProvider,
            agents: scan,
          })
        }
      } catch {
        if (!cancelled) setAgentInfo(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-sm" style={{ color: 'var(--ap-muted-foreground)' }}>加载中...</p>
      </div>
    )
  }

  const maskApiKey = (key?: string) => {
    if (!key || key.length < 8) return '(未设置)'
    return key.slice(0, 4) + '****' + key.slice(-4)
  }

  return (
    <div className="space-y-4">
      {/* ── Section Header ── */}
      <SectionHeader title="Agent 设置" subtitle="配置 Claude Code 后端和工作目录" />

      {/* ── Claude Code 配置目录 ── */}
      <SettingCard>
        <SectionHeader
          title="Agent 配置目录"
          subtitle="Claude Code 配置与凭证存放路径"
        />
        <SettingRow label="配置路径">
          <div className="flex items-center gap-3">
            <span className="text-sm font-mono" style={{ color: 'var(--ap-muted-foreground)' }}>
              {agentInfo?.claudeConfigDir ?? '~/.claude'}
            </span>
            <button
              className="px-3 py-1.5 rounded-sm text-xs font-medium border transition-colors hover:opacity-80"
              style={{
                borderColor: 'var(--ap-primary)',
                color: 'var(--ap-primary)',
                backgroundColor: 'transparent',
              }}
              onClick={async () => {
                const home = await window.api.app.getHome()
                window.api.app.openPath(home + '\\.claude')
              }}
            >
              打开目录
            </button>
          </div>
        </SettingRow>
      </SettingCard>

      {/* ── Agent 工作目录 ── */}
      <SettingCard>
        <SectionHeader
          title="Agent 工作目录"
          subtitle="Claude Code 将在此目录中启动，建议设为独立的空项目目录"
        />
        <WorkingDirCard />
      </SettingCard>

      {/* ── 当前活跃 Provider ── */}
      {agentInfo?.activeProvider && (
        <SettingCard>
          <SectionHeader
            title="当前活跃 Provider"
            subtitle="Claude Code 当前使用的 API 连接信息"
          />
          <div className="space-y-3">
            <SettingRow label="Endpoint">
              <span className="text-sm font-mono truncate max-w-[380px]" style={{ color: 'var(--ap-muted-foreground)' }}>
                {agentInfo.activeProvider.endpoint || '(未设置)'}
              </span>
            </SettingRow>
            <SettingRow label="Model">
              <span className="text-sm font-mono" style={{ color: 'var(--ap-muted-foreground)' }}>
                {agentInfo.activeProvider.model || '(未设置)'}
              </span>
            </SettingRow>
            <SettingRow label="API Key">
              <span className="text-sm font-mono" style={{ color: 'var(--ap-muted-foreground)' }}>
                {maskApiKey(agentInfo.activeProvider.apiKey)}
              </span>
            </SettingRow>
          </div>
        </SettingCard>
      )}

      {/* ── Agent 后端安装状态 ── */}
      <SettingCard>
        <SectionHeader
          title="Agent 后端状态"
          subtitle={`扫描到 ${agentInfo?.agents?.length ?? 0} 个 Agent 后端`}
        />
        {agentInfo?.agents && agentInfo.agents.length > 0 ? (
          <div className="space-y-2">
            {agentInfo.agents.map((a) => (
              <div
                key={a.agentName}
                className="flex items-center justify-between p-3 rounded-sm border"
                style={{ borderColor: 'var(--ap-border)', backgroundColor: 'var(--ap-muted)' }}
              >
                <div className="flex items-center gap-3">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{
                      backgroundColor: a.installed ? '#22c55e' : 'var(--ap-muted-foreground)',
                      boxShadow: a.installed ? '0 0 6px rgba(34,197,94,0.4)' : undefined,
                    }}
                  />
                  <div>
                    <span className="text-sm font-medium capitalize">{a.agentName}</span>
                    {a.providerName && (
                      <span className="ml-2 text-xs" style={{ color: 'var(--ap-muted-foreground)' }}>
                        ({a.providerName})
                      </span>
                    )}
                  </div>
                </div>
                <span
                  className="text-[11px] px-2.5 py-1 rounded-full font-medium"
                  style={{
                    backgroundColor: a.installed ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
                    color: a.installed ? '#22c55e' : '#ef4444',
                    border: `1px solid ${a.installed ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
                  }}
                >
                  {a.installed ? '✓ 已安装' : '✗ 未安装'}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div
            className="text-sm py-6 px-4 rounded-sm border border-dashed text-center"
            style={{ color: 'var(--ap-muted-foreground)', borderColor: 'var(--ap-border)' }}
          >
            <p className="mb-1">暂无 Agent 后端数据</p>
            <p className="text-xs" style={{ color: 'var(--ap-muted-foreground)', opacity: 0.7 }}>
              请先在 Provider 管理页运行「本地 Agent 配置」扫描
            </p>
          </div>
        )}
      </SettingCard>
    </div>
  )
}
