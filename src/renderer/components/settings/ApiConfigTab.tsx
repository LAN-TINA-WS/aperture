// ═══════════════════════════════════════════════
// Aperture — API Config Tab (CC Switch 1:1 复刻)
//
// Provider 管理 + 预设选择器 + 手动添加/编辑/删除 + 搜索筛选
// 三色边框 ProviderCard + CC Switch 风格 ProviderPresetSelector
// 使用 --ap-* CSS 变量，暗色主题兼容
// ═══════════════════════════════════════════════

import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import {
  useSettingsStore,
  type BackendId,
  type ProviderConfig,
  type ProviderPreset,
  type ProviderCategory,
  type ApiFormat,
  BACKEND_DEFAULTS,
  BACKEND_LIST,
} from '../../stores/settingsStore'
import {
  ALL_PRESETS,
  getPresetsForBackend,
  presetToProvider,
} from '../../stores/providerPresets'
import {
  SettingCard,
  SettingRow,
  SettingInput,
  SectionHeader,
  SettingToggle,
} from './primitives'

/* ─── SVG Icons (inline, no external deps) ────── */

function GripVertical({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <circle cx="6" cy="3" r="1.2" />
      <circle cx="10" cy="3" r="1.2" />
      <circle cx="6" cy="8" r="1.2" />
      <circle cx="10" cy="8" r="1.2" />
      <circle cx="6" cy="13" r="1.2" />
      <circle cx="10" cy="13" r="1.2" />
    </svg>
  )
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="7" cy="7" r="4.5" />
      <line x1="10.5" y1="10.5" x2="14" y2="14" />
    </svg>
  )
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <line x1="4" y1="4" x2="12" y2="12" />
      <line x1="12" y1="4" x2="4" y2="12" />
    </svg>
  )
}

interface CCSwitchProvider {
  backendId: string
  name?: string
  apiKey?: string
  endpoint?: string
  models?: string[]
  enabled?: boolean
  category?: string
  websiteUrl?: string
  apiKeyUrl?: string
  icon?: string
  iconColor?: string
  isPartner?: boolean
  isOfficial?: boolean
  presetKey?: string
  meta?: Record<string, unknown>
  headers?: Record<string, string>
  notes?: string
}

/* ─── Helpers ────────────────────────────────── */

function backendLabel(id: BackendId): string {
  return BACKEND_DEFAULTS[id].name
}

function maskApiKey(key: string): string {
  if (!key) return '未设置'
  if (key.length <= 8) return '****'
  return key.slice(0, 8) + '••••' + key.slice(-4)
}

const CATEGORY_LABELS: Record<string, string> = {
  official: '官方',
  cn_official: '国内官方',
  cloud_provider: '云服务商',
  aggregator: '聚合商',
  third_party: '第三方',
  custom: '自定义',
}

// CC Switch 风格分类颜色: 蓝/靛蓝/紫/灰 系统
const CATEGORY_COLORS: Record<string, { bg: string; fg: string }> = {
  official:     { bg: '#3B82F620', fg: '#3B82F6' },   // 蓝
  cn_official:  { bg: '#6366F120', fg: '#6366F1' },   // 靛蓝
  cloud_provider: { bg: '#8B5CF620', fg: '#8B5CF6' }, // 紫
  aggregator:   { bg: '#8B5CF620', fg: '#8B5CF6' },   // 紫
  third_party:  { bg: '#6B728020', fg: '#6B7280' },   // 灰
  custom:       { bg: '#6B728020', fg: '#6B7280' },   // 灰
}

function categoryStyle(category: string | undefined): React.CSSProperties {
  const c = CATEGORY_COLORS[category ?? ''] ?? CATEGORY_COLORS.custom
  return { backgroundColor: c.bg, color: c.fg }
}

/* ═══════════════════════════════════════════════
   Main Component
   ═══════════════════════════════════════════════ */

export default function ApiConfigTab() {
  const { providers, addProvider, updateProvider, removeProvider } = useSettingsStore()

  const [adding, setAdding] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)
  const [showPresetPanel, setShowPresetPanel] = useState(false)
  const [presetBackend, setPresetBackend] = useState<BackendId>('claude')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterBackend, setFilterBackend] = useState<BackendId | 'all'>('all')
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  // ── Quick-search overlay (Ctrl+F) ──
  const [showQuickSearch, setShowQuickSearch] = useState(false)
  const quickSearchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault()
        setShowQuickSearch(true)
        setTimeout(() => quickSearchRef.current?.focus(), 50)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  // ── Selected preset for API key entry ──
  const [selectedPreset, setSelectedPreset] = useState<ProviderPreset | null>(null)
  const [presetApiKey, setPresetApiKey] = useState('')
  const [presetCustomName, setPresetCustomName] = useState('')

  const handlePresetSelect = useCallback((preset: ProviderPreset) => {
    setSelectedPreset(preset)
    setPresetApiKey('')
    setPresetCustomName(preset.name)
  }, [])

  const handlePresetConfirm = useCallback(() => {
    if (!selectedPreset || !presetApiKey.trim()) return
    const provider = presetToProvider(selectedPreset, presetApiKey.trim(), presetCustomName.trim() || undefined)
    addProvider(provider)
    setSelectedPreset(null)
    setPresetApiKey('')
    setPresetCustomName('')
    setShowPresetPanel(false)
  }, [selectedPreset, presetApiKey, presetCustomName, addProvider])

  // ── Import CC Switch config ──
  const [importingCC, setImportingCC] = useState(false)
  const [importToast, setImportToast] = useState<string | null>(null)

  const handleImportCCSwitch = useCallback(async () => {
    setImportingCC(true)
    setImportToast(null)
    try {
      const ccProviders = await window.api.ccswitch.readProviders()
      if (!ccProviders || !Array.isArray(ccProviders) || ccProviders.length === 0) {
        setImportToast('❌ 未读取到 CC Switch 配置')
        return
      }
      let imported = 0
      for (const raw of ccProviders) {
        const cp = raw as CCSwitchProvider
        const provider: Omit<ProviderConfig, 'id' | 'createdAt'> = {
          backendId: (cp.backendId as BackendId) ?? 'claude',
          name: cp.name ?? 'CC Switch 导入',
          apiKey: cp.apiKey ?? '',
          endpoint: cp.endpoint ?? '',
          models: cp.models ?? [],
          enabled: cp.enabled ?? true,
          category: cp.category as ProviderCategory | undefined,
          websiteUrl: cp.websiteUrl,
          apiKeyUrl: cp.apiKeyUrl,
          icon: cp.icon,
          iconColor: cp.iconColor,
          isPartner: cp.isPartner,
          isOfficial: cp.isOfficial,
          presetKey: cp.presetKey,
          meta: cp.meta,
          headers: cp.headers,
          notes: cp.notes,
        }
        addProvider(provider)
        imported++
      }
      setImportToast(`✅ 成功导入 ${imported} 个 Provider`)
    } catch (err: any) {
      setImportToast(`❌ 导入失败: ${err?.message ?? String(err)}`)
    } finally {
      setImportingCC(false)
      setTimeout(() => setImportToast(null), 4000)
    }
  }, [addProvider])

  // ── Filter & Group providers ──

  const filteredProviders = useMemo(() => {
    let list = [...providers]
    if (filterBackend !== 'all') {
      list = list.filter((p) => p.backendId === filterBackend)
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase()
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.endpoint.toLowerCase().includes(q) ||
          p.models.some((m) => m.toLowerCase().includes(q)) ||
          (p.presetKey && p.presetKey.toLowerCase().includes(q)),
      )
    }
    return list
  }, [providers, filterBackend, searchQuery])

  const byBackend = useMemo(() => {
    const map = new Map<BackendId, ProviderConfig[]>()
    for (const p of filteredProviders) {
      const arr = map.get(p.backendId) ?? []
      arr.push(p)
      map.set(p.backendId, arr)
    }
    return map
  }, [filteredProviders])

  // ── Delete handler ──

  const handleDelete = (id: string) => setConfirmDelete(id)
  const confirmDeleteAction = () => {
    if (confirmDelete) {
      removeProvider(confirmDelete)
      setConfirmDelete(null)
    }
  }

  return (
    <div className="space-y-4 relative">
      {/* ═══ Agent Config Scanner ═══ */}
      <AgentConfigScanner />

      {/* ═══ Quick Search Overlay (Ctrl+F) ═══ */}
      {showQuickSearch && (
        <div
          className="sticky top-0 z-10 flex items-center gap-2 px-3 py-2 rounded-sm border shadow-sm mb-3"
          style={{
            backgroundColor: 'var(--ap-card)',
            borderColor: 'var(--ap-primary)',
            boxShadow: '0 0 0 1px var(--ap-primary), 0 4px 12px rgba(0,0,0,0.1)',
          }}
        >
          <SearchIcon className="shrink-0" />
          <input
            ref={quickSearchRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索 Provider 名称 / endpoint / model ..."
            className="flex-1 px-3 py-1.5 rounded text-xs outline-none"
              style={{
                backgroundColor: 'var(--ap-input)',
                color: 'var(--ap-foreground)',
                border: 'none',
              }}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setShowQuickSearch(false)
                setSearchQuery('')
              }
            }}
          />
          <span
            className="text-[10px] px-1.5 py-0.5 rounded shrink-0"
            style={{ backgroundColor: 'var(--ap-muted)', color: 'var(--ap-muted-foreground)' }}
          >
            {filteredProviders.length} 个结果
          </span>
          <button
            onClick={() => { setShowQuickSearch(false); setSearchQuery('') }}
            className="p-1 rounded hover:opacity-70"
            style={{ color: 'var(--ap-muted-foreground)' }}
          >
            <XIcon />
          </button>
        </div>
      )}

      {/* ═══ Import Toast ═══ */}
      {importToast && (
        <div
          className="px-3 py-2 rounded-sm text-xs font-medium animate-pulse"
          style={{
            backgroundColor: importToast.startsWith('✅') ? '#10B98120' : '#EF444420',
            color: importToast.startsWith('✅') ? '#10B981' : '#EF4444',
            border: `1px solid ${importToast.startsWith('✅') ? '#10B98140' : '#EF444440'}`,
          }}
        >
          {importToast}
        </div>
      )}

      {/* ═══ Header: title + actions ═══ */}
      <SectionHeader
        title="Provider 管理"
        subtitle="添加、编辑和导入 API Provider 配置"
        actions={
          <>
            <button
              onClick={handleImportCCSwitch}
              disabled={importingCC}
              className="px-3 py-2 rounded-sm text-xs font-medium transition-colors border"
              style={{
                backgroundColor: 'var(--ap-muted)',
                color: 'var(--ap-muted-foreground)',
                borderColor: 'var(--ap-border)',
                opacity: importingCC ? 0.5 : 1,
              }}
            >
              {importingCC ? '导入中...' : '📥 导入 CC Switch 配置'}
            </button>
            <button
              onClick={() => {
                setShowPresetPanel((v) => !v)
                setAdding(false)
                setEditing(null)
                setSelectedPreset(null)
              }}
              className="px-3 py-2 rounded-sm text-xs font-medium transition-colors border"
              style={{
                backgroundColor: showPresetPanel ? 'var(--ap-primary)' : 'var(--ap-muted)',
                color: showPresetPanel ? 'var(--ap-primary-foreground)' : 'var(--ap-muted-foreground)',
                borderColor: 'var(--ap-border)',
              }}
            >
              ⚡ 从预设添加
            </button>
            <button
              onClick={() => {
                setAdding(true)
                setEditing(null)
                setShowPresetPanel(false)
                setSelectedPreset(null)
              }}
              className="px-3 py-2 rounded-sm text-xs font-medium transition-colors"
              style={{
                backgroundColor: 'var(--ap-primary)',
                color: 'var(--ap-primary-foreground)',
              }}
            >
              + 添加 Provider
            </button>
          </>
        }
      />

      {/* ═══ Search + Filter bar ═══ */}
      {!showQuickSearch && (
        <div className="flex gap-2 flex-wrap">
          <div className="flex-1 min-w-[180px] relative">
            <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索 Provider 名称 / endpoint / model ... (Ctrl+F 快速搜索)"
              className="w-full pl-8 pr-3 py-2 rounded-sm text-xs border outline-none"
              style={{
                backgroundColor: 'var(--ap-input)',
                color: 'var(--ap-foreground)',
                borderColor: 'var(--ap-border)',
              }}
            />
          </div>
          <select
            value={filterBackend}
            onChange={(e) => setFilterBackend(e.target.value as BackendId | 'all')}
            className="px-3 py-2 rounded-sm text-xs border outline-none"
            style={{
              backgroundColor: 'var(--ap-input)',
              color: 'var(--ap-foreground)',
              borderColor: 'var(--ap-border)',
            }}
          >
            <option value="all">全部后端</option>
            {BACKEND_LIST.map((bid) => (
              <option key={bid} value={bid}>
                {backendLabel(bid)}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* ═══ Preset Panel (CC Switch Style) ═══ */}
      {showPresetPanel && (
        <div
          className="rounded-sm border p-5 space-y-4"
          style={{
            borderColor: 'var(--ap-border)',
            backgroundColor: 'color-mix(in srgb, var(--ap-accent) 30%, transparent)',
          }}
        >
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold">从预设添加 Provider</h4>
            <span
              className="text-[10px] px-2 py-0.5 rounded"
              style={{ backgroundColor: 'var(--ap-muted)', color: 'var(--ap-muted-foreground)' }}
            >
              {getPresetsForBackend(presetBackend).length} 个预设
            </span>
          </div>

          {/* Backend selector */}
          <SettingRow label="选择后端">
            <SettingInput
              type="select"
              value={presetBackend}
              onChange={(v) => {
                setPresetBackend(v as BackendId)
                setSelectedPreset(null)
              }}
              options={BACKEND_LIST.map((bid) => ({
                value: bid,
                label: `${backendLabel(bid)} (${getPresetsForBackend(bid).length})`,
              }))}
            />
          </SettingRow>

          {/* ProviderPresetSelector */}
          <ProviderPresetSelector
            backendId={presetBackend}
            onSelect={handlePresetSelect}
            selectedKey={selectedPreset?.key ?? null}
          />

          {/* Inline API Key form when preset selected */}
          {selectedPreset && (
            <PresetAddForm
              preset={selectedPreset}
              apiKey={presetApiKey}
              customName={presetCustomName}
              onApiKeyChange={setPresetApiKey}
              onNameChange={setPresetCustomName}
              onConfirm={handlePresetConfirm}
              onCancel={() => setSelectedPreset(null)}
            />
          )}
        </div>
      )}

      {/* ═══ Manual Add Form ═══ */}
      {adding && (
        <ProviderForm
          onSave={(p) => {
            addProvider(p)
            setAdding(false)
          }}
          onCancel={() => setAdding(false)}
        />
      )}

      {/* ═══ 已配置的 Provider 列表 ═══ */}
      {filteredProviders.length > 0 && (
        <SectionHeader
          title={`已配置的 Provider (${filteredProviders.length})`}
          subtitle="点击卡片可查看详情，hover 显示操作按钮"
        />
      )}

      {/* ═══ Provider List grouped by backend ═══ */}
      {BACKEND_LIST.map((bid) => {
        const list = byBackend.get(bid) ?? []
        if (filterBackend !== 'all' && filterBackend !== bid) return null
        if (filterBackend === 'all' && list.length === 0 && searchQuery) return null

        return (
          <div key={bid}>
            <div
              className="text-xs font-semibold uppercase tracking-wide mb-2 flex items-center gap-2"
              style={{ color: 'var(--ap-muted-foreground)' }}
            >
              {backendLabel(bid)}
              {list.length > 0 && (
                <span
                  className="px-1.5 py-0.5 rounded text-[10px]"
                  style={{ backgroundColor: 'var(--ap-muted)', color: 'var(--ap-muted-foreground)' }}
                >
                  {list.length}
                </span>
              )}
            </div>

            {list.length === 0 && (
              <div
                className="text-xs py-3 px-4 rounded-sm border border-dashed"
                style={{ color: 'var(--ap-muted-foreground)', borderColor: 'var(--ap-border)' }}
              >
                暂无配置 —{' '}
                <button
                  onClick={() => { setAdding(true); setFilterBackend(bid) }}
                  className="underline"
                  style={{ color: 'var(--ap-primary)' }}
                >
                  添加
                </button>
              </div>
            )}

            <div className="space-y-3">
              {list.map((p) =>
                editing === p.id ? (
                  <ProviderForm
                    key={p.id}
                    initial={p}
                    onSave={(patch) => {
                      updateProvider(p.id, patch)
                      setEditing(null)
                    }}
                    onCancel={() => setEditing(null)}
                  />
                ) : (
                  <ProviderCard
                    key={p.id}
                    provider={p}
                    isActive={p.enabled}
                    onEdit={() => setEditing(p.id)}
                    onToggle={() => updateProvider(p.id, { enabled: !p.enabled })}
                    onRemove={() => handleDelete(p.id)}
                  />
                ),
              )}
            </div>
          </div>
        )
      })}

      {/* ═══ Empty state ═══ */}
      {filteredProviders.length === 0 && !adding && !showPresetPanel && (
        <div
          className="text-center py-12 rounded-sm border-2 border-dashed"
          style={{ borderColor: 'var(--ap-border)', color: 'var(--ap-muted-foreground)' }}
        >
          <div className="text-4xl mb-4 opacity-30">📦</div>
          <p className="text-base font-medium mb-2" style={{ color: 'var(--ap-foreground)' }}>
            {searchQuery ? '🔍 无匹配结果' : '尚未配置任何 Provider'}
          </p>
          <p className="text-sm mb-4">
            {searchQuery
              ? '尝试更换搜索关键词或清除筛选条件'
              : '添加 API Provider 以开始使用 AI Agent'}
          </p>
          {!searchQuery && (
            <div className="flex gap-2 justify-center">
              <button
                onClick={() => setShowPresetPanel(true)}
                className="px-4 py-2 rounded-sm text-sm font-medium border transition-colors hover:opacity-80"
                style={{
                  borderColor: 'var(--ap-primary)',
                  color: 'var(--ap-primary)',
                  backgroundColor: 'transparent',
                }}
              >
                ⚡ 从预设添加
              </button>
              <button
                onClick={() => setAdding(true)}
                className="px-4 py-2 rounded-sm text-sm font-medium transition-colors hover:opacity-80"
                style={{
                  backgroundColor: 'var(--ap-primary)',
                  color: 'var(--ap-primary-foreground)',
                }}
              >
                + 添加 Provider
              </button>
            </div>
          )}
        </div>
      )}

      {/* ═══ Delete Confirmation Modal ═══ */}
      {confirmDelete && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.35)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setConfirmDelete(null) }}
        >
          <div
            className="rounded-none p-5 max-w-sm w-full mx-4 shadow-xl"
            style={{
              backgroundColor: 'var(--ap-card)',
              color: 'var(--ap-card-foreground)',
              border: '1px solid var(--ap-border)',
            }}
          >
            <h4 className="text-sm font-semibold mb-2">确认删除</h4>
            <p className="text-xs mb-4" style={{ color: 'var(--ap-muted-foreground)' }}>
              确定要删除此 Provider 吗？此操作不可撤销。
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 rounded-sm text-xs font-medium"
                style={{ backgroundColor: 'var(--ap-muted)', color: 'var(--ap-muted-foreground)' }}
              >
                取消
              </button>
              <button
                onClick={confirmDeleteAction}
                className="px-4 py-2 rounded-sm text-xs font-medium"
                style={{ backgroundColor: 'var(--ap-destructive)', color: 'var(--ap-destructive-foreground)' }}
              >
                删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════
   Agent Config Scanner — 扫描本地 Agent 配置
   ═══════════════════════════════════════════════ */

function AgentConfigScanner() {
  const [agents, setAgents] = useState<any[]>([])
  const [scanning, setScanning] = useState(false)
  const [importing, setImporting] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const addProvider = useSettingsStore(s => s.addProvider)

  const handleScan = async () => {
    setScanning(true)
    setToast(null)
    try {
      const result = await window.api.agentConfig.scan()
      setAgents(result)
      // Auto-import: immediately add scanned agents as Providers
      if (result.length > 0) {
        const providers = await window.api.agentConfig.import()
        // Dedup: skip providers that already exist (match by name + apiBase)
        const existing = useSettingsStore.getState().providers
        let added = 0
        for (const p of providers) {
          const exists = existing.some(
            (ep) => ep.name === (p as any).name && ep.apiBase === (p as any).apiBase
          )
          if (!exists) {
            addProvider(p as Omit<ProviderConfig, 'id' | 'createdAt'>)
            added++
          }
        }
        setToast(`✅ 扫描到 ${result.length} 个 Agent${added < providers.length ? `，已跳过 ${providers.length - added} 个重复` : ''}，已导入 ${added} 个 Provider`)
      } else {
        setToast('未发现本地 Agent 配置')
      }
      setTimeout(() => setToast(null), 4000)
    } catch (err: any) {
      setToast(`❌ 扫描失败: ${err?.message ?? String(err)}`)
      setTimeout(() => setToast(null), 4000)
    } finally {
      setScanning(false)
    }
  }

  const handleImport = async () => {
    setImporting(true)
    setToast(null)
    try {
      const providers = await window.api.agentConfig.import()
      for (const p of providers) {
        addProvider(p as Omit<ProviderConfig, 'id' | 'createdAt'>)
      }
      setToast(`✅ 成功导入 ${providers.length} 个 Agent 配置`)
      setTimeout(() => setToast(null), 4000)
    } catch (err: any) {
      setToast(`❌ 导入失败: ${err?.message ?? String(err)}`)
      setTimeout(() => setToast(null), 4000)
    } finally {
      setImporting(false)
    }
  }

  return (
    <SettingCard className="mb-2">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold">本地 Agent 配置</h3>
        <button
          onClick={handleScan}
          disabled={scanning}
          className="px-3 py-2 rounded-sm text-xs font-medium transition-colors"
          style={{
            backgroundColor: 'var(--ap-primary)',
            color: 'var(--ap-primary-foreground)',
            opacity: scanning ? 0.5 : 1,
          }}
        >
          {scanning ? '扫描中...' : agents.length > 0 ? '重新扫描' : '扫描配置'}
        </button>
      </div>

      {/* Toast */}
      {toast && (
        <div
          className="px-3 py-1.5 rounded-sm text-xs font-medium mb-3"
          style={{
            backgroundColor: toast.startsWith('✅') ? '#10B98120' : '#EF444420',
            color: toast.startsWith('✅') ? '#10B981' : '#EF4444',
            border: `1px solid ${toast.startsWith('✅') ? '#10B98140' : '#EF444440'}`,
          }}
        >
          {toast}
        </div>
      )}

      {/* Agent list */}
      {agents.length > 0 && (
        <div className="space-y-3">
          {agents.map((a, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-3 rounded-sm border"
              style={{ borderColor: 'var(--ap-border)', backgroundColor: 'var(--ap-muted)' }}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{a.agentName}</span>
                  {a.installed ? (
                    <span
                      className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                      style={{ backgroundColor: '#10B98120', color: '#10B981' }}
                    >
                      ✓ 已安装
                    </span>
                  ) : (
                    <span
                      className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                      style={{ backgroundColor: '#EF444420', color: '#EF4444' }}
                    >
                      ✗ 未安装
                    </span>
                  )}
                </div>
                {a.providerName && (
                  <div
                    className="text-xs mt-0.5"
                    style={{ color: 'var(--ap-muted-foreground)' }}
                  >
                    <span>{a.providerName}</span>
                    {a.endpoint && (
                      <span className="ml-2 font-mono text-[11px]">{a.endpoint}</span>
                    )}
                  </div>
                )}
              </div>
              {a.installed && (
                <button
                  onClick={handleImport}
                  disabled={importing}
                  className="px-3 py-2 rounded-sm text-xs font-medium transition-colors shrink-0"
                  style={{
                    backgroundColor: 'var(--ap-primary)',
                    color: 'var(--ap-primary-foreground)',
                    opacity: importing ? 0.5 : 1,
                  }}
                >
                  {importing ? '导入中...' : '导入'}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Empty state after scan */}
      {!scanning && agents.length === 0 && toast && !toast.startsWith('❌') && (
        <div
          className="text-xs py-2"
          style={{ color: 'var(--ap-muted-foreground)' }}
        >
          未发现本地 Agent 配置
        </div>
      )}
    </SettingCard>
  )
}

/* ═══════════════════════════════════════════════
   Provider Card — CC Switch 三色边框系统
   ═══════════════════════════════════════════════ */

function ProviderCard({
  provider: p,
  isActive,
  onEdit,
  onToggle,
  onRemove,
}: {
  provider: ProviderConfig
  isActive: boolean
  onEdit: () => void
  onToggle: () => void
  onRemove: () => void
}) {
  const hasCategoryColor = p.category && CATEGORY_COLORS[p.category]

  return (
    <div
      className="relative overflow-hidden rounded-none border p-5 bg-(--ap-card) group transition-shadow"
      style={{
        borderColor: isActive ? '#3B82F660' : 'var(--ap-border)',
        boxShadow: isActive ? '0 0 0 1px rgba(59,130,246,0.1), 0 1px 3px rgba(59,130,246,0.08)' : undefined,
      }}
    >
      {/* 渐变叠加层 */}
      <div
        className={[
          'absolute inset-0 bg-gradient-to-r to-transparent transition-opacity pointer-events-none',
          isActive ? 'from-blue-500/10 opacity-100' : 'from-(--ap-primary)/5 opacity-0 group-hover:opacity-100',
        ].join(' ')}
      />

      <div className="relative flex items-center gap-3">
        {/* 拖拽手柄 — 仅视觉效果 */}
        <button
          className="cursor-grab shrink-0"
          style={{ color: 'var(--ap-muted-foreground)', opacity: 0.4 }}
          tabIndex={-1}
          aria-hidden
        >
          <GripVertical className="size-4" />
        </button>

        {/* 图标 + 名称区 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {/* 图标色块 */}
            {p.iconColor && (
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: p.iconColor }}
              />
            )}
            <span className="text-sm font-semibold truncate">{p.name}</span>

            {/* 分类徽章 */}
            {p.category && CATEGORY_LABELS[p.category] && (
              <span
                className="text-[10px] px-1.5 py-0.5 rounded font-medium shrink-0"
                style={categoryStyle(p.category)}
              >
                {CATEGORY_LABELS[p.category]}
              </span>
            )}

            {/* Partner 徽章 */}
            {p.isPartner && (
              <span className="text-[10px] px-1 py-0.5 rounded bg-amber-500/10 text-amber-600 shrink-0 font-medium">
                {p.presetKey?.startsWith('claude-kimi') ? '♥' : '★'} Partner
              </span>
            )}

            {/* 启用/禁用状态 */}
            <span
              className="text-[10px] px-1.5 py-0.5 rounded shrink-0 font-medium"
              style={{
                backgroundColor: p.enabled ? '#10B98120' : 'var(--ap-muted)',
                color: p.enabled ? '#10B981' : 'var(--ap-muted-foreground)',
              }}
            >
              {p.enabled ? '启用' : '禁用'}
            </span>

            {/* 预设来源徽章 */}
            {p.presetKey && (
              <span
                className="text-[10px] px-1.5 py-0.5 rounded shrink-0"
                style={{ backgroundColor: 'var(--ap-secondary)', color: 'var(--ap-secondary-foreground)' }}
              >
                预设
              </span>
            )}
          </div>

          {/* 详情行 — 分行显示 endpoint / model / key */}
          <div className="mt-2 space-y-1 text-[11px]" style={{ color: 'var(--ap-muted-foreground)' }}>
            {p.endpoint && (
              <div className="flex items-start gap-2">
                <span className="shrink-0 opacity-50 w-14">Endpoint</span>
                <span className="font-mono truncate">{p.endpoint}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <span className="shrink-0 opacity-50 w-14">Model</span>
              <span>{p.models.length > 0 ? p.models.join(', ') : '默认'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="shrink-0 opacity-50 w-14">Key</span>
              <span className="font-mono">{maskApiKey(p.apiKey)}</span>
            </div>
          </div>
        </div>

        {/* 右侧操作 — hover 显示 */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button
            onClick={onToggle}
            className="text-xs px-3 py-1.5 rounded hover:bg-(--ap-muted) transition-colors"
            style={{ color: 'var(--ap-muted-foreground)' }}
          >
            {p.enabled ? '禁用' : '启用'}
          </button>
          <button
            onClick={onEdit}
            className="text-xs px-3 py-1.5 rounded hover:bg-(--ap-muted) transition-colors"
            style={{ color: 'var(--ap-primary)' }}
          >
            编辑
          </button>
          <button
            onClick={onRemove}
            className="text-xs px-3 py-1.5 rounded hover:bg-red-500/10 text-red-500 transition-colors"
          >
            删除
          </button>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════
   Provider Preset Selector — CC Switch 风格网格
   ═══════════════════════════════════════════════ */

function ProviderPresetSelector({
  backendId,
  onSelect,
  selectedKey,
}: {
  backendId: BackendId
  onSelect: (preset: ProviderPreset) => void
  selectedKey: string | null
}) {
  const presets = useMemo(() => getPresetsForBackend(backendId), [backendId])

  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<string | null>(null)

  const filtered = useMemo(() => {
    return presets.filter((p) => {
      if (filter && p.category !== filter) return false
      if (query && !p.name.toLowerCase().includes(query.toLowerCase())) return false
      return true
    })
  }, [presets, query, filter])

  const categories = useMemo(
    () => [...new Set(presets.map((p) => p.category).filter(Boolean))] as string[],
    [presets],
  )

  return (
    <div className="space-y-3">
      {/* 搜索 + 过滤栏 */}
      <div className="flex gap-2 flex-wrap">
        <div className="flex-1 min-w-[140px] relative">
          <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索预设..."
            className="w-full pl-7 pr-3 py-2 rounded-sm text-xs border outline-none"
            style={{
              backgroundColor: 'var(--ap-input)',
              borderColor: 'var(--ap-border)',
              color: 'var(--ap-foreground)',
            }}
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setFilter(null)}
            className="px-3 py-1.5 rounded text-xs transition-colors"
            style={{
              backgroundColor: !filter ? 'var(--ap-primary)' : 'var(--ap-muted)',
              color: !filter ? 'var(--ap-primary-foreground)' : 'var(--ap-muted-foreground)',
            }}
          >
            全部
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat === filter ? null : cat)}
              className="px-3 py-1.5 rounded text-xs transition-colors font-medium"
              style={
                filter === cat
                  ? categoryStyle(cat)
                  : { backgroundColor: 'var(--ap-muted)', color: 'var(--ap-muted-foreground)' }
              }
            >
              {CATEGORY_LABELS[cat] ?? cat}
            </button>
          ))}
        </div>
      </div>

      {/* 预设网格 — CC Switch 风格 */}
      <div
        className="grid gap-3 max-h-[320px] overflow-y-auto pr-1"
        style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))' }}
      >
        {filtered.map((preset) => (
          <button
            key={preset.key}
            onClick={() => onSelect(preset)}
            className={[
              'flex flex-col items-center gap-1 p-4 rounded-none border text-center transition-all',
              selectedKey === preset.key
                ? 'border-(--ap-primary) shadow-sm'
                : 'hover:border-(--ap-primary) hover:shadow-sm',
            ].join(' ')}
            style={{
              borderColor: selectedKey === preset.key ? 'var(--ap-primary)' : 'var(--ap-border)',
              backgroundColor: selectedKey === preset.key
                ? 'color-mix(in srgb, var(--ap-primary) 6%, transparent)'
                : 'var(--ap-card)',
            }}
          >
            {/* 图标色块 */}
            <div
              className="w-8 h-8 rounded-sm flex items-center justify-center text-xs font-bold shrink-0"
              style={{
                backgroundColor: preset.iconColor ? `${preset.iconColor}20` : 'var(--ap-muted)',
                color: preset.iconColor ?? 'var(--ap-foreground)',
              }}
            >
              {(preset.name[0] ?? '?').toUpperCase()}
            </div>

            <span className="text-xs font-medium leading-tight line-clamp-2">{preset.name}</span>

            {/* 分类标签 */}
            {preset.category && CATEGORY_LABELS[preset.category] && (
              <span
                className="text-[10px] px-1 py-0.5 rounded"
                style={categoryStyle(preset.category)}
              >
                {CATEGORY_LABELS[preset.category]}
              </span>
            )}

            {/* Partner 标记 */}
            {preset.primePartner && (
              <span className="text-[10px] text-amber-500 font-medium">♥ 置顶</span>
            )}
            {preset.isPartner && !preset.primePartner && (
              <span className="text-[10px] text-amber-500 font-medium">★ 合作</span>
            )}

            {/* 模型数量 */}
            {preset.models.length > 0 && (
              <span
                className="text-[10px]"
                style={{ color: 'var(--ap-muted-foreground)' }}
              >
                {preset.models.length} 模型
              </span>
            )}
          </button>
        ))}

        {filtered.length === 0 && (
          <div
            className="col-span-full text-center py-6 text-xs"
            style={{ color: 'var(--ap-muted-foreground)' }}
          >
            无匹配预设
          </div>
        )}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════
   Preset Add Form (API Key entry)
   ═══════════════════════════════════════════════ */

function PresetAddForm({
  preset,
  apiKey,
  customName,
  onApiKeyChange,
  onNameChange,
  onConfirm,
  onCancel,
}: {
  preset: ProviderPreset
  apiKey: string
  customName: string
  onApiKeyChange: (v: string) => void
  onNameChange: (v: string) => void
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <div
      className="rounded-sm border p-4 space-y-3"
      style={{
        borderColor: 'var(--ap-primary)',
        backgroundColor: 'color-mix(in srgb, var(--ap-primary) 4%, transparent)',
      }}
    >
      {/* 预设信息摘要 */}
      <div className="flex items-center gap-2">
        {preset.iconColor && (
          <span
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{ backgroundColor: preset.iconColor }}
          />
        )}
        <span className="text-sm font-semibold">{preset.name}</span>
        {preset.category && CATEGORY_LABELS[preset.category] && (
          <span className="text-[10px] px-1.5 py-0.5 rounded" style={categoryStyle(preset.category)}>
            {CATEGORY_LABELS[preset.category]}
          </span>
        )}
      </div>

      {preset.models.length > 0 && (
        <div className="text-[10px]" style={{ color: 'var(--ap-muted-foreground)' }}>
          Models: {preset.models.slice(0, 4).join(', ')}
          {preset.models.length > 4 && ` +${preset.models.length - 4}`}
        </div>
      )}
      {preset.endpoint && (
        <div className="text-[10px] truncate" style={{ color: 'var(--ap-muted-foreground)' }}>
          {preset.endpoint}
        </div>
      )}

      {/* 名称 */}
      <SettingRow label="名称">
        <SettingInput
          value={customName}
          onChange={onNameChange}
          placeholder={preset.name}
        />
      </SettingRow>

      {/* API Key */}
      <SettingRow label={
        <>
          API Key
          {preset.apiKeyUrl && (
            <a
              href={preset.apiKeyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-1 underline"
              style={{ color: 'var(--ap-primary)' }}
              onClick={(e) => e.stopPropagation()}
            >
              获取
            </a>
          )}
        </>
      }>
        <SettingInput
          type="password"
          value={apiKey}
          onChange={onApiKeyChange}
          placeholder="输入 API Key ..."
          autoFocus
        />
      </SettingRow>

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <button
          onClick={(e) => { e.stopPropagation(); onConfirm() }}
          disabled={!apiKey.trim()}
          className="flex-1 px-3 py-1.5 rounded text-xs font-medium disabled:opacity-40 transition-opacity"
          style={{ backgroundColor: 'var(--ap-primary)', color: 'var(--ap-primary-foreground)' }}
        >
          确认添加
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onCancel() }}
          className="px-3 py-1.5 rounded text-xs font-medium"
          style={{ backgroundColor: 'var(--ap-muted)', color: 'var(--ap-muted-foreground)' }}
        >
          取消
        </button>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════
   Provider Form — Manual Add / Edit
   ═══════════════════════════════════════════════ */

function ProviderForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: ProviderConfig
  onSave: (p: Omit<ProviderConfig, 'id' | 'createdAt'>) => void
  onCancel: () => void
}) {
  const [backendId, setBackendId] = useState<BackendId>(
    initial?.backendId ?? 'claude',
  )
  const [name, setName] = useState(initial?.name ?? '')
  const [apiKey, setApiKey] = useState(initial?.apiKey ?? '')
  const [endpoint, setEndpoint] = useState(
    initial?.endpoint ?? BACKEND_DEFAULTS.claude.endpoint,
  )
  const [models, setModels] = useState(initial?.models?.join(', ') ?? '')
  const [enabled, setEnabled] = useState(initial?.enabled ?? true)
  const [apiFormat, setApiFormat] = useState<ApiFormat>(
    initial?.meta?.apiFormat ?? 'openai_chat',
  )
  const [headers, setHeaders] = useState(
    initial?.headers ? JSON.stringify(initial.headers, null, 2) : '',
  )
  const [maxTokens, setMaxTokens] = useState(
    initial?.meta?.maxOutputTokens ?? 0,
  )
  const [notes, setNotes] = useState(initial?.notes ?? '')

  const handleBackendChange = (bid: BackendId) => {
    setBackendId(bid)
    const def = BACKEND_DEFAULTS[bid]
    if (!initial || initial.backendId !== bid) {
      setEndpoint(def.endpoint)
      setName((n) => n || def.name)
    }
  }

  const handleSave = () => {
    let parsedHeaders: Record<string, string> | undefined
    if (headers.trim()) {
      try { parsedHeaders = JSON.parse(headers) } catch { /* ignore */ }
    }
    onSave({
      backendId,
      name: name || BACKEND_DEFAULTS[backendId].name,
      apiKey,
      endpoint,
      models: models.split(',').map((m) => m.trim()).filter(Boolean),
      enabled,
      headers: parsedHeaders,
      notes: notes || undefined,
      meta: {
        apiFormat: apiFormat,
        ...(maxTokens > 0 ? { maxOutputTokens: maxTokens } : {}),
        ...(initial?.meta?.costMultiplier ? { costMultiplier: initial.meta.costMultiplier } : {}),
      },
      category: initial?.category,
      websiteUrl: initial?.websiteUrl,
      apiKeyUrl: initial?.apiKeyUrl,
      icon: initial?.icon,
      iconColor: initial?.iconColor,
      isPartner: initial?.isPartner,
      isOfficial: initial?.isOfficial,
      presetKey: initial?.presetKey,
    })
  }

  const handleBackendChangeWrapped = (v: string | number) => {
    handleBackendChange(v as BackendId)
  }

  return (
    <SettingCard className="mb-2 space-y-4" style={{
      borderColor: 'var(--ap-primary)',
      backgroundColor: 'color-mix(in srgb, var(--ap-primary) 3%, transparent)',
    }}>
      {/* Backend selector */}
      <SettingRow label="后端">
        <SettingInput
          type="select"
          value={backendId}
          onChange={handleBackendChangeWrapped}
          options={BACKEND_LIST.map((bid) => ({
            value: bid,
            label: backendLabel(bid),
          }))}
        />
      </SettingRow>

      {/* Name */}
      <SettingRow label="名称">
        <SettingInput
          value={name}
          onChange={setName}
          placeholder={BACKEND_DEFAULTS[backendId].name}
        />
      </SettingRow>

      {/* API Key */}
      <SettingRow label="API Key">
        <SettingInput
          type="password"
          value={apiKey}
          onChange={setApiKey}
          placeholder="sk-..."
        />
      </SettingRow>

      {/* Endpoint */}
      <SettingRow label="Endpoint URL">
        <SettingInput
          value={endpoint}
          onChange={setEndpoint}
        />
      </SettingRow>

      {/* Models */}
      <SettingRow label="模型列表 (逗号分隔)">
        <SettingInput
          value={models}
          onChange={setModels}
          placeholder={BACKEND_DEFAULTS[backendId].models.join(', ')}
        />
      </SettingRow>

      {/* API Format */}
      <SettingRow label="API 格式">
        <SettingInput
          type="select"
          value={apiFormat}
          onChange={(v) => setApiFormat(v as ApiFormat)}
          options={[
            { value: 'openai_chat', label: 'OpenAI Chat Completions' },
            { value: 'anthropic', label: 'Anthropic Messages' },
            { value: 'openai_responses', label: 'OpenAI Responses' },
            { value: 'gemini_native', label: 'Gemini Native' },
          ]}
        />
      </SettingRow>

      {/* Max Output Tokens */}
      <SettingRow label="Max Output Tokens (0=默认)">
        <SettingInput
          type="number"
          value={maxTokens}
          onChange={(v) => setMaxTokens(v as number)}
          className="w-32"
        />
      </SettingRow>

      {/* Custom Headers */}
      <SettingRow label="自定义 Headers (JSON)">
        <SettingInput
          type="textarea"
          value={headers}
          onChange={setHeaders}
          rows={3}
          placeholder='{"X-Custom": "value"}'
        />
      </SettingRow>

      {/* Notes */}
      <SettingRow label="备注">
        <SettingInput
          value={notes}
          onChange={setNotes}
        />
      </SettingRow>

      {/* Enabled toggle */}
      <SettingToggle checked={enabled} onChange={setEnabled} label="启用此 Provider" />

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <button
          onClick={handleSave}
          className="px-4 py-2 rounded-sm text-xs font-medium"
          style={{ backgroundColor: 'var(--ap-primary)', color: 'var(--ap-primary-foreground)' }}
        >
          保存
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2 rounded-sm text-xs font-medium"
          style={{ backgroundColor: 'var(--ap-muted)', color: 'var(--ap-muted-foreground)' }}
        >
          取消
        </button>
      </div>
    </SettingCard>
  )
}
