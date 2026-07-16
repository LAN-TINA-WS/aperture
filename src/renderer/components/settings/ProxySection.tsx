// ═══════════════════════════════════════════════
// Aperture — Proxy Settings Section
// ═══════════════════════════════════════════════

import { useSettingsStore, BACKEND_DEFAULTS, BACKEND_LIST } from '../../stores/settingsStore'
import GlassCard from './GlassCard'
import { SectionHeader } from './primitives'

export default function ProxySection() {
  const { proxy, setProxy, failover, setFailover, toggleFailoverForBackend, providers } = useSettingsStore()

  return (
    <div className="space-y-4">
      {/* ── Section Header ── */}
      <SectionHeader title="代理设置" subtitle="为 API 请求配置 HTTP 代理" />

      {/* ── Proxy Config Section ── */}
      <GlassCard>
        <h3 className="text-sm font-semibold mb-4">代理设置</h3>

        {/* Enable toggle */}
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={proxy.enabled}
            onChange={(e) => setProxy({ enabled: e.target.checked })}
          />
          启用代理
        </label>

        {proxy.enabled && (
          <div className="mt-4 space-y-4">
            {/* Protocol */}
            <div>
              <label className="text-xs font-medium block mb-1">协议</label>
              <select
                value={proxy.protocol}
                onChange={(e) => setProxy({ protocol: e.target.value as 'http' | 'https' | 'socks5' })}
                className="w-full px-3 py-1.5 rounded-sm text-sm border outline-none"
                style={{
                  backgroundColor: 'var(--ap-input)',
                  color: 'var(--ap-foreground)',
                  borderColor: 'var(--ap-border)',
                }}
              >
                <option value="http">HTTP</option>
                <option value="https">HTTPS</option>
                <option value="socks5">SOCKS5</option>
              </select>
            </div>

            {/* Host + Port */}
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-xs font-medium block mb-1">主机</label>
                <input
                  value={proxy.host}
                  onChange={(e) => setProxy({ host: e.target.value })}
                  placeholder="127.0.0.1"
                  className="w-full px-3 py-1.5 rounded-sm text-sm border outline-none"
                  style={{
                    backgroundColor: 'var(--ap-input)',
                    color: 'var(--ap-foreground)',
                    borderColor: 'var(--ap-border)',
                  }}
                />
              </div>
              <div className="w-24">
                <label className="text-xs font-medium block mb-1">端口</label>
                <input
                  type="number"
                  value={proxy.port}
                  onChange={(e) => setProxy({ port: Number(e.target.value) || 0 })}
                  className="w-full px-3 py-1.5 rounded-sm text-sm border outline-none"
                  style={{
                    backgroundColor: 'var(--ap-input)',
                    color: 'var(--ap-foreground)',
                    borderColor: 'var(--ap-border)',
                  }}
                />
              </div>
            </div>

            {/* Auth */}
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-xs font-medium block mb-1">用户名 (可选)</label>
                <input
                  value={proxy.username ?? ''}
                  onChange={(e) => setProxy({ username: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-sm text-sm border outline-none"
                  style={{
                    backgroundColor: 'var(--ap-input)',
                    color: 'var(--ap-foreground)',
                    borderColor: 'var(--ap-border)',
                  }}
                />
              </div>
              <div className="flex-1">
                <label className="text-xs font-medium block mb-1">密码 (可选)</label>
                <input
                  type="password"
                  value={proxy.password ?? ''}
                  onChange={(e) => setProxy({ password: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-sm text-sm border outline-none"
                  style={{
                    backgroundColor: 'var(--ap-input)',
                    color: 'var(--ap-foreground)',
                    borderColor: 'var(--ap-border)',
                  }}
                />
              </div>
            </div>

            {/* Bypass */}
            <div>
              <label className="text-xs font-medium block mb-1">绕过代理 (逗号分隔)</label>
              <input
                value={proxy.bypass ?? ''}
                onChange={(e) => setProxy({ bypass: e.target.value })}
                placeholder="localhost,127.0.0.1"
                className="w-full px-3 py-1.5 rounded-sm text-sm border outline-none"
                style={{
                  backgroundColor: 'var(--ap-input)',
                  color: 'var(--ap-foreground)',
                  borderColor: 'var(--ap-border)',
                }}
              />
            </div>

            {/* Timeout settings */}
            <div className="pt-2 border-t" style={{ borderColor: 'var(--ap-border)' }}>
              <label className="text-xs font-medium block mb-2">超时设置 (秒)</label>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] block mb-0.5" style={{ color: 'var(--ap-muted-foreground)' }}>首字节</label>
                  <input type="number" value={proxy.streamingFirstByteTimeout}
                    onChange={(e) => setProxy({ streamingFirstByteTimeout: Number(e.target.value) || 30 })}
                    className="w-full px-3 py-1.5 rounded text-xs border outline-none"
                    style={{ backgroundColor: 'var(--ap-input)', color: 'var(--ap-foreground)', borderColor: 'var(--ap-border)' }} />
                </div>
                <div>
                  <label className="text-[10px] block mb-0.5" style={{ color: 'var(--ap-muted-foreground)' }}>流空闲</label>
                  <input type="number" value={proxy.streamingIdleTimeout}
                    onChange={(e) => setProxy({ streamingIdleTimeout: Number(e.target.value) || 120 })}
                    className="w-full px-3 py-1.5 rounded text-xs border outline-none"
                    style={{ backgroundColor: 'var(--ap-input)', color: 'var(--ap-foreground)', borderColor: 'var(--ap-border)' }} />
                </div>
                <div>
                  <label className="text-[10px] block mb-0.5" style={{ color: 'var(--ap-muted-foreground)' }}>非流式</label>
                  <input type="number" value={proxy.nonStreamingTimeout}
                    onChange={(e) => setProxy({ nonStreamingTimeout: Number(e.target.value) || 300 })}
                    className="w-full px-3 py-1.5 rounded text-xs border outline-none"
                    style={{ backgroundColor: 'var(--ap-input)', color: 'var(--ap-foreground)', borderColor: 'var(--ap-border)' }} />
                </div>
              </div>
            </div>

            {/* Circuit breaker */}
            <div className="pt-2 border-t" style={{ borderColor: 'var(--ap-border)' }}>
              <label className="text-xs font-medium block mb-2">熔断器设置</label>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] block mb-0.5" style={{ color: 'var(--ap-muted-foreground)' }}>失败阈值</label>
                  <input type="number" value={proxy.circuitFailureThreshold}
                    onChange={(e) => setProxy({ circuitFailureThreshold: Number(e.target.value) || 5 })}
                    className="w-full px-3 py-1.5 rounded text-xs border outline-none"
                    style={{ backgroundColor: 'var(--ap-input)', color: 'var(--ap-foreground)', borderColor: 'var(--ap-border)' }} />
                </div>
                <div>
                  <label className="text-[10px] block mb-0.5" style={{ color: 'var(--ap-muted-foreground)' }}>恢复阈值</label>
                  <input type="number" value={proxy.circuitSuccessThreshold}
                    onChange={(e) => setProxy({ circuitSuccessThreshold: Number(e.target.value) || 2 })}
                    className="w-full px-3 py-1.5 rounded text-xs border outline-none"
                    style={{ backgroundColor: 'var(--ap-input)', color: 'var(--ap-foreground)', borderColor: 'var(--ap-border)' }} />
                </div>
                <div>
                  <label className="text-[10px] block mb-0.5" style={{ color: 'var(--ap-muted-foreground)' }}>超时(秒)</label>
                  <input type="number" value={proxy.circuitTimeoutSeconds}
                    onChange={(e) => setProxy({ circuitTimeoutSeconds: Number(e.target.value) || 30 })}
                    className="w-full px-3 py-1.5 rounded text-xs border outline-none"
                    style={{ backgroundColor: 'var(--ap-input)', color: 'var(--ap-foreground)', borderColor: 'var(--ap-border)' }} />
                </div>
              </div>
            </div>
          </div>
        )}
      </GlassCard>

      {/* ── Failover Config Section ── */}
      <GlassCard>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold">故障转移配置</h3>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={failover.enabled}
              onChange={(e) => setFailover({ enabled: e.target.checked })}
            />
            启用故障转移
          </label>
        </div>

        {failover.enabled && (
          <>
            <p className="text-xs mb-4" style={{ color: 'var(--ap-muted-foreground)' }}>
              为每个 Agent 后端配置 Provider 优先级队列。当主 Provider 不可用时，自动切换到下一个。
            </p>

            {/* Per-backend failover queues */}
            {BACKEND_LIST.map((bid) => {
              const queue = failover.queues?.[bid] ?? []
              const backendProviders = providers.filter((p) => p.backendId === bid)
              const enabledProviders = backendProviders.filter((p) => p.enabled)

              if (enabledProviders.length === 0) return null

              return (
                <div key={bid} className="rounded-sm border p-3 mb-2" style={{ borderColor: 'var(--ap-border)' }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{BACKEND_DEFAULTS[bid].name}</span>
                    <label className="flex items-center gap-2 text-xs cursor-pointer">
                      <input
                        type="checkbox"
                        checked={queue.length > 0}
                        onChange={(e) => toggleFailoverForBackend(bid, e.target.checked)}
                      />
                      启用
                    </label>
                  </div>

                  {queue.length > 0 ? (
                    <div className="space-y-1">
                      {queue.map((pid, idx) => {
                        const prov = providers.find((p) => p.id === pid)
                        if (!prov) return null
                        return (
                          <div
                            key={pid}
                            className="flex items-center gap-2 px-2 py-1 rounded text-xs"
                            style={{ backgroundColor: 'var(--ap-muted)' }}
                          >
                            <span
                              className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
                              style={{
                                backgroundColor: 'var(--ap-primary)',
                                color: 'var(--ap-primary-foreground)',
                              }}
                            >
                              {idx + 1}
                            </span>
                            <span className="flex-1">{prov.name}</span>
                            <button
                              onClick={() => {
                                const newQueue = queue.filter((id) => id !== pid)
                                setFailover({ queues: { ...failover.queues, [bid]: newQueue } })
                              }}
                              className="hover:opacity-70 text-xs"
                              style={{ color: 'var(--ap-destructive)' }}
                            >
                              移除
                            </button>
                          </div>
                        )
                      })}

                      {/* Add provider to queue button */}
                      {enabledProviders.filter((p) => !queue.includes(p.id)).length > 0 && (
                        <div className="pt-1">
                          <select
                            value=""
                            onChange={(e) => {
                              const pid = e.target.value
                              if (!pid) return
                              const newQueue = [...queue, pid]
                              setFailover({ queues: { ...failover.queues, [bid]: newQueue } })
                            }}
                            className="w-full px-3 py-1.5 rounded text-xs border outline-none"
                            style={{
                              backgroundColor: 'var(--ap-input)',
                              color: 'var(--ap-foreground)',
                              borderColor: 'var(--ap-border)',
                            }}
                          >
                            <option value="">+ 添加到队列</option>
                            {enabledProviders
                              .filter((p) => !queue.includes(p.id))
                              .map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.name}
                                </option>
                              ))}
                          </select>
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs" style={{ color: 'var(--ap-muted-foreground)' }}>
                      未配置 — 点击上方「启用」自动填充已启用 Provider
                    </span>
                  )}
                </div>
              )
            })}
          </>
        )}
      </GlassCard>
    </div>
  )
}
