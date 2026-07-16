// ═══════════════════════════════════════════════
// Aperture — Session Store
// ═══════════════════════════════════════════════

import { create } from 'zustand'
import type { Session } from '../../shared/types'

interface SessionState {
  sessions: Session[]
  activeId: string | null
  loading: boolean

  load: () => Promise<void>
  create: (backendId: string, cwd?: string, model?: string) => Promise<Session>
  select: (id: string) => void
  remove: (id: string) => Promise<void>
  rename: (id: string, title: string) => Promise<void>
  togglePin: (id: string, pinned: boolean) => Promise<void>
  archive: (id: string) => Promise<void>
}

export const useSessionStore = create<SessionState>((set, get) => ({
  sessions: [],
  activeId: null,
  loading: false,

  load: async () => {
    set({ loading: true })
    try {
      const sessions = await window.api.session.list()
      set({ sessions: sessions as Session[], loading: false })
    } catch {
      set({ loading: false })
    }
  },

  create: async (backendId, cwd, model) => {
    const session = await window.api.session.create({
      backendId,
      cwd: cwd ?? '~',
      model
    })
    const s = session as unknown as Session
    set((st) => ({ sessions: [s, ...st.sessions], activeId: s.id }))
    return s
  },

  select: (id) => set({ activeId: id }),

  remove: async (id) => {
    await window.api.session.delete(id)
    set((st) => ({
      sessions: st.sessions.filter((s) => s.id !== id),
      activeId: st.activeId === id ? null : st.activeId
    }))
  },

  rename: async (id, title) => {
    await window.api.session.rename(id, title)
    set((st) => ({
      sessions: st.sessions.map((s) => (s.id === id ? { ...s, title } : s))
    }))
  },

  togglePin: async (id, pinned) => {
    await window.api.session.pin(id, pinned)
    set((st) => ({
      sessions: st.sessions.map((s) => (s.id === id ? { ...s, pinned } : s))
    }))
  },

  archive: async (id) => {
    await window.api.session.archive(id)
    set((st) => ({
      sessions: st.sessions.filter((s) => s.id !== id),
      activeId: st.activeId === id ? null : st.activeId
    }))
  }
}))
