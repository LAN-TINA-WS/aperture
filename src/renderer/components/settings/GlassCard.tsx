// ═══════════════════════════════════════════════
// Aperture — GlassCard shared component
// ═══════════════════════════════════════════════

import type { ReactNode } from 'react'

export default function GlassCard({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={`rounded-none border p-5 ${className}`}
      style={{
        backgroundColor: 'var(--ap-card)',
        borderColor: 'var(--ap-border)',
      }}
    >
      {children}
    </div>
  )
}
