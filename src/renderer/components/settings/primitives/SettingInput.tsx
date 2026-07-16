// ═══════════════════════════════════════════════
// SettingInput — 通用输入控件
// 支持 text, password, number, textarea, select
// ═══════════════════════════════════════════════

import type React from 'react'

export interface SettingInputProps {
  type?: 'text' | 'password' | 'number' | 'textarea' | 'select'
  value: string | number
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onChange: (value: any) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  autoFocus?: boolean
  style?: React.CSSProperties
  /** Only for type="select" */
  options?: { value: string; label: string }[]
  /** Only for type="textarea" */
  rows?: number
}

const inputBase: React.CSSProperties = {
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
    style,
    options,
    rows = 3,
  } = props

  const baseClass = type === 'textarea'
    ? `w-full px-3 py-2 rounded-sm text-xs border outline-none font-mono ${className}`
    : `w-full px-3 py-2 rounded-sm text-sm border outline-none ${className}`

  if (type === 'textarea') {
    return (
      <textarea
        value={value as string}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={baseClass}
        style={{ ...inputBase, ...style }}
        rows={rows}
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
        className={baseClass}
        style={{ ...inputBase, ...style }}
        disabled={disabled}
        autoFocus={autoFocus}
      >
        {(options ?? []).map((opt) => (
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
        className={baseClass}
        style={{ ...inputBase, ...style }}
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
      className={`${baseClass} ${isPassword ? 'font-mono' : ''}`}
      style={{ ...inputBase, ...style }}
      disabled={disabled}
      autoFocus={autoFocus}
    />
  )
}
