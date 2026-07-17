// ═══════════════════════════════════════════════
// Aperture — Chat Store (Zustand)
// Manages the current conversation stream state
// ═══════════════════════════════════════════════

import { create } from 'zustand'

export interface StreamMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  thinking?: string
  toolCalls?: Array<{ id: string; name: string; input: unknown }>
  status?: 'streaming' | 'done' | 'error' | 'interrupted'
}

export interface UsageData {
  inputTokens: number
  outputTokens: number
  cacheRead: number
  cacheWrite: number
}

interface ChatState {
  messages: StreamMessage[]
  isStreaming: boolean
  streamingSessionId: string | null
  activePid: number | null
  streamStartTime: number | null   // 流开始时刻（毫秒时间戳），用于显示耗时
  turnStartTime: number | null    // 轮次开始时刻（毫秒时间戳），每轮对话独立计时
  messageLimit: number   // 默认20，只显示最近N条

  usage: UsageData | null
  setUsage: (u: UsageData | null) => void

  addUserMessage: (content: string) => void
  addAssistantMessage: (id: string) => void
  appendContent: (id: string, text: string) => void
  appendThinking: (id: string, text: string) => void
  addToolUse: (id: string, toolId: string, name: string, input: unknown) => void
  setMessageDone: (id: string) => void
  setMessageError: (id: string, error: string) => void
  setMessageInterrupted: (id: string) => void
  setStreaming: (v: boolean) => void
  setActivePid: (pid: number | null) => void
  setTurnStartTime: (t: number | null) => void
  clearMessages: () => void
  showAllMessages: () => void
  resetMessageLimit: () => void
  historyLoadedAt: number | null
  setHistoryLoadedAt: (t: number) => void

  // Session resume info (pid for stdin reuse, sessionId/providerId/sourcePath for scanned sessions)
  activeSessionMeta?: { pid?: number; sessionId?: string; providerId?: string; sourcePath?: string; title?: string }
  setActiveSessionMeta: (meta: { pid?: number; sessionId?: string; providerId?: string; sourcePath?: string; title?: string } | undefined) => void
}

let nextMsgId = 1

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  isStreaming: false,
  streamingSessionId: null,
  activePid: null,
  streamStartTime: null,
  turnStartTime: null,
  messageLimit: 20,
  activeSessionMeta: undefined,

  usage: null,
  setUsage: (u) => set({ usage: u }),
  historyLoadedAt: null,
  setHistoryLoadedAt: (t) => set({ historyLoadedAt: t }),

  addUserMessage: (content) => {
    const id = `msg_${nextMsgId++}`
    set((s) => ({
      messages: [...s.messages, { id, role: 'user', content }]
    }))
  },

  addAssistantMessage: (id) => {
    set((s) => ({
      messages: [...s.messages, { id, role: 'assistant', content: '', status: 'streaming' }],
      streamStartTime: Date.now(),
    }))
  },

  appendContent: (id, text) => {
    set((s) => ({
      messages: s.messages.map((m) =>
        m.id === id ? { ...m, content: m.content + text } : m
      )
    }))
  },

  appendThinking: (id, text) => {
    set((s) => ({
      messages: s.messages.map((m) =>
        m.id === id
          ? { ...m, thinking: (m.thinking ?? '') + text }
          : m
      )
    }))
  },

  addToolUse: (id, toolId, name, input) => {
    set((s) => ({
      messages: s.messages.map((m) => {
        if (m.id !== id) return m
        const existing = m.toolCalls ?? []
        return { ...m, toolCalls: [...existing, { id: toolId, name, input }] }
      })
    }))
  },

  setMessageDone: (id) => {
    set((s) => ({
      messages: s.messages.map((m) =>
        m.id === id ? { ...m, status: 'done' } : m
      ),
      isStreaming: false,
  streamingSessionId: null,
      streamStartTime: null,
    }))
  },

  setMessageError: (id, error) => {
    set((s) => ({
      messages: s.messages.map((m) =>
        m.id === id ? { ...m, content: error, status: 'error' } : m
      ),
      isStreaming: false,
  streamingSessionId: null,
      streamStartTime: null,
    }))
  },

  setMessageInterrupted: (id) => {
    set((s) => ({
      messages: s.messages.map((m) =>
        m.id === id ? { ...m, status: 'interrupted' } : m
      ),
      isStreaming: false,
  streamingSessionId: null,
      streamStartTime: null,
    }))
  },

  setStreaming: (v) => set({ isStreaming: v, streamStartTime: v ? Date.now() : null }),
  setStreamingSessionId: (id) => set({ streamingSessionId: id }),
  setActivePid: (pid) => set({ activePid: pid }),
  setTurnStartTime: (t) => set({ turnStartTime: t }),
  setActiveSessionMeta: (meta) => set({ activeSessionMeta: meta }),

  clearMessages: () => set({ messages: [], activeSessionMeta: undefined, messageLimit: 20 }),

  showAllMessages: () => set((s) => ({ messageLimit: s.messageLimit + 10 })),

  resetMessageLimit: () => set({ messageLimit: 20 })
}))
