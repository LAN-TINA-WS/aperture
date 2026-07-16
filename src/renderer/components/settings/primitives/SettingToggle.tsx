// ═══════════════════════════════════════════════
// SettingToggle — 通用开关 / 复选框
// ═══════════════════════════════════════════════

interface SettingToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
  className?: string
}

export function SettingToggle({ checked, onChange, label, className = '' }: SettingToggleProps) {
  return (
    <label className={`flex items-center gap-2 text-sm cursor-pointer ${className}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      {label}
    </label>
  )
}
