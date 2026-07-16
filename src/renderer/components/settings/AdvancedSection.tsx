// ═══════════════════════════════════════════════
// Aperture — Advanced Settings Section
// ═══════════════════════════════════════════════

import { useSettingsStore, BACKEND_DEFAULTS, BACKEND_LIST } from '../../stores/settingsStore'
import GlassCard from './GlassCard'
import { SectionHeader } from './primitives'

export default function AdvancedSection() {
  const { advanced, setAdvanced } = useSettingsStore()

  return (
    <div className="space-y-4">
      {/* ── Section Header ── */}
      <SectionHeader title="高级设置" subtitle="故障转移、重试和性能配置" />

      {/* Config & Directory Overrides */}
      <GlassCard>
        <h3 className="text-sm font-semibold mb-4">配置目录</h3>
        <div className="space-y-3">
          <input
            value={advanced.configDir ?? '~/.aperture'}
            onChange={(e) => setAdvanced({ configDir: e.target.value })}
            placeholder="CC Switch 配置目录"
            className="w-full px-3 py-1.5 rounded-sm text-sm border outline-none font-mono"
            style={{ backgroundColor: 'var(--ap-input)', color: 'var(--ap-foreground)', borderColor: 'var(--ap-border)' }}
          />
          {BACKEND_LIST.map((bid) => (
            <div key={bid} className="flex gap-2 items-center">
              <span className="text-xs w-24 shrink-0" style={{ color: 'var(--ap-muted-foreground)' }}>
                {BACKEND_DEFAULTS[bid].name}
              </span>
              <input
                value={(advanced.directoryOverrides?.[bid] as string) ?? ''}
                onChange={(e) => setAdvanced({
                  directoryOverrides: { ...advanced.directoryOverrides, [bid]: e.target.value || undefined }
                })}
                placeholder={bid === 'claude' ? '~/.claude' : `~/.${bid}`}
                className="flex-1 px-3 py-1.5 rounded-sm text-xs border outline-none font-mono"
                style={{ backgroundColor: 'var(--ap-input)', color: 'var(--ap-foreground)', borderColor: 'var(--ap-border)' }}
              />
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Backup */}
      <GlassCard>
        <h3 className="text-sm font-semibold mb-4">自动备份</h3>
        <div className="flex gap-4">
          <div>
            <label className="text-xs block mb-1">间隔 (小时, 0=禁用)</label>
            <input type="number" value={advanced.backupIntervalHours}
              onChange={(e) => setAdvanced({ backupIntervalHours: Number(e.target.value) || 0 })}
              className="w-24 px-3 py-1.5 rounded-sm text-sm border outline-none"
              style={{ backgroundColor: 'var(--ap-input)', color: 'var(--ap-foreground)', borderColor: 'var(--ap-border)' }} />
          </div>
          <div>
            <label className="text-xs block mb-1">保留数量</label>
            <input type="number" value={advanced.backupRetainCount}
              onChange={(e) => setAdvanced({ backupRetainCount: Number(e.target.value) || 10 })}
              className="w-24 px-3 py-1.5 rounded-sm text-sm border outline-none"
              style={{ backgroundColor: 'var(--ap-input)', color: 'var(--ap-foreground)', borderColor: 'var(--ap-border)' }} />
          </div>
        </div>
      </GlassCard>

      {/* Usage Poll + Log Level */}
      <GlassCard>
        <h3 className="text-sm font-semibold mb-4">运行设置</h3>
        <div className="flex gap-4">
          <div>
            <label className="text-sm font-medium block mb-1">用量刷新 (秒)</label>
            <input type="number" value={advanced.usagePollInterval}
              onChange={(e) => setAdvanced({ usagePollInterval: Number(e.target.value) || 60 })}
              className="w-32 px-3 py-1.5 rounded-sm text-sm border outline-none"
              style={{ backgroundColor: 'var(--ap-input)', color: 'var(--ap-foreground)', borderColor: 'var(--ap-border)' }} />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">日志级别</label>
            <select value={advanced.logLevel}
              onChange={(e) => setAdvanced({ logLevel: e.target.value as any })}
              className="w-32 px-3 py-1.5 rounded-sm text-sm border outline-none"
              style={{ backgroundColor: 'var(--ap-input)', color: 'var(--ap-foreground)', borderColor: 'var(--ap-border)' }}>
              <option value="debug">Debug</option>
              <option value="info">Info</option>
              <option value="warn">Warn</option>
              <option value="error">Error</option>
            </select>
          </div>
        </div>
      </GlassCard>

      {/* WebDAV Sync */}
      <GlassCard>
        <h3 className="text-sm font-semibold mb-4">WebDAV 同步</h3>
        <p className="text-xs mb-3" style={{ color: 'var(--ap-muted-foreground)' }}>
          将配置自动同步到 WebDAV 服务器（如 Nextcloud、ownCloud 等）
        </p>

        <label className="flex items-center gap-2 text-sm cursor-pointer mb-3">
          <input
            type="checkbox"
            checked={advanced.webdavSync?.enabled ?? false}
            onChange={(e) => setAdvanced({
              webdavSync: { enabled: e.target.checked, autoSync: advanced.webdavSync?.autoSync ?? false, baseUrl: advanced.webdavSync?.baseUrl, username: advanced.webdavSync?.username, password: advanced.webdavSync?.password },
            })}
          />
          启用 WebDAV 同步
        </label>

        {(advanced.webdavSync?.enabled ?? false) && (
          <div className="space-y-3 pl-4 border-l-2" style={{ borderColor: 'var(--ap-primary)' }}>
            <label className="flex items-center gap-2 text-xs cursor-pointer">
              <input
                type="checkbox"
                checked={advanced.webdavSync?.autoSync ?? false}
                onChange={(e) => setAdvanced({
                  webdavSync: { ...advanced.webdavSync!, autoSync: e.target.checked },
                })}
              />
              自动同步（配置变更时自动上传）
            </label>

            <div>
              <label className="text-xs font-medium block mb-1">WebDAV 地址</label>
              <input
                value={advanced.webdavSync?.baseUrl ?? ''}
                onChange={(e) => setAdvanced({
                  webdavSync: { ...advanced.webdavSync!, baseUrl: e.target.value },
                })}
                placeholder="https://nextcloud.example.com/remote.php/dav/files/user/"
                className="w-full px-3 py-1.5 rounded-sm text-sm border outline-none font-mono"
                style={{
                  backgroundColor: 'var(--ap-input)',
                  color: 'var(--ap-foreground)',
                  borderColor: 'var(--ap-border)',
                }}
              />
            </div>

            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-xs font-medium block mb-1">用户名</label>
                <input
                  value={advanced.webdavSync?.username ?? ''}
                  onChange={(e) => setAdvanced({
                    webdavSync: { ...advanced.webdavSync!, username: e.target.value },
                  })}
                  className="w-full px-3 py-1.5 rounded-sm text-sm border outline-none"
                  style={{
                    backgroundColor: 'var(--ap-input)',
                    color: 'var(--ap-foreground)',
                    borderColor: 'var(--ap-border)',
                  }}
                />
              </div>
              <div className="flex-1">
                <label className="text-xs font-medium block mb-1">密码</label>
                <input
                  type="password"
                  value={advanced.webdavSync?.password ?? ''}
                  onChange={(e) => setAdvanced({
                    webdavSync: { ...advanced.webdavSync!, password: e.target.value },
                  })}
                  className="w-full px-3 py-1.5 rounded-sm text-sm border outline-none"
                  style={{
                    backgroundColor: 'var(--ap-input)',
                    color: 'var(--ap-foreground)',
                    borderColor: 'var(--ap-border)',
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {!(advanced.webdavSync?.enabled ?? false) && (
          <div
            className="text-xs py-2 px-3 rounded-sm border border-dashed text-center"
            style={{ color: 'var(--ap-muted-foreground)', borderColor: 'var(--ap-border)' }}
          >
            未启用 — WebDAV 同步为占位功能，后续版本对接
          </div>
        )}
      </GlassCard>

      {/* S3 Sync */}
      <GlassCard>
        <h3 className="text-sm font-semibold mb-4">S3 同步</h3>
        <p className="text-xs mb-3" style={{ color: 'var(--ap-muted-foreground)' }}>
          将配置自动同步到 S3 兼容对象存储（AWS S3、MinIO、Cloudflare R2 等）
        </p>

        <label className="flex items-center gap-2 text-sm cursor-pointer mb-3">
          <input
            type="checkbox"
            checked={advanced.s3Sync?.enabled ?? false}
            onChange={(e) => setAdvanced({
              s3Sync: { enabled: e.target.checked, autoSync: advanced.s3Sync?.autoSync ?? false, region: advanced.s3Sync?.region, bucket: advanced.s3Sync?.bucket, endpoint: advanced.s3Sync?.endpoint },
            })}
          />
          启用 S3 同步
        </label>

        {(advanced.s3Sync?.enabled ?? false) && (
          <div className="space-y-3 pl-4 border-l-2" style={{ borderColor: 'var(--ap-primary)' }}>
            <label className="flex items-center gap-2 text-xs cursor-pointer">
              <input
                type="checkbox"
                checked={advanced.s3Sync?.autoSync ?? false}
                onChange={(e) => setAdvanced({
                  s3Sync: { ...advanced.s3Sync!, autoSync: e.target.checked },
                })}
              />
              自动同步（配置变更时自动上传）
            </label>

            <div>
              <label className="text-xs font-medium block mb-1">区域 (Region)</label>
              <input
                value={advanced.s3Sync?.region ?? ''}
                onChange={(e) => setAdvanced({
                  s3Sync: { ...advanced.s3Sync!, region: e.target.value },
                })}
                placeholder="us-east-1"
                className="w-full px-3 py-1.5 rounded-sm text-sm border outline-none"
                style={{
                  backgroundColor: 'var(--ap-input)',
                  color: 'var(--ap-foreground)',
                  borderColor: 'var(--ap-border)',
                }}
              />
            </div>

            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-xs font-medium block mb-1">Bucket</label>
                <input
                  value={advanced.s3Sync?.bucket ?? ''}
                  onChange={(e) => setAdvanced({
                    s3Sync: { ...advanced.s3Sync!, bucket: e.target.value },
                  })}
                  placeholder="aperture-config"
                  className="w-full px-3 py-1.5 rounded-sm text-sm border outline-none"
                  style={{
                    backgroundColor: 'var(--ap-input)',
                    color: 'var(--ap-foreground)',
                    borderColor: 'var(--ap-border)',
                  }}
                />
              </div>
              <div className="flex-1">
                <label className="text-xs font-medium block mb-1">自定义 Endpoint</label>
                <input
                  value={advanced.s3Sync?.endpoint ?? ''}
                  onChange={(e) => setAdvanced({
                    s3Sync: { ...advanced.s3Sync!, endpoint: e.target.value },
                  })}
                  placeholder="https://s3.example.com"
                  className="w-full px-3 py-1.5 rounded-sm text-sm border outline-none"
                  style={{
                    backgroundColor: 'var(--ap-input)',
                    color: 'var(--ap-foreground)',
                    borderColor: 'var(--ap-border)',
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {!(advanced.s3Sync?.enabled ?? false) && (
          <div
            className="text-xs py-2 px-3 rounded-sm border border-dashed text-center"
            style={{ color: 'var(--ap-muted-foreground)', borderColor: 'var(--ap-border)' }}
          >
            未启用 — S3 同步为占位功能，后续版本对接
          </div>
        )}
      </GlassCard>

      {/* Connectivity Check */}
      <GlassCard>
        <h3 className="text-sm font-semibold mb-4">连通性检查</h3>
        <p className="text-xs mb-3" style={{ color: 'var(--ap-muted-foreground)' }}>
          检查各 Provider 的 API 端点连通性，验证配置是否正确。
        </p>

        <div className="space-y-3">
          {BACKEND_LIST.map((bid) => {
            const def = BACKEND_DEFAULTS[bid]
            return (
              <div
                key={bid}
                className="flex items-center justify-between rounded-sm border p-3"
                style={{ borderColor: 'var(--ap-border)' }}
              >
                <div>
                  <span className="text-sm font-medium">{def.name}</span>
                  <span className="ml-2 text-xs font-mono" style={{ color: 'var(--ap-muted-foreground)' }}>
                    {def.endpoint}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className="text-xs px-3 py-1 rounded"
                    style={{
                      backgroundColor: 'var(--ap-muted)',
                      color: 'var(--ap-muted-foreground)',
                    }}
                  >
                    未检测
                  </span>
                  <button
                    className="px-4 py-2 rounded-sm text-xs font-medium transition-colors"
                    style={{
                      backgroundColor: 'var(--ap-primary)',
                      color: 'var(--ap-primary-foreground)',
                    }}
                    onClick={() => {
                      alert(`连通性检查: ${def.name}\n端点: ${def.endpoint}\n\n该功能将于后续版本实现。`)
                    }}
                  >
                    检测
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </GlassCard>

      {/* Import / Export */}
      <GlassCard>
        <h3 className="text-sm font-semibold mb-4">导入 / 导出配置</h3>
        <div className="flex gap-2">
          <button onClick={() => {
            const state = useSettingsStore.getState()
            const data = JSON.stringify({
              providers: state.providers,
              proxy: state.proxy,
              failover: state.failover,
              general: state.general,
              advanced: state.advanced,
              mcpServers: state.mcpServers,
            }, null, 2)
            const blob = new Blob([data], { type: 'application/json' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a'); a.href = url; a.download = 'aperture-config.json'; a.click()
            URL.revokeObjectURL(url)
          }} className="px-4 py-2 rounded-sm text-xs font-medium"
            style={{ backgroundColor: 'var(--ap-primary)', color: 'var(--ap-primary-foreground)' }}>
            导出配置
          </button>
          <button
            className="px-4 py-2 rounded-sm text-xs font-medium"
            style={{ backgroundColor: 'var(--ap-muted)', color: 'var(--ap-muted-foreground)' }}
            onClick={() => {
              const input = document.createElement('input')
              input.type = 'file'
              input.accept = '.json'
              input.onchange = (e) => {
                const file = (e.target as HTMLInputElement).files?.[0]
                if (!file) return
                const reader = new FileReader()
                reader.onload = () => {
                  const ok = useSettingsStore.getState().importConfig(reader.result as string)
                  if (ok) {
                    alert('配置导入成功！')
                  } else {
                    alert('配置导入失败，请检查文件格式。')
                  }
                }
                reader.readAsText(file)
              }
              input.click()
            }}
          >
            导入配置
          </button>
        </div>
      </GlassCard>
    </div>
  )
}
