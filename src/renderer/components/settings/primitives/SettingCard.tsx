// ═══════════════════════════════════════════════
// SettingCard — 通用设置卡片容器
// 替代 GlassCard，使用 --ap-* CSS 变量
// ═══════════════════════════════════════════════

import type React from 'react'

interface SettingCardProps {
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
}

export function SettingCard({ children, className = '', style }: SettingCardProps) {
  return (
    <div
      className={`rounded-sm border p-5 ${className}`}
      style={{
        backgroundColor: 'var(--ap-card)',
        borderColor: 'var(--ap-border)',
        ...style,
      }}
    >
      {children}
    </div>
  )
}
