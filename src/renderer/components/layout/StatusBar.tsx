// ═══════════════════════════════════════════════
// Aperture — StatusBar (底部状态栏)
// 左侧: 后端 · 工作目录  右侧: 轮次耗时 · 上下文用量 · 终端 · 会话耗时 · 审批模式 · 版本号
// ═══════════════════════════════════════════════

import { useEffect, useState } from 'react'
import { useSettingsStore, BACKEND_DEFAULTS, type BackendId } from '../../stores/settingsStore'
import { useSessionStore } from '../../stores/sessionStore'
import { useChatStore } from '../../stores/chatStore'

// ─── 会话耗时计时器 ──────────────────────────────

function SessionTimer({ start }: { start: number }) {
  const [elapsed, setElapsed] = useState('0s')

  useEffect(() => {
    const t = setInterval(() => {
      const s = Math.floor((Date.now() - start) / 1000)
      setElapsed(s < 60 ? `${s}s` : `${Math.floor(s / 60)}m${s % 60}s`)
    }, 1000)
    return () => clearInterval(t)
  }, [start])

  return <span className="opacity-60 tabular-nums">{elapsed}</span>
}

// ─── 轮次耗时计时器 ──────────────────────────────

function TurnTimer({ start }: { start: number }) {
  const [elapsed, setElapsed] = useState('0s')

  useEffect(() => {
    const t = setInterval(() => {
      const s = Math.floor((Date.now() - start) / 1000)
      setElapsed(s < 60 ? `${s}s` : `${Math.floor(s / 60)}m${s % 60}s`)
    }, 1000)
    return () => clearInterval(t)
  }, [start])

  return <span className="opacity-60 tabular-nums" title="轮次耗时">↻{elapsed}</span>
}

// ─── 上下文用量面板 ──────────────────────────────

function Row({ label, value, color, bold }: { label: string; value: number; color: string; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
        {label}
      </span>
      <span className={bold ? 'font-semibold' : ''} style={{ color }}>{value.toLocaleString()}</span>
    </div>
  )
}

function ContextUsagePanel({ onClose }: { onClose: () => void }) {
  const usage = useChatStore(s => s.usage)

  return (
    <div
      className="absolute bottom-5 right-0 w-64 p-4 rounded-sm border shadow-lg z-50"
      style={{ backgroundColor: 'var(--ap-card)', borderColor: 'var(--ap-border)' }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="text-xs font-semibold" style={{ color: 'var(--ap-foreground)' }}>上下文用量</div>
        <button onClick={onClose} className="text-xs opacity-50 hover:opacity-100" style={{ color: 'var(--ap-muted-foreground)' }}>✕</button>
      </div>
      {usage ? (
        <div className="space-y-2 text-[11px]">
          <Row label="输入" value={usage.inputTokens} color="#3b82f6" />
          <Row label="输出" value={usage.outputTokens} color="#22c55e" />
          <Row label="缓存读取" value={usage.cacheRead} color="#a855f7" />
          <Row label="缓存写入" value={usage.cacheWrite} color="#f97316" />
          <div className="border-t pt-2 mt-2" style={{ borderColor: 'var(--ap-border)' }}>
            <Row label="总计" value={usage.inputTokens + usage.outputTokens + usage.cacheRead + usage.cacheWrite} color="var(--ap-foreground)" bold />
          </div>
        </div>
      ) : (
        <div className="text-[11px] py-4 text-center" style={{ color: 'var(--ap-muted-foreground)' }}>
          发送消息后显示 token 用量
        </div>
      )}
    </div>
  )
}

// ─── 上下文用量 ──────────────────────────────────

function ContextUsage({ onClick }: { onClick: () => void }) {
  const usage = useChatStore((s) => s.usage)
  const messages = useChatStore((s) => s.messages)
  const userMsgCount = messages.filter(m => m.role === 'user').length

  const estimatedTokens = usage
    ? usage.inputTokens + usage.outputTokens
    : userMsgCount * 500

  return (
    <button onClick={onClick} className="opacity-60 hover:opacity-100 transition-opacity">
      ~{estimatedTokens > 1000 ? `${(estimatedTokens / 1000).toFixed(0)}k` : estimatedTokens} tok
    </button>
  )
}

// ─── 终端开关 ────────────────────────────────────

function TerminalToggle() {
  const [terminalOpen, setTerminalOpen] = useState(false)

  return (
    <button
      onClick={() => setTerminalOpen(!terminalOpen)}
      className="w-5 h-5 flex items-center justify-center rounded-sm hover:bg-[var(--ap-muted)]"
      style={{ color: terminalOpen ? 'var(--ap-primary)' : 'var(--ap-muted-foreground)' }}
      title="终端"
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="4 17 10 11 4 5" /><line x1="12" y1="19" x2="20" y2="19" />
      </svg>
    </button>
  )
}

// ─── 审批模式持久化 ──────────────────────────────

const PERMISSION_KEY = 'aperture-permission-mode'

function usePermissionMode(): [string, (v: string) => void] {
  const [mode, setMode] = useState<string>(() => {
    try { return localStorage.getItem(PERMISSION_KEY) ?? 'bypass' }
    catch { return 'bypass' }
  })

  const set = (v: string) => {
    setMode(v)
    try { localStorage.setItem(PERMISSION_KEY, v) } catch { /* ignore */ }
  }

  return [mode, set]
}

// ─── 状态栏主组件 ────────────────────────────────

interface StatusBarProps { onOpenGateway?: () => void }

export default function StatusBar({ onOpenGateway }: StatusBarProps) {
  const providers = useSettingsStore((s) => s.providers)
  const activeBackend = useSessionStore((s) => {
    const session = s.sessions.find((x) => x.id === s.activeId)
    return (session?.backendId ?? 'claude') as BackendId
  })
  const streamStartTime = useChatStore((s) => s.streamStartTime)
  const turnStartTime = useChatStore((s) => s.turnStartTime)
  const [permissionMode, setPermissionMode] = usePermissionMode()
  const agentCwd = useSettingsStore((s) => s.agentCwd)

  const backendDisplayName = BACKEND_DEFAULTS[activeBackend]?.name ?? 'Claude Code'
  const backendProviders = providers.filter((p) => p.backendId === activeBackend && p.enabled)
  const activeProvider = backendProviders[0] // first enabled = active

  const messages = useChatStore((s) => s.messages)
  const userMsgCount = messages.filter(m => m.role === 'user').length

  const [usagePanelOpen, setUsagePanelOpen] = useState(false)

  return (
    <footer
      className="flex h-5 shrink-0 items-center justify-between gap-2 border-t px-2 text-[11px] select-none"
      style={{
        borderColor: 'var(--ap-border)',
        backgroundColor: 'var(--ap-muted)',
        color: 'var(--ap-muted-foreground)',
      }}
    >
      {/* 左侧 */}
      <div className="flex items-center gap-0.5 min-w-0">
        {/* 命令面板 */}
        <button className="w-5 h-5 flex items-center justify-center rounded-sm hover:bg-[var(--ap-muted)] opacity-60 hover:opacity-100" title="命令面板">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 3a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3H6a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3V6a3 3 0 0 0-3-3 3 3 0 0 0-3 3 3 3 0 0 0 3 3h10.5a3 3 0 0 0 3-3 3 3 0 0 0-3-3z"/></svg>
        </button>
        {/* 网关 */}
        <button className="w-5 h-5 flex items-center justify-center rounded-sm hover:bg-[var(--ap-muted)] opacity-60 hover:opacity-100" title="网关" onClick={() => onOpenGateway?.()}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="8" height="8" rx="1"/><rect x="14" y="2" width="8" height="8" rx="1"/><rect x="2" y="14" width="8" height="8" rx="1"/><rect x="14" y="14" width="8" height="8" rx="1"/><path d="M12 10v4"/><path d="M10 12h4"/></svg>
        </button>
        {/* 子agent */}
        <button className="w-5 h-5 flex items-center justify-center rounded-sm hover:bg-[var(--ap-muted)] opacity-60 hover:opacity-100" title="子 Agent">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
        </button>
        {/* Cron */}
        <button className="w-5 h-5 flex items-center justify-center rounded-sm hover:bg-[var(--ap-muted)] opacity-60 hover:opacity-100" title="Cron">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        </button>
        {/* 工作目录 */}
        {agentCwd && (
          <span className="truncate opacity-70 ml-1" title={agentCwd}>
            {agentCwd.split('\\').pop() || agentCwd}
          </span>
        )}
      </div>

      {/* 右侧: 轮次耗时 · 上下文用量 · 终端 · 会话计时 · 审批模式 · 版本号 */}
      <div className="flex items-center gap-2 shrink-0">
        {/* 轮次耗时 */}
        {turnStartTime && <TurnTimer start={turnStartTime} />}

        {/* 上下文用量 */}
        {userMsgCount > 0 && (
          <div className="relative">
            <ContextUsage onClick={() => setUsagePanelOpen(!usagePanelOpen)} />
            {usagePanelOpen && <ContextUsagePanel onClose={() => setUsagePanelOpen(false)} />}
          </div>
        )}

        {/* 终端开关 */}
        <TerminalToggle />

        {/* 会话计时 */}
        {streamStartTime && <SessionTimer start={streamStartTime} />}

        {/* 审批模式 */}
        <select
          value={permissionMode}
          onChange={(e) => {
            const mode = e.target.value
            setPermissionMode(mode)
            const pid = useChatStore.getState().activePid
            if (pid) window.api.agent.setPermissionMode(pid, mode)
          }}
          className="bg-transparent border-none text-[11px] outline-none cursor-pointer"
          style={{ color: 'var(--ap-muted-foreground)' }}
        >
          <option value="bypass">YOLO</option>
          <option value="default">Default</option>
        </select>

        {/* 版本 */}
        <span className="opacity-50">v0.1.1</span>
        <span className="opacity-40 text-[9px]">{useSettingsStore((s) => s.general.fontSize) ?? "14px"}</span>
      </div>
    </footer>
  )
}
