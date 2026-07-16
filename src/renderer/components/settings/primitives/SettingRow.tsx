// ═══════════════════════════════════════════════
// SettingRow — 标签 + 描述 + 输入控件布局行
// ═══════════════════════════════════════════════

import type React from 'react'

interface SettingRowProps {
  label: React.ReactNode
  description?: string
  children: React.ReactNode
  className?: string
}

export function SettingRow({ label, description, children, className = '' }: SettingRowProps) {
  return (
    <div className={`space-y-1 ${className}`}>
      <label className="text-xs font-medium block">
        {label}
      </label>
      {description && (
        <p className="text-[10px]" style={{ color: 'var(--ap-muted-foreground)' }}>
          {description}
        </p>
      )}
      {children}
    </div>
  )
}
