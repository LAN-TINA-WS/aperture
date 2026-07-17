// ═══════════════════════════════════════════════
// Aperture — Sidebar (1:1 Hermes chrome.tsx + session-row.tsx)
//
// Section headers: 11px caps, muted
// Session rows: 1.625rem, dot + title, hover bg, active bg
// Backend groups: caret toggle, count badge
// ═══════════════════════════════════════════════

import { useEffect, useState, useCallback, useRef } from 'react'
import { useSessionStore } from '../../stores/sessionStore'
import { useChatStore } from '../../stores/chatStore'

interface Props {
  onClose: () => void
}

interface ScannedSession {
  providerId: string
  sessionId: string
  title: string | null
  sourcePath: string
  projectDir: string | null
  resumeCommand: string | null
  lastActiveAt: number | null
}

const BACKENDS = [
  { id: 'claude', name: 'Claude Code', icon: 'C' },
  { id: 'codex', name: 'Codex CLI', icon: 'X' },
  { id: 'gemini', name: 'Gemini CLI', icon: 'G' },
  { id: 'hermes', name: 'Hermes Agent', icon: 'H' },
  { id: 'opencode', name: 'OpenCode', icon: 'O' },
  { id: 'openclaw', name: 'OpenClaw', icon: 'W' },
]

/* ─── Caret SVG ─────────────────────────────── */
function Caret({ open }: { open: boolean }) {
  return (
    <svg
      width="10" height="10" viewBox="0 0 10 10" fill="currentColor"
      style={{ transform: open ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 150ms' }}
    >
      <path d="M3 1l4 4-4 4" />
    </svg>
  )
}

export default function Sidebar({ onClose }: Props) {
  const { activeId, select } = useSessionStore()
  const { clearMessages } = useChatStore()
  const [scanned, setScanned] = useState<ScannedSession[]>([])
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ claude: true })
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; session: ScannedSession } | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const editInputRef = useRef<HTMLInputElement>(null)
  const contextMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    window.api.scanner?.scan?.()
      .then((list: unknown) => setScanned(list as ScannedSession[]))
      .catch((err) => console.error('[Sidebar] scanner.scan() failed:', err))
  }, [])

  // Listen for real-time push updates from the main process file watcher
  useEffect(() => {
    const cleanup = window.api.scanner.onScanResult((sessions) => {
      setScanned(sessions as ScannedSession[])
    })
    return cleanup
  }, [])

  // Auto-focus rename input when editing starts
  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus()
      editInputRef.current.select()
    }
  }, [editingId])

  // Close context menu on click outside or Esc
  useEffect(() => {
    if (!contextMenu) return
    const close = () => setContextMenu(null)
    const handleClick = (e: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) close()
    }
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKey)
    }
  }, [contextMenu])

  const toggleExpand = (id: string) =>
    setExpanded((p) => ({ ...p, [id]: !p[id] }))

  const handleNewSession = useCallback(
    async (backendId: string) => {
      const s = await useSessionStore.getState().create(backendId)
      clearMessages()
      useChatStore.getState().setActiveSessionMeta({
        providerId: backendId,
        title: '新对话',
      })
      // Refresh scanned list
      window.api.scanner?.scan?.()
        .then((list: unknown) => setScanned(list as ScannedSession[]))
        .catch((err) => console.error('[Sidebar] scanner.scan() refresh failed:', err))
    },
    [clearMessages],
  )

  const handleSelect = useCallback(
    async (s: ScannedSession) => {
      select(s.sessionId)
      setLoadingId(s.sessionId)
      clearMessages()
      useChatStore.getState().setActiveSessionMeta({
        sessionId: s.sessionId,
        providerId: s.providerId,
        sourcePath: s.sourcePath,
        title: s.title || undefined,
      })
      try {
        const msgs = await window.api.scanner.messages(s.providerId, s.sessionId, s.sourcePath)
        const { addUserMessage, addAssistantMessage, appendContent, appendThinking, setMessageDone } =
          useChatStore.getState()
        for (const m of msgs as Array<{ role: string; content: string; thinking?: string }>) {
          if (m.role === 'user') {
            addUserMessage(m.content)
          } else {
            const id = `hist_${Date.now()}_${Math.random()}`
            addAssistantMessage(id)
            if (m.thinking) appendThinking(id, m.thinking)
            appendContent(id, m.content)
            setMessageDone(id)
          }
        }
        useChatStore.getState().setHistoryLoadedAt(Date.now())
      } catch {
        /* skip */
      }
      setLoadingId(null)
    },
    [select, clearMessages],
  )

  const handleContextMenu = (e: React.MouseEvent, s: ScannedSession) => {
    e.preventDefault()
    setContextMenu({ x: e.clientX, y: e.clientY, session: s })
  }

  const commitRename = async (s: ScannedSession, newName: string) => {
    const trimmed = newName.trim()
    if (!trimmed || trimmed === s.title) return
    try {
      await window.api.session.renameScanned(s.sessionId, trimmed)
    } catch { /* ignore */ }
    try {
      await window.api.session.rename(s.sessionId, trimmed)
    } catch { /* ignore */ }
    setScanned((prev) =>
      prev.map((x) => (x.sessionId === s.sessionId ? { ...x, title: trimmed } : x))
    )
  }

  const handleRename = (s: ScannedSession) => {
    setContextMenu(null)
    setEditingId(s.sessionId)
  }

  const handleDelete = async (s: ScannedSession) => {
    setContextMenu(null)
    const remaining = scanned.filter((x) => x.sessionId !== s.sessionId)
    try {
      await window.api.session.delete(s.sessionId, { sourcePath: s.sourcePath, providerId: s.providerId })
    } catch {
      /* ignore */
    }
    setScanned(remaining)
    if (activeId === s.sessionId) {
      if (remaining.length > 0) {
        handleSelect(remaining[0])
      } else {
        clearMessages()
        select('')
      }
    }
  }

  const groups = BACKENDS.map((b) => ({
    ...b,
    sessions: scanned.filter((s) => s.providerId === b.id),
  }))

  return (
    <div className="flex flex-col h-full sidebar-surface text-[14px]">
      {/* ─── Header ─────────────────────────── */}
      <div
        className="flex items-center justify-between px-4"
        style={{ height: 'var(--titlebar-height)', borderBottom: '1px solid var(--ap-sidebar-border)' }}
      >
        <div className="flex items-center gap-2">
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
            <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="10" cy="10" r="4" fill="currentColor" opacity="0.3" />
            <circle cx="10" cy="10" r="1.5" fill="currentColor" />
          </svg>
          <span className="font-semibold text-sm" style={{ color: 'var(--ap-sidebar-foreground)' }}>
            Aperture
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded hover:opacity-70"
          style={{ color: 'var(--ap-muted-foreground)' }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </button>
      </div>

      {/* ─── Backend groups ────────────────── */}
      <div className="flex-1 overflow-y-auto">
        {groups.map((group) => {
          const isOpen = expanded[group.id] ?? false
          const count = group.sessions.length
          return (
            <div key={group.id}>
              {/* Section header — Hermes sidebar-section-header pattern */}
              <button
                onClick={() => toggleExpand(group.id)}
                className="sidebar-section-header w-full text-left"
              >
                <Caret open={isOpen} />
                <span className="flex-1">{group.name}</span>
                {count > 0 && (
                  <span
                    className="text-[0.6875rem] font-medium"
                    style={{ color: 'color-mix(in srgb, var(--ap-sidebar-foreground) 25%, transparent)' }}
                  >
                    {count}
                  </span>
                )}
                {/* New session button */}
                <span
                  onClick={(e) => { e.stopPropagation(); handleNewSession(group.id) }}
                  className="ml-1 p-0.5 rounded hover:opacity-70 cursor-pointer"
                  style={{ color: 'var(--ap-muted-foreground)' }}
                  title="新建对话"
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M6 2v8M2 6h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </span>
              </button>

              {/* Session rows — Hermes sidebar-row pattern */}
              {isOpen && (
                <div className="pb-1">
                  {count === 0 ? (
                    <div
                      className="px-6 py-3 text-xs"
                      style={{
                        color: 'color-mix(in srgb, var(--ap-sidebar-foreground) 45%, transparent)',
                      }}
                    >
                      暂无会话
                    </div>
                  ) : (
                    group.sessions.map((s) => {
                      const isActive = activeId === s.sessionId
                      const isLoading = loadingId === s.sessionId
                      return (
                        <button
                          key={s.sessionId}
                          onClick={() => handleSelect(s)}
                          onContextMenu={(e) => handleContextMenu(e, s)}
                          className={`sidebar-row w-full text-left ${isActive ? 'active' : ''}`}
                        >
                          <div className="sidebar-row-body">
                            {/* Dot — Hermes SidebarRowDot */}
                            <span className={`sidebar-dot ${isActive ? 'active' : ''}`} />
                            {/* Title — inline edit when renaming */}
                            {editingId === s.sessionId ? (
                              <input
                                ref={editInputRef}
                                className="flex-1 min-w-0 bg-transparent border-none outline-none text-inherit"
                                style={{ fontSize: 'inherit', lineHeight: 'inherit', color: 'var(--ap-sidebar-foreground)' }}
                                defaultValue={s.title || ''}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault()
                                    commitRename(s, e.currentTarget.value)
                                    setEditingId(null)
                                  } else if (e.key === 'Escape') {
                                    setEditingId(null)
                                  }
                                }}
                                onBlur={(e) => {
                                  commitRename(s, e.currentTarget.value)
                                  setEditingId(null)
                                }}
                                onClick={(e) => e.stopPropagation()}
                              />
                            ) : (
                              <span className="truncate flex-1">{s.title || '未命名会话'}</span>
                            )}
                          </div>
                          {/* Loading or project name on the right */}
                          <div className="flex items-center self-center pr-1">
                            {isLoading ? (
                              <span className="text-[0.625rem] opacity-50">加载中</span>
                            ) : s.projectDir ? (
                              <span
                                className="text-[0.625rem] truncate max-w-[80px]"
                                style={{
                                  color: 'color-mix(in srgb, var(--ap-sidebar-foreground) 35%, transparent)',
                                }}
                              >
                                {s.projectDir.split(/[/\\]/).pop()}
                              </span>
                            ) : null}
                          </div>
                        </button>
                      )
                    })
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* ─── Context Menu ─────────────────── */}
      {contextMenu && (
        <div
          ref={contextMenuRef}
          className="fixed z-50 py-1 min-w-[120px]"
          style={{
            left: contextMenu.x,
            top: contextMenu.y,
            background: 'var(--ap-card)',
            border: '1px solid var(--ap-border)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          }}
        >
          <div
            className="px-3 py-2 text-xs cursor-pointer hover:bg-[var(--ap-muted)]"
            onClick={() => handleRename(contextMenu.session)}
          >
            重命名
          </div>
          <div className="border-t" style={{ borderColor: 'var(--ap-border)' }} />
          <div
            onClick={() => handleDelete(contextMenu.session)}
            className="px-3 py-2 text-xs cursor-pointer hover:bg-[var(--ap-muted)]"
            style={{ color: 'var(--ap-destructive)' }}
          >
            删除对话
          </div>
        </div>
      )}
    </div>
  )
}
