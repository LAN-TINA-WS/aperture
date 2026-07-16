// ═══════════════════════════════════════════════
// Aperture — Settings Dialog
//
// Hermes 侧边栏导航 + CC Switch 内容区
// 各 Section 组件拆分到独立文件:
//   ProviderSection, McpSection, AgentSection,
//   ProxySection, UsageSection, GeneralSection,
//   AdvancedSection, AboutSection
// ═══════════════════════════════════════════════

import { useEffect, useState } from 'react'
import {
  useSettingsStore,
} from '../../stores/settingsStore'

// ── Section Components ─────────────────────────
import ProviderSection from './ProviderSection'
import McpSection from './McpSection'
import AgentSection from './AgentSection'
import ProxySection from './ProxySection'
import UsageSection from './UsageSection'
import UsageTrendChart from './UsageTrendChart'
import GeneralSection from './GeneralSection'
import AdvancedSection from './AdvancedSection'
import AboutSection from './AboutSection'

/* ═══════════════════════════════════════════════
   Icons (inline SVG — consistent with project conventions)
   ═══════════════════════════════════════════════ */

const Icon = {
  Settings: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  ),
  Server: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
      <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
      <line x1="6" y1="6" x2="6.01" y2="6" />
      <line x1="6" y1="18" x2="6.01" y2="18" />
    </svg>
  ),
  Zap: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  ),
  Globe: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  ),
  BarChart3: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  ),
  TrendingUp: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  ),
  Sliders: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" y1="21" x2="4" y2="14" />
      <line x1="4" y1="10" x2="4" y2="3" />
      <line x1="12" y1="21" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12" y2="3" />
      <line x1="20" y1="21" x2="20" y2="16" />
      <line x1="20" y1="12" x2="20" y2="3" />
      <line x1="1" y1="14" x2="7" y2="14" />
      <line x1="9" y1="8" x2="15" y2="8" />
      <line x1="17" y1="16" x2="23" y2="16" />
    </svg>
  ),
  Wrench: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </svg>
  ),
  Info: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  ),
  X: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  Terminal: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <polyline points="4 17 10 11 4 5" />
      <line x1="12" y1="19" x2="20" y2="19" />
    </svg>
  ),
}

/* ═══════════════════════════════════════════════
   NavLink — Hermes 风格导航项
   ═══════════════════════════════════════════════ */

function NavLink({
  icon: IconComp,
  label,
  active,
  onClick,
}: {
  icon: React.FC
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 w-full px-3 py-2.5 rounded-md text-sm text-left transition-colors ${
        active
          ? 'bg-(--ap-primary)/10 text-(--ap-primary) font-medium'
          : 'text-(--ap-muted-foreground) hover:bg-(--ap-muted) hover:text-(--ap-foreground)'
      }`}
    >
      <span className="size-4 shrink-0 flex items-center justify-center">
        <IconComp />
      </span>
      <span className="truncate">{label}</span>
    </button>
  )
}

/* ═══════════════════════════════════════════════
   SectionHeading — 分区标题 (图标+文字)
   ═══════════════════════════════════════════════ */

function SectionHeading({
  icon: IconComp,
  title,
}: {
  icon: React.FC
  title: string
}) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-(--ap-muted-foreground)">
      <span className="size-3.5 shrink-0 flex items-center justify-center">
        <IconComp />
      </span>
      <span>{title}</span>
    </div>
  )
}

/* ═══════════════════════════════════════════════
   Props
   ═══════════════════════════════════════════════ */

interface Props {
  open: boolean
  onClose: () => void
}

type SectionId = 'providers' | 'mcp' | 'proxy' | 'usage' | 'stats' | 'general' | 'advanced' | 'about' | 'agent'

/* ═══════════════════════════════════════════════
   Main Dialog
   ═══════════════════════════════════════════════ */

export default function SettingsDialog({ open, onClose }: Props) {
  const [section, setSection] = useState<SectionId>('providers')
  const store = useSettingsStore()

  useEffect(() => {
    store.load()
  }, [])

  useEffect(() => {
    if (!open) return
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{
        backgroundColor: 'rgba(0,0,0,0.35)',
        backdropFilter: 'blur(4px)',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="w-[880px] h-[620px] rounded-none overflow-hidden flex shadow-lg"
        style={{
          backgroundColor: 'var(--ap-card)',
          border: '1px solid var(--ap-border)',
        }}
      >
        {/* ═══ 左侧导航 (Hermes NavLink 风格) — 宽 200px ═══ */}
        <nav
          className="w-[200px] shrink-0 flex flex-col border-r py-5 px-3 gap-1"
          style={{
            borderColor: 'var(--ap-border)',
            backgroundColor: 'var(--ap-muted)',
          }}
        >
          <SectionHeading icon={Icon.Settings} title="配置" />
          <NavLink icon={Icon.Server} label="Provider 管理" active={section === 'providers'} onClick={() => setSection('providers')} />
          <NavLink icon={Icon.Zap} label="MCP 服务器" active={section === 'mcp'} onClick={() => setSection('mcp')} />
          <NavLink icon={Icon.Terminal} label="Agent 设置" active={section === 'agent'} onClick={() => setSection('agent')} />
          <NavLink icon={Icon.Globe} label="代理设置" active={section === 'proxy'} onClick={() => setSection('proxy')} />

          <div style={{ borderTop: '1px solid var(--ap-border)', margin: '12px 0' }} />

          <NavLink icon={Icon.BarChart3} label="用量统计" active={section === 'usage'} onClick={() => setSection('usage')} />
          <NavLink icon={Icon.TrendingUp} label="使用统计" active={section === 'stats'} onClick={() => setSection('stats')} />
          <NavLink icon={Icon.Sliders} label="通用" active={section === 'general'} onClick={() => setSection('general')} />
          <NavLink icon={Icon.Wrench} label="高级" active={section === 'advanced'} onClick={() => setSection('advanced')} />

          <div className="mt-auto" />

          <NavLink icon={Icon.Info} label="关于" active={section === 'about'} onClick={() => setSection('about')} />
          <button
            onClick={onClose}
            className="mt-3 flex items-center gap-2 px-3 py-2.5 rounded-md text-sm text-(--ap-muted-foreground) hover:text-(--ap-foreground) transition-colors"
          >
            <span className="size-4 shrink-0 flex items-center justify-center">
              <Icon.X />
            </span>
            关闭
          </button>
        </nav>

        {/* ═══ 右侧内容区 — CC Switch 风格 ═══ */}
        <main className="flex-1 min-w-0 overflow-y-auto px-10 py-8">
          {section === 'providers' && <ProviderSection />}
          {section === 'mcp' && <McpSection />}
          {section === 'proxy' && <ProxySection />}
          {section === 'usage' && <UsageSection />}
          {section === 'stats' && <UsageTrendChart />}
          {section === 'general' && <GeneralSection />}
          {section === 'advanced' && <AdvancedSection />}
          {section === 'about' && <AboutSection />}
          {section === 'agent' && <AgentSection />}
        </main>
      </div>
    </div>
  )
}
