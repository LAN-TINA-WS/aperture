// ═══════════════════════════════════════════════
// Aperture — ChatArea (1:1 Hermes layout)
//
// Titlebar: 34px + sidebar toggle + settings + win controls
// Messages: centered via flex justify-center wrapper
// Composer: glass surface, rounded-xl, ring border
// ═══════════════════════════════════════════════

import { useState, useEffect, useRef } from 'react'
import { useChatStore } from '../../stores/chatStore'
import { useSessionStore } from '../../stores/sessionStore'
import { useComposerPopout } from './useComposerPopout'
import { useSettingsStore, BACKEND_DEFAULTS, type BackendId } from '../../stores/settingsStore'
import MessageBubble from '../chat/MessageBubble'

interface Props {
  onOpenSettings: () => void
  onOpenGateway: () => void
  sidebarOpen: boolean
  onToggleSidebar: () => void
}

export default function ChatArea({ onOpenSettings, onOpenGateway, sidebarOpen, onToggleSidebar }: Props) {
  const [input, setInput] = useState('')
  const [providerMenuOpen, setProviderMenuOpen] = useState(false)
  const popout = useComposerPopout()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const {
    messages,
    isStreaming,
    messageLimit,
    addUserMessage,
    addAssistantMessage,
    appendContent,
    appendThinking,
    addToolUse,
    setMessageDone,
    setMessageInterrupted,
    setStreaming,
    setActivePid,
    showAllMessages,
  } = useChatStore()
  const providers = useSettingsStore((s) => s.providers)
  const activeBackend = useSessionStore((s) => {
    const session = s.sessions.find((x) => x.id === s.activeId)
    return (session?.backendId ?? 'claude') as BackendId
  })

  // Close menu on outside click
  useEffect(() => {
    if (!providerMenuOpen) return
    const h = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setProviderMenuOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [providerMenuOpen])

  const backendProviders = providers.filter((p) => p.backendId === activeBackend && p.enabled)
  const activeProvider = backendProviders[0] // first enabled = active

  const chatContainerRef = useRef<HTMLDivElement>(null)

  const activeSession = useSessionStore((s) => s.sessions.find((x) => x.id === s.activeId))

  // 切换会话时强制滚动到底部
  const activeId = useSessionStore((s) => s.activeId)
  useEffect(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'instant' })
    }, 50)
  }, [activeId])

  // 历史消息加载完成 → 滚动到底部
  const historyLoadedAt = useChatStore((s) => s.historyLoadedAt)
  useEffect(() => {
    if (historyLoadedAt) {
      // 多次尝试滚动，确保 React 渲染完成
      const scroll = () => {
        const el = chatContainerRef.current
        if (el) el.scrollTop = el.scrollHeight
      }
      scroll()
      setTimeout(scroll, 100)
      setTimeout(scroll, 300)
    }
  }, [historyLoadedAt])

  useEffect(() => {
    const el = chatContainerRef.current
    if (!el) return
    // 思考过程中只在用户已在底部附近时自动滚动
      const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 100
      if (nearBottom) {
        // 用 scrollTop 替代 scrollIntoView，可被用户滚动立即中断
        requestAnimationFrame(() => {
          el.scrollTop = el.scrollHeight
        })
      }
  }, [messages])

  useEffect(() => {
    const cleanup = window.api.onStreamEvent((data: any) => {
      const { event } = data
      const lastMsg = useChatStore.getState().messages.at(-1)
      const msgId = lastMsg?.id ?? ''
      console.log('[ChatArea] onStreamEvent type=' + event.type, 'msgId=' + msgId, 'text=' + (event.text ? JSON.stringify(event.text).slice(0, 80) : ''))
      switch (event.type) {
        case 'system':
          if (event.subtype === 'init' && event.data?.session_id) {
            useChatStore.getState().setActiveSessionMeta({
              sessionId: event.data.session_id as string
            })
          }
          break
        case 'thinking': appendThinking(msgId, event.text); break
        case 'content': appendContent(msgId, event.text); break
        case 'tool_use': addToolUse(msgId, event.id, event.name, event.input); break
        // Note: 'done' and 'error' come via stream:done / stream:error channels, not stream:event
      }
    })
    return () => cleanup?.()
  }, [])

  // stream:error — handle agent-side errors
  useEffect(() => {
    const cleanup = window.api.onStreamError((data: any) => {
      const lastMsg = useChatStore.getState().messages.at(-1)
      const msgId = lastMsg?.id ?? ''
      useChatStore.getState().setMessageError(msgId, data.message ?? 'Agent error')
      setStreaming(false)
      setActivePid(null)
    })
    return () => cleanup?.()
  }, [])

  // stream:done — handle completion and interruption
  useEffect(() => {
    const cleanup = window.api.onStreamDone((data: any) => {
      console.log('[ChatArea] onStreamDone', JSON.stringify(data))
      const lastMsg = useChatStore.getState().messages.at(-1)
      const msgId = lastMsg?.id ?? ''

      // Process usage/cost from NDJSON result event
      if (data?.usage) {
        useChatStore.getState().setUsage({
          inputTokens: data.usage.input_tokens ?? 0,
          outputTokens: data.usage.output_tokens ?? 0,
          cacheRead: data.usage.cache_read_input_tokens ?? 0,
          cacheWrite: data.usage.cache_creation_input_tokens ?? 0,
        })
      }

      if (data?.exitCode === null || data?.killed) {
        useChatStore.getState().setTurnStartTime(null)
        if (lastMsg?.status === 'streaming') {
          useChatStore.getState().setMessageInterrupted(msgId)
        } else {
          setStreaming(false)
        }
      } else {
        useChatStore.getState().setTurnStartTime(null)
        useChatStore.getState().setMessageDone(msgId)
        setStreaming(false)
      }
    })
    return () => cleanup?.()
  }, [])

  const handleSend = async (pendingPrompt?: string) => {
    const prompt = pendingPrompt ?? input.trim()
    if (!prompt) return
    setInput('')

    // 流中发送 → 走 streamInput，不阻塞
    if (isStreaming) {
      const pid = useChatStore.getState().activePid
      if (pid) {
        useChatStore.getState().setTurnStartTime(Date.now())
        addUserMessage(prompt)
        const assistantId = `msg_${Date.now()}`
        addAssistantMessage(assistantId)
        window.api.agent.sendMessage({ pid, text: prompt }).catch(() => {})
      }
      return
    }

    // 首次发送（或 agent 已结束后的新消息）→ 走 start
    useChatStore.getState().setTurnStartTime(Date.now())
    addUserMessage(prompt)

    let activeId = useSessionStore.getState().activeId
    let isNewSession = false
    if (!activeId) {
      const session = await useSessionStore.getState().create('claude')
      activeId = session.id
      isNewSession = true
      useChatStore.getState().resetMessageLimit()
    }

    // 新建会话或标题仍是默认值时，自动改标题为第一条消息
    const currentSession = useSessionStore.getState().sessions.find(s => s.id === activeId)
    if (isNewSession || currentSession?.title === '新对话' || !currentSession?.title) {
      const title = prompt.length > 50 ? prompt.slice(0, 47) + '...' : prompt
      useSessionStore.getState().rename(activeId!, title).catch(() => {})
    }

    const assistantId = `msg_${Date.now()}`
    addAssistantMessage(assistantId)
    setStreaming(true)

    // 获取活跃Provider
    const providerList = useSettingsStore.getState().providers
    const activeProvider = providerList.find(p => p.backendId === 'claude' && p.enabled)
    const agentCwd = useSettingsStore.getState().agentCwd || await window.api.app.getHome()

    try {
      const sessionId = useChatStore.getState().activeSessionMeta?.sessionId

      const result = await window.api.agent.start({
        backendId: 'claude',
        prompt,
        cwd: agentCwd,
        permissionMode: 'bypass',
        env: activeProvider ? {
          ANTHROPIC_BASE_URL: activeProvider.endpoint,
          ANTHROPIC_API_KEY: activeProvider.apiKey,
          ANTHROPIC_MODEL: activeProvider.models[0] || '',
        } : undefined,
        ...(sessionId ? { sessionId } : {}),
      })

      setActivePid(result.pid)
    } catch (err: any) {
      useChatStore.getState().setMessageError(assistantId, err.message ?? 'Failed')
      setStreaming(false)
    }
  }

  return (
    <div className="flex flex-col h-full chat-surface">
      {/* ─── Titlebar ──────────────────────── */}
      <div className="titlebar-header text-[14px]">
        {/* Sidebar toggle — visible when sidebar is hidden */}
        {!sidebarOpen && (
          <button onClick={onToggleSidebar} className="titlebar-btn" title="显示侧边栏">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M9 3v18" />
            </svg>
          </button>
        )}

        <span className="text-xs font-medium select-none" style={{ color: 'var(--ap-foreground)' }}>Aperture</span>

        <div className="flex-1" />

        {/* Provider 快速切换器 */}
        {backendProviders.length > 0 && (
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setProviderMenuOpen(!providerMenuOpen)}
              className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-colors hover:bg-(--ap-muted)"
              style={{ color: 'var(--ap-foreground)' }}
              title="切换 Provider"
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: activeProvider?.iconColor ?? 'var(--ap-primary)' }} />
              <span className="max-w-[100px] truncate">{activeProvider?.name ?? BACKEND_DEFAULTS[activeBackend].name}</span>
              <svg width="10" height="10" viewBox="0 0 16 16" fill="none" style={{ transform: providerMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </button>

            {providerMenuOpen && (
              <div
                className="absolute right-0 top-full mt-1 w-56 rounded-xl border shadow-lg z-50 py-1"
                style={{
                  backgroundColor: 'var(--ap-card)',
                  borderColor: 'var(--ap-border)',
                  boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
                }}
              >
                <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide" style={{ color: 'var(--ap-muted-foreground)' }}>
                  {BACKEND_DEFAULTS[activeBackend].name}
                </div>
                {backendProviders.map((p) => (
                  <button
                    key={p.id}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-left hover:bg-(--ap-muted) transition-colors"
                    style={{ color: p.id === activeProvider?.id ? 'var(--ap-primary)' : 'var(--ap-foreground)' }}
                    onClick={() => setProviderMenuOpen(false)}
                  >
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: p.iconColor ?? 'var(--ap-muted-foreground)' }} />
                    <span className="truncate flex-1">{p.name}</span>
                    {p.id === activeProvider?.id && (
                      <span className="text-[10px] px-1 py-0.5 rounded" style={{ backgroundColor: 'var(--ap-agent-done)', color: '#fff' }}>当前</span>
                    )}
                  </button>
                ))}
                <div className="border-t my-1" style={{ borderColor: 'var(--ap-border)' }} />
                <button
                  onClick={() => { setProviderMenuOpen(false); onOpenSettings() }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-left hover:bg-(--ap-muted) transition-colors"
                  style={{ color: 'var(--ap-muted-foreground)' }}
                >
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="8" r="3"/><path d="M13.4 9a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.65 1.65 0 0 0 9 13.4V14a2 2 0 0 1-2 0v-.09A1.65 1.65 0 0 0 5.6 13.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 1.28 9H1a2 2 0 0 1 0-2h.09A1.65 1.65 0 0 0 2.6 5.6a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 7 1.68V1a2 2 0 0 1 2 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 13.4 7H14a2 2 0 0 1 0 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                  管理 Provider...
                </button>
              </div>
            )}
          </div>
        )}

        <button onClick={onOpenGateway} className="titlebar-btn" title="网关状态">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
            <line x1="8" y1="21" x2="16" y2="21" />
            <line x1="12" y1="17" x2="12" y2="21" />
          </svg>
        </button>

        <button onClick={onOpenSettings} className="titlebar-btn" title="设置">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </button>

        <div className="flex h-full">
          {(['minimize', 'maximize', 'close'] as const).map((action) => (
            <button
              key={action}
              onClick={() => (window.api.app as any)[action]?.()}
              className={`titlebar-win-btn ${action === 'close' ? 'close' : ''}`}
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                {action === 'minimize' && <path d="M3 19h18" />}
                {action === 'maximize' && <path d="M5 5h14v14H5z" />}
                {action === 'close' && <path d="M6 6l12 12M18 6 6 18" />}
              </svg>
            </button>
          ))}
        </div>
      </div>

      {/* ─── Messages area ──────────────────── */}
      <div ref={chatContainerRef} className="flex-1 overflow-y-auto overscroll-contain relative">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center gap-4 text-center" style={{ color: 'var(--ap-muted-foreground)' }}>
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                <circle cx="24" cy="24" r="18" stroke="currentColor" strokeWidth="1.5" opacity="0.4" />
                <circle cx="24" cy="24" r="10" stroke="currentColor" strokeWidth="1.5" opacity="0.6" />
                <circle cx="24" cy="24" r="4" fill="currentColor" opacity="0.8" />
              </svg>
              <p className="text-sm font-medium">Aperture</p>
              <p className="text-xs" style={{ opacity: 0.6 }}>选择一个 Agent 后端，开始对话</p>
            </div>
          </div>
        ) : (
          /* Centering wrapper — flex justify-center guarantees symmetry */
          <div className="flex justify-center">
            <div
              className="w-full max-w-[min(var(--composer-width),calc(100%-2rem))] min-w-0 flex flex-col py-4"
              style={{ gap: 'var(--conv-turn-gap)' }}
            >
              {(() => {
                // 按对话轮次折叠：每轮=一个user消息+对应AI回复
                const TURN_LIMIT = messageLimit // 默认20轮
                const userIndices: number[] = []
                messages.forEach((m, i) => { if (m.role === 'user') userIndices.push(i) })
                
                let displayMessages: typeof messages
                let hasMore = false
                let totalTurns = userIndices.length
                
                if (totalTurns > TURN_LIMIT) {
                  hasMore = true
                  const startIdx = userIndices[totalTurns - TURN_LIMIT]
                  displayMessages = messages.slice(startIdx)
                } else {
                  displayMessages = messages
                }
                
                return (
                  <>
                    {hasMore && (
                      <div className="text-center py-2">
                        <button
                          className="text-xs px-3 py-1 rounded-sm border"
                          style={{ borderColor: 'var(--ap-border)', color: 'var(--ap-muted-foreground)' }}
                          onClick={() => showAllMessages()}
                        >
                          加载更早对话（已显示 {TURN_LIMIT}/{totalTurns} 轮）
                        </button>
                      </div>
                    )}
                    {displayMessages.map((msg) => (
                      <MessageBubble key={msg.id} msg={msg} />
                    ))}
                  </>
                )
              })()}
              <div ref={messagesEndRef} style={{ paddingBottom: 100 }} />
            </div>
          </div>
        )}
      </div>

      {/* ─── Composer: Floating popout ─── */}
      {popout.poppedOut && (
        <div ref={popout.rootRef} onPointerDown={popout.onPointerDown} data-slot="composer-root" data-popped-out
          style={{ position: 'fixed', bottom: popout.position.bottom, right: popout.position.right, zIndex: 1000, padding: 5, width: 'min(var(--composer-width,720px), calc(100vw - 2rem))', userSelect: 'none', touchAction: 'none' }}>
          <div className="composer-surface" style={{ boxShadow: '0 8px 40px rgba(0,0,0,0.25)', borderRadius: '4px' }}>
            <textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key==='Enter'&&!e.shiftKey) { e.preventDefault(); handleSend() } }} placeholder={isStreaming ? 'AI 正在回复...' : '输入消息...'} className="composer-input" rows={1} />
            {isStreaming && <button onClick={async () => { const pid = useChatStore.getState().activePid; if (pid) try { await window.api.agent.kill(pid) } catch (_) {}; setStreaming(false) }} className="flex items-center justify-center rounded-md shrink-0 font-medium text-xs px-2.5 py-1" style={{ backgroundColor: 'var(--ap-destructive)', color: 'white' }}>停止</button>}
            <button onClick={popout.togglePopout} className="flex items-center justify-center rounded-md shrink-0 opacity-40 hover:opacity-70" style={{ width: 24, height: 24, color: 'var(--ap-muted-foreground)' }} title="收回"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg></button>
            <button onClick={() => handleSend()} disabled={!input.trim() || isStreaming} className="composer-send" style={{ backgroundColor: input.trim() && !isStreaming ? 'var(--ap-primary)' : 'transparent', color: input.trim() && !isStreaming ? 'var(--ap-primary-foreground)' : 'var(--ap-muted-foreground)', opacity: input.trim() && !isStreaming ? 1 : 0.4 }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg></button>
          </div>
        </div>
      )}

      {/* ─── Composer: Docked (absolute bottom center) ─── */}
      {!popout.poppedOut && (
        <div onPointerDown={popout.onPointerDown} data-slot="composer-root"
          style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: 'min(var(--composer-width,720px), calc(100% - 2rem))', maxWidth: '100%', paddingTop: '0.5rem', paddingBottom: 'var(--composer-shell-pad-block-end,0.625rem)', zIndex: 30 }}>
          <div className="composer-surface">
            <textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key==='Enter'&&!e.shiftKey) { e.preventDefault(); handleSend() } }} placeholder={isStreaming ? 'AI 正在回复... (可直接输入)' : '输入消息...'} className="composer-input" rows={1} />
            {isStreaming && <button onClick={async () => { const pid = useChatStore.getState().activePid; if (pid) try { await window.api.agent.kill(pid) } catch (_) {}; setStreaming(false) }} className="flex items-center justify-center rounded-md shrink-0 font-medium text-xs px-2.5 py-1" style={{ backgroundColor: 'var(--ap-destructive)', color: 'white' }}>停止</button>}
            <button onClick={popout.togglePopout} className="flex items-center justify-center rounded-md shrink-0 opacity-40 hover:opacity-70" style={{ width: 24, height: 24, color: 'var(--ap-muted-foreground)' }} title="弹出"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 6 15 12 9 18" /></svg></button>
            <button onClick={() => handleSend()} disabled={!input.trim() || isStreaming} className="composer-send" style={{ backgroundColor: input.trim() && !isStreaming ? 'var(--ap-primary)' : 'transparent', color: input.trim() && !isStreaming ? 'var(--ap-primary-foreground)' : 'var(--ap-muted-foreground)', opacity: input.trim() && !isStreaming ? 1 : 0.4 }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg></button>
          </div>
        </div>
      )}

    </div>
  )
}
