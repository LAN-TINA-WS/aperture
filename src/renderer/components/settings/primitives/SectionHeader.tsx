// ═══════════════════════════════════════════════
// SectionHeader — 分区标题
// ═══════════════════════════════════════════════

import type React from 'react'

interface SectionHeaderProps {
  title: string
  subtitle?: string
  className?: string
  actions?: React.ReactNode
}

export function SectionHeader({ title, subtitle, className = '', actions }: SectionHeaderProps) {
  return (
    <div className={`flex items-center justify-between flex-wrap gap-2 mb-2.5 ${className}`}>
      <div>
        <h3 className="text-sm font-semibold">{title}</h3>
        {subtitle && (
          <p className="text-xs mt-0.5" style={{ color: 'var(--ap-muted-foreground)' }}>
            {subtitle}
          </p>
        )}
      </div>
      {actions && <div className="flex gap-2">{actions}</div>}
    </div>
  )
}
