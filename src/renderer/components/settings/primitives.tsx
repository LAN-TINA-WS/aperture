// ═══════════════════════════════════════════════
// Aperture — Settings Primitives
//
// Reusable form components for settings panels.
// Follows CC Switch visual conventions (--ap-* CSS vars).
// ═══════════════════════════════════════════════

import { type ReactNode, type CSSProperties } from 'react'

/* ═══════════════════════════════════════════════
   SettingRow — 设置行（最核心的布局组件）
   ═══════════════════════════════════════════════ */

interface SettingRowProps {
  label: ReactNode
  description?: string
  children: ReactNode
  className?: string
}

export function SettingRow({ label, description, children, className = '' }: SettingRowProps) {
  return (
    <div className={`flex items-center justify-between py-2.5 ${className}`}>
      <div className="flex flex-col gap-0.5 min-w-0 mr-4">
        <span className="text-sm font-medium">{label}</span>
        {description && (
          <span className="text-xs" style={{ color: 'var(--ap-muted-foreground)' }}>
            {description}
          </span>
        )}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}

/* ═══════════════════════════════════════════════
   SectionHeader — 设置分组标题
   ═══════════════════════════════════════════════ */

interface SectionHeaderProps {
  title: string
  subtitle?: string
  description?: string
  actions?: ReactNode
  className?: string
}

export function SectionHeader({ title, subtitle, description, actions, className = '' }: SectionHeaderProps) {
  const desc = description ?? subtitle
  return (
    <div className={`flex items-center justify-between flex-wrap gap-2 mb-2.5 ${className}`}>
      <div>
        <h3 className="text-sm font-semibold">{title}</h3>
        {desc && (
          <p className="text-xs mt-0.5" style={{ color: 'var(--ap-muted-foreground)' }}>
            {desc}
          </p>
        )}
      </div>
      {actions && <div className="flex gap-2">{actions}</div>}
    </div>
  )
}

/* ═══════════════════════════════════════════════
   SettingCard — 设置卡片（GlassCard 替代）
   ═══════════════════════════════════════════════ */

interface SettingCardProps {
  children: ReactNode
  className?: string
  style?: CSSProperties
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

/* ═══════════════════════════════════════════════
   SettingInput — 通用输入控件
   支持 text / password / number / textarea / select
   ═══════════════════════════════════════════════ */

export interface SettingInputProps {
  type?: 'text' | 'password' | 'number' | 'textarea' | 'select'
  value: string | number
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onChange: (value: any) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  autoFocus?: boolean
  /** Only for type="select" */
  options?: { value: string; label: string }[]
  /** Only for type="textarea" */
  rows?: number
  style?: CSSProperties
}

const INPUT_BASE: CSSProperties = {
  backgroundColor: 'var(--ap-input)',
  color: 'var(--ap-foreground)',
  borderColor: 'var(--ap-border)',
}

export function SettingInput(props: SettingInputProps) {
  const {
    type = 'text',
    value,
    onChange,
    placeholder,
    className = '',
    disabled,
    autoFocus,
    options,
    rows = 3,
    style,
  } = props

  if (type === 'textarea') {
    return (
      <textarea
        value={value as string}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className={`w-full px-3 py-2 rounded-sm text-xs border outline-none font-mono ${className}`}
        style={{ ...INPUT_BASE, ...style }}
        disabled={disabled}
        autoFocus={autoFocus}
      />
    )
  }

  if (type === 'select') {
    return (
      <select
        value={value as string}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full px-3 py-2 rounded-sm text-sm border outline-none ${className}`}
        style={{ ...INPUT_BASE, ...style }}
        disabled={disabled}
        autoFocus={autoFocus}
      >
        {options?.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    )
  }

  if (type === 'number') {
    return (
      <input
        type="number"
        value={value as number}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        placeholder={placeholder}
        className={`w-full px-3 py-2 rounded-sm text-sm border outline-none ${className}`}
        style={{ ...INPUT_BASE, ...style }}
        disabled={disabled}
        autoFocus={autoFocus}
      />
    )
  }

  // text or password
  const isPassword = type === 'password'
  return (
    <input
      type={isPassword ? 'password' : 'text'}
      value={value as string}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full px-3 py-2 rounded-sm text-sm border outline-none ${isPassword ? 'font-mono' : ''} ${className}`}
      style={{ ...INPUT_BASE, ...style }}
      disabled={disabled}
      autoFocus={autoFocus}
    />
  )
}

/* ═══════════════════════════════════════════════
   SettingToggle — 开关
   ═══════════════════════════════════════════════ */

interface SettingToggleProps {
  checked: boolean
  onChange: (v: boolean) => void
  label?: string
  className?: string
}

export function SettingToggle({ checked, onChange, label, className = '' }: SettingToggleProps) {
  return (
    <label className={`flex items-center gap-2 cursor-pointer select-none ${className}`}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className="relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-(--ap-ring) focus-visible:ring-offset-1"
        style={{
          backgroundColor: checked ? 'var(--ap-primary)' : 'var(--ap-muted)',
        }}
      >
        <span
          className="pointer-events-none inline-block size-4 rounded-full bg-white shadow-sm ring-0 transition-transform duration-200"
          style={{
            transform: checked ? 'translateX(16px)' : 'translateX(0)',
          }}
        />
      </button>
      {label && (
        <span className="text-sm" style={{ color: 'var(--ap-foreground)' }}>
          {label}
        </span>
      )}
    </label>
  )
}
