// ═══════════════════════════════════════════════
// Aperture — General Settings Section
// ═══════════════════════════════════════════════

import { useSettingsStore, BACKEND_DEFAULTS, BACKEND_LIST } from '../../stores/settingsStore'
import GlassCard from './GlassCard'
import { SectionHeader } from './primitives'

export default function GeneralSection() {
  const { general, setGeneral } = useSettingsStore()

  return (
    <div className="space-y-4">
      {/* ── Section Header ── */}
      <SectionHeader title="通用设置" />

      <GlassCard>
        <h3 className="text-sm font-semibold mb-4">主题外观</h3>
        <div className="flex gap-2 mb-4">
          {(['light', 'dark'] as const).map((t) => (
            <button key={t} onClick={() => setGeneral({ theme: t })}
              className="flex-1 py-3 px-4 rounded-sm text-sm font-medium border transition-colors"
              style={{
                backgroundColor: general.theme === t ? 'var(--ap-primary)' : 'var(--ap-muted)',
                color: general.theme === t ? 'var(--ap-primary-foreground)' : 'var(--ap-muted-foreground)',
                borderColor: general.theme === t ? 'var(--ap-ring)' : 'var(--ap-border)',
              }}>{t === 'light' ? '亮色' : '暗色'}</button>
          ))}
        </div>
        <div>
          <label className="text-sm font-medium block mb-2">字体大小</label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={general.fontSize ?? '14px'}
              onChange={e => setGeneral({ fontSize: e.target.value })}
              onBlur={() => useSettingsStore.getState().save()}
              placeholder="14px"
              className="w-24 px-3 py-2 rounded-sm border text-sm outline-none"
              style={{ backgroundColor: 'var(--ap-input)', borderColor: 'var(--ap-border)', color: 'var(--ap-foreground)' }}
            />
            <span className="text-xs" style={{ color: 'var(--ap-muted-foreground)' }}>如 13px, 0.875rem</span>
          </div>
        </div>
      </GlassCard>

      <GlassCard>
        <h3 className="text-sm font-semibold mb-4">界面语言</h3>
        <div className="flex gap-2">
          {([{ id: 'zh' as const, label: '中文' }, { id: 'en' as const, label: 'English' }]).map((l) => (
            <button key={l.id} onClick={() => setGeneral({ language: l.id })}
              className="flex-1 py-3 px-4 rounded-sm text-sm font-medium border transition-colors"
              style={{
                backgroundColor: general.language === l.id ? 'var(--ap-primary)' : 'var(--ap-muted)',
                color: general.language === l.id ? 'var(--ap-primary-foreground)' : 'var(--ap-muted-foreground)',
                borderColor: general.language === l.id ? 'var(--ap-ring)' : 'var(--ap-border)',
              }}>{l.label}</button>
          ))}
        </div>
      </GlassCard>

      <GlassCard>
        <h3 className="text-sm font-semibold mb-4">可见后端 (侧边栏显示/隐藏)</h3>
        <div className="grid grid-cols-2 gap-2">
          {BACKEND_LIST.map((bid) => (
            <label key={bid} className="flex items-center gap-2 text-xs cursor-pointer">
              <input type="checkbox"
                checked={general.visibleBackends?.[bid] ?? true}
                onChange={(e) => setGeneral({ visibleBackends: { ...general.visibleBackends, [bid]: e.target.checked } })}
              />{BACKEND_DEFAULTS[bid].name}
            </label>
          ))}
        </div>
      </GlassCard>

      <GlassCard>
        <h3 className="text-sm font-semibold mb-4">启动与同步</h3>
        <label className="flex items-center gap-2 text-sm cursor-pointer mb-4">
          <input type="checkbox" checked={general.launchAtStartup}
            onChange={(e) => setGeneral({ launchAtStartup: e.target.checked })} />
          开机自启动
        </label>

        {/* Skill Sync Method */}
        <div className="mb-4">
          <label className="text-sm font-medium block mb-2">Skill 同步方式</label>
          <p className="text-xs mb-2" style={{ color: 'var(--ap-muted-foreground)' }}>
            选择如何在各 Agent 后端之间同步 Skill 文件
          </p>
          <div className="flex gap-2">
            {([
              { id: 'auto' as const, label: '自动', desc: '自动检测最佳方式' },
              { id: 'symlink' as const, label: '符号链接', desc: '创建软链接共享同一文件' },
              { id: 'copy' as const, label: '复制', desc: '复制文件到各后端目录' },
            ]).map((m) => (
              <button
                key={m.id}
                onClick={() => setGeneral({ skillSyncMethod: m.id })}
                className="flex-1 py-2 px-3 rounded-sm text-xs border transition-colors"
                style={{
                  backgroundColor: general.skillSyncMethod === m.id ? 'var(--ap-primary)' : 'var(--ap-muted)',
                  color: general.skillSyncMethod === m.id ? 'var(--ap-primary-foreground)' : 'var(--ap-muted-foreground)',
                  borderColor: general.skillSyncMethod === m.id ? 'var(--ap-ring)' : 'var(--ap-border)',
                }}
              >
                <div className="font-medium">{m.label}</div>
                <div className="opacity-70 mt-0.5">{m.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Skill Storage Location */}
        <div>
          <label className="text-sm font-medium block mb-2">Skill 存储位置</label>
          <p className="text-xs mb-2" style={{ color: 'var(--ap-muted-foreground)' }}>
            选择 Skill 配置的集中存储位置
          </p>
          <div className="flex gap-2">
            {([
              { id: 'cc_switch' as const, label: 'CC Switch 目录', desc: '使用 CC Switch 统一配置目录' },
              { id: 'unified' as const, label: 'Aperture 统一目录', desc: '使用 Aperture 默认配置目录' },
            ]).map((loc) => (
              <button
                key={loc.id}
                onClick={() => setGeneral({ skillStorageLocation: loc.id })}
                className="flex-1 py-2 px-3 rounded-sm text-xs border transition-colors"
                style={{
                  backgroundColor: general.skillStorageLocation === loc.id ? 'var(--ap-primary)' : 'var(--ap-muted)',
                  color: general.skillStorageLocation === loc.id ? 'var(--ap-primary-foreground)' : 'var(--ap-muted-foreground)',
                  borderColor: general.skillStorageLocation === loc.id ? 'var(--ap-ring)' : 'var(--ap-border)',
                }}
              >
                <div className="font-medium">{loc.label}</div>
                <div className="opacity-70 mt-0.5">{loc.desc}</div>
              </button>
            ))}
          </div>
        </div>
      </GlassCard>

      {/* Failover Toggle */}
      <GlassCard>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold">故障转移开关</h3>
            <p className="text-xs mt-0.5" style={{ color: 'var(--ap-muted-foreground)' }}>
              在「代理设置」中启用后，可配置每个后端的 Provider 故障转移队列
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={general.enableFailoverToggle ?? false}
              onChange={(e) => setGeneral({ enableFailoverToggle: e.target.checked })}
            />
            <div
              className="w-9 h-5 rounded-full peer transition-colors"
              style={{
                backgroundColor: (general.enableFailoverToggle ?? false) ? 'var(--ap-primary)' : 'var(--ap-muted)',
              }}
            />
            <div
              className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform"
              style={{
                transform: (general.enableFailoverToggle ?? false) ? 'translateX(16px)' : 'translateX(0)',
              }}
            />
          </label>
        </div>
      </GlassCard>
    </div>
  )
}
