// ═══════════════════════════════════════════════
// Aperture — AppShell (1:1 Hermes layout)
// Sidebar: collapsible via sidebarOpen prop
// ═══════════════════════════════════════════════

import type { ReactNode } from 'react'

interface Props {
  sidebar: ReactNode
  children: ReactNode
  sidebarOpen: boolean
  detail?: ReactNode
  detailOpen?: boolean
}

export default function AppShell({ sidebar, children, sidebarOpen, detail, detailOpen }: Props) {
  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Sidebar — conditionally rendered */}
      {sidebarOpen && (
        <div
          className="flex-shrink-0 border-r h-full"
          style={{
            width: 'var(--sidebar-width, 14.8125rem)',
            borderColor: 'var(--ap-sidebar-border)',
          }}
        >
          {sidebar}
        </div>
      )}

      {/* Main area — fills remaining space, centers content */}
      <div className="relative flex-1 min-w-0 h-full">{children}</div>

      {/* Detail panel (optional overlay) */}
      {detail && detailOpen && (
        <div
          className="absolute top-[var(--titlebar-height)] right-0 bottom-0 w-[400px] border-l overflow-hidden z-20"
          style={{
            borderColor: 'var(--ap-border)',
            backgroundColor: 'var(--ap-background)',
          }}
        >
          {detail}
        </div>
      )}
    </div>
  )
}
