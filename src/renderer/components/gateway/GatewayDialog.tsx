// ═══════════════════════════════════════════════
// Aperture — Gateway Dialog (CLI connection status)
// ═══════════════════════════════════════════════

import { useEffect, useState } from 'react'

/* ═══════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════ */

interface CliEntry { id: string; name: string; desc: string }
type Status = 'checking' | 'connected' | 'disconnected' | 'error'
interface CliState { id: string; name: string; status: Status; path?: string; version?: string; error?: string }

const CLI_LIST: CliEntry[] = [
  { id: 'claude', name: 'Claude Code', desc: 'Anthropic CLI agent' },
  { id: 'codex', name: 'Codex CLI', desc: 'OpenAI CLI agent' },
  { id: 'gemini', name: 'Gemini CLI', desc: 'Google CLI agent' },
  { id: 'hermes', name: 'Hermes Agent', desc: 'Nous Research agent' },
  { id: 'opencode', name: 'OpenCode', desc: 'OpenCode CLI' },
  { id: 'openclaw', name: 'OpenClaw', desc: 'OpenClaw CLI' },
]

/* ═══════════════════════════════════════════════
   Icons
   ═══════════════════════════════════════════════ */

const StatusIcon = ({ status }: { status: Status }) => {
  const c = status === 'connected' ? '#22c55e' : status === 'checking' ? '#f59e0b' : '#ef4444'
  return <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c, boxShadow: status === 'connected' ? `0 0 6px ${c}` : 'none' }} />
}

/* ═══════════════════════════════════════════════
   Dialog
   ═══════════════════════════════════════════════ */

interface Props { open: boolean; onClose: () => void }

export default function GatewayDialog({ open, onClose }: Props) {
  const [results, setResults] = useState<CliState[]>(
    CLI_LIST.map(c => ({ id: c.id, name: c.name, status: 'checking' }))
  )

  const detect = async () => {
    setResults(CLI_LIST.map(c => ({ id: c.id, name: c.name, status: 'checking' })))
    for (const cli of CLI_LIST) {
      try {
        const res = await window.api.backend?.detect?.(cli.id)
        if (res) {
          setResults(prev => prev.map(r => r.id === cli.id
            ? { ...r, status: res.installed ? 'connected' : 'disconnected', path: res.path, version: res.version }
            : r))
        }
      } catch {
        setResults(prev => prev.map(r => r.id === cli.id ? { ...r, status: 'error', error: '检测失败' } : r))
      }
    }
  }

  useEffect(() => { if (open) detect() }, [open])

  useEffect(() => {
    if (!open) return
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-[480px] max-h-[560px] rounded-none overflow-hidden flex flex-col shadow-lg"
        style={{ backgroundColor: 'var(--ap-card)', border: '2px solid var(--ap-border)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b" style={{ borderColor: 'var(--ap-border)' }}>
          <h2 className="text-sm font-semibold" style={{ color: 'var(--ap-foreground)' }}>网关 — CLI 连接状态</h2>
          <button onClick={onClose} className="text-xs opacity-50 hover:opacity-100" style={{ color: 'var(--ap-muted-foreground)' }}>✕</button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2">
          {results.map(r => (
            <div
              key={r.id}
              className="flex items-center gap-3 px-3 py-2.5 rounded-sm border"
              style={{ borderColor: 'var(--ap-border)', backgroundColor: 'var(--ap-muted)' }}
            >
              <StatusIcon status={r.status} />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium" style={{ color: 'var(--ap-foreground)' }}>{r.name}</div>
                {r.status === 'connected' && r.path && (
                  <div className="text-[10px] truncate" style={{ color: 'var(--ap-muted-foreground)' }}>{r.path}</div>
                )}
                {r.status === 'connected' && r.version && (
                  <div className="text-[10px]" style={{ color: 'var(--ap-muted-foreground)' }}>{r.version}</div>
                )}
                {r.status === 'disconnected' && (
                  <div className="text-[10px]" style={{ color: 'var(--ap-muted-foreground)' }}>未安装</div>
                )}
                {r.status === 'error' && (
                  <div className="text-[10px]" style={{ color: '#ef4444' }}>{r.error}</div>
                )}
                {r.status === 'checking' && (
                  <div className="text-[10px]" style={{ color: '#f59e0b' }}>检测中...</div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-5 py-2.5 border-t flex gap-2" style={{ borderColor: 'var(--ap-border)' }}>
          <button onClick={detect} className="flex-1 px-3 py-1.5 rounded-sm text-xs font-medium border transition-colors"
            style={{ borderColor: 'var(--ap-border)', color: 'var(--ap-foreground)' }}>
            重新检测
          </button>
          <button onClick={onClose} className="px-3 py-1.5 rounded-sm text-xs border"
            style={{ borderColor: 'var(--ap-border)', color: 'var(--ap-muted-foreground)' }}>
            关闭
          </button>
        </div>
      </div>
    </div>
  )
}
