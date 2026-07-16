// ═══════════════════════════════════════════════
// Aperture — DetailPanel (右侧详情面板)
// ═══════════════════════════════════════════════

interface Props {
  onClose: () => void
}

export default function DetailPanel({ onClose }: Props) {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b"
        style={{ borderColor: 'var(--ap-border)' }}
      >
        <span className="text-sm font-medium" style={{ color: 'var(--ap-foreground)' }}>
          详情
        </span>
        <button onClick={onClose} className="p-1 rounded hover:opacity-70" title="关闭详情">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M10 4L4 10M4 4l6 6" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </button>
      </div>

      {/* Empty state */}
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center" style={{ color: 'var(--ap-muted-foreground)' }}>
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" className="mx-auto mb-3 opacity-40">
            <rect x="6" y="4" width="20" height="24" rx="2" stroke="currentColor" strokeWidth="1.5" />
            <path d="M10 10h12M10 14h12M10 18h8" stroke="currentColor" strokeWidth="1.2" />
          </svg>
          <p className="text-xs">选择文件以预览</p>
          <p className="text-[11px] mt-1 opacity-60">文件浏览器 (coming soon)</p>
        </div>
      </div>
    </div>
  )
}
