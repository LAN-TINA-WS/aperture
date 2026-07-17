// ═══════════════════════════════════════════════
// Aperture — App Root (CC Switch integration)
// ═══════════════════════════════════════════════

import { useState, useEffect } from 'react'
import AppShell from './components/layout/AppShell'
import Sidebar from './components/layout/Sidebar'
import ChatArea from './components/layout/ChatArea'
import StatusBar from './components/layout/StatusBar'
import SettingsDialog from './components/settings/SettingsDialog'
import { useSettingsStore } from './stores/settingsStore'

export default function App() {
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  // Sync theme from settings store
  const theme = useSettingsStore((s) => s.general.theme)
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  const fontSize = useSettingsStore((s) => s.general.fontSize ?? '14px')

  useEffect(() => {
    // Only apply to chat content, not the whole UI
    document.documentElement.style.setProperty('--chat-font-size', fontSize)
  }, [fontSize])

  // Load settings on mount
  useEffect(() => {
    useSettingsStore.getState().load()
  }, [])

  return (
    <div className="flex flex-col h-screen">
      <AppShell
        sidebarOpen={sidebarOpen}
        sidebar={<Sidebar onClose={() => setSidebarOpen(false)} />}
      >
        <ChatArea
          onOpenSettings={() => setSettingsOpen(true)}
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen((v) => !v)}
        />
      </AppShell>
      <StatusBar />
      {settingsOpen && <SettingsDialog open={settingsOpen} onClose={() => setSettingsOpen(false)} />}
    </div>
  )
}
