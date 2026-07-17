// ═══════════════════════════════════════════════
// Aperture — About Section
// ═══════════════════════════════════════════════

import GlassCard from './GlassCard'
import { SectionHeader } from './primitives'

export default function AboutSection() {
  return (
    <div className="space-y-4">
      {/* ── Section Header ── */}
      <SectionHeader title="关于 Aperture" />

      <GlassCard>
        <div className="flex items-center gap-3 mb-4">
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
            <circle cx="20" cy="20" r="16" stroke="currentColor" strokeWidth="1.5" opacity="0.3" />
            <circle cx="20" cy="20" r="8" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
            <circle cx="20" cy="20" r="3" fill="currentColor" />
          </svg>
          <div>
            <h3 className="text-base font-semibold">Aperture</h3>
            <p className="text-xs" style={{ color: 'var(--ap-muted-foreground)' }}>
              v0.1.1 — Universal AI Agent Desktop Shell
            </p>
          </div>
        </div>

        <div className="space-y-3 text-sm">
          <p>
            <strong>技术栈:</strong> Electron 35 + React 19 + TypeScript + Tailwind CSS 4
          </p>
          <p>
            <strong>CC Switch 集成:</strong> Provider 管理 · API Key 配置 · 代理设置 · 用量追踪
          </p>
          <p>
            <strong>支持后端:</strong> Claude Code · Codex CLI · Gemini CLI · Hermes Agent · OpenCode · OpenClaw
          </p>
          <p>
            <strong>MCP 服务器:</strong> 支持 stdio / HTTP / SSE 传输协议
          </p>
        </div>
      </GlassCard>

      <div className="pt-3 text-xs" style={{ color: 'var(--ap-muted-foreground)' }}>
        <p>Apache-2.0 License</p>
        <p className="mt-1">Built with Hermes Desktop UI design language</p>
      </div>
    </div>
  )
}
