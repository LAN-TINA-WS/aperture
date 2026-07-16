// ═══════════════════════════════════════════════
// Aperture — MCP Tab: MCP server management
// ═══════════════════════════════════════════════

import { useState } from 'react'
import {
  useSettingsStore,
  type BackendId,
  type McpServer,
  type McpTransportType,
  type McpApps,
  BACKEND_DEFAULTS,
  BACKEND_LIST,
} from '../../stores/settingsStore'
import { SectionHeader } from './primitives'

/* ═══════════════════════════════════════════════
   McpTab
   ═══════════════════════════════════════════════ */
export function McpTab() {
  const {
    mcpServers,
    addMcpServer,
    updateMcpServer,
    removeMcpServer,
    toggleMcpApp,
  } = useSettingsStore()
  const [adding, setAdding] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)

  return (
    <div className="space-y-4">
      <SectionHeader
        title="MCP 服务器"
        subtitle="管理 MCP (Model Context Protocol) 服务器连接"
        actions={
          <button
            onClick={() => setAdding(true)}
            className="px-3 py-2 rounded-sm text-xs font-medium transition-colors"
            style={{
              backgroundColor: 'var(--ap-primary)',
              color: 'var(--ap-primary-foreground)',
            }}
          >
            + 添加 MCP 服务器
          </button>
        }
      />

      {/* Add form */}
      {adding && (
        <McpServerForm
          onSave={(s) => {
            addMcpServer(s)
            setAdding(false)
          }}
          onCancel={() => setAdding(false)}
        />
      )}

      {/* Server list */}
      {mcpServers.length === 0 && !adding ? (
        <div
          className="text-xs py-4 px-4 rounded-sm border border-dashed text-center"
          style={{ color: 'var(--ap-muted-foreground)', borderColor: 'var(--ap-border)' }}
        >
          暂无 MCP 服务器 —
          <button
            onClick={() => setAdding(true)}
            className="underline ml-1"
            style={{ color: 'var(--ap-primary)' }}
          >
            添加
          </button>
        </div>
      ) : (
        mcpServers.map((s) =>
          editing === s.id ? (
            <McpServerForm
              key={s.id}
              initial={s}
              onSave={(patch) => {
                updateMcpServer(s.id, patch)
                setEditing(null)
              }}
              onCancel={() => setEditing(null)}
            />
          ) : (
            <McpServerCard
              key={s.id}
              server={s}
              onEdit={() => setEditing(s.id)}
              onRemove={() => {
                if (window.confirm(`确定删除MCP服务器 "${s.name}"？`)) {
                  removeMcpServer(s.id)
                }
              }}
              onToggleApp={(app, enabled) => toggleMcpApp(s.id, app, enabled)}
            />
          ),
        )
      )}
    </div>
  )
}

/* ─── MCP Server Card ───────────────────────── */
function McpServerCard({
  server,
  onEdit,
  onRemove,
  onToggleApp,
}: {
  server: McpServer
  onEdit: () => void
  onRemove: () => void
  onToggleApp: (app: keyof McpApps, enabled: boolean) => void
}) {
  const typeLabel =
    server.server.type === 'http' ? 'HTTP' :
    server.server.type === 'sse' ? 'SSE' :
    'stdio'

  return (
    <div
      className="rounded-sm border p-4 mb-3"
      style={{ borderColor: 'var(--ap-border)' }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="min-w-0">
          <span className="text-sm font-medium">{server.name}</span>
          <span
            className="ml-2 text-[10px] px-1.5 py-0.5 rounded"
            style={{
              backgroundColor: 'var(--ap-muted)',
              color: 'var(--ap-muted-foreground)',
            }}
          >
            {typeLabel}
          </span>
          {server.enabled === false && (
            <span
              className="ml-1 text-[10px] px-1.5 py-0.5 rounded"
              style={{
                backgroundColor: 'var(--ap-muted)',
                color: 'var(--ap-muted-foreground)',
                opacity: 0.6,
              }}
            >
              禁用
            </span>
          )}
        </div>
        <div className="flex gap-2 shrink-0">
          <button onClick={onEdit} className="text-xs hover:opacity-70" style={{ color: 'var(--ap-primary)' }}>
            编辑
          </button>
          <button onClick={onRemove} className="text-xs hover:opacity-70" style={{ color: 'var(--ap-destructive)' }}>
            删除
          </button>
        </div>
      </div>

      {/* Transport details */}
      <div className="text-xs mb-2 space-y-0.5" style={{ color: 'var(--ap-muted-foreground)' }}>
        {server.server.command && (
          <div className="font-mono">{server.server.command} {server.server.args?.join(' ') ?? ''}</div>
        )}
        {server.server.url && (
          <div className="font-mono">{server.server.url}</div>
        )}
        {server.description && (
          <div>{server.description}</div>
        )}
      </div>

      {/* App toggle matrix */}
      <div className="pt-2 border-t" style={{ borderColor: 'var(--ap-border)' }}>
        <label className="text-[10px] font-medium block mb-1" style={{ color: 'var(--ap-muted-foreground)' }}>
          启用此服务器的 Agent 后端:
        </label>
        <div className="flex flex-wrap gap-2">
          {BACKEND_LIST.map((bid) => {
            const checked = server.apps?.[bid] ?? true
            return (
              <label
                key={bid}
                className="flex items-center gap-1 text-xs cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => onToggleApp(bid, e.target.checked)}
                />
                {BACKEND_DEFAULTS[bid].name}
              </label>
            )
          })}
        </div>
      </div>
    </div>
  )
}

/* ─── MCP Server Form (Add / Edit) ──────────── */
function McpServerForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: McpServer
  onSave: (s: any) => void
  onCancel: () => void
}) {
  const [transportType, setTransportType] = useState<McpTransportType>(initial?.server.type ?? 'stdio')
  const [name, setName] = useState(initial?.name ?? '')
  const [command, setCommand] = useState(initial?.server.command ?? '')
  const [args, setArgs] = useState(initial?.server.args?.join(' ') ?? '')
  const [cwd, setCwd] = useState(initial?.server.cwd ?? '')
  const [url, setUrl] = useState(initial?.server.url ?? '')
  const [headers, setHeaders] = useState(initial?.server.headers ? JSON.stringify(initial.server.headers, null, 2) : '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [enabled, setEnabled] = useState(initial?.enabled ?? true)

  const handleSave = () => {
    let parsedHeaders: Record<string, string> | undefined
    if (headers.trim()) {
      try { parsedHeaders = JSON.parse(headers) } catch { /* ignore */ }
    }

    const serverSpec: any = { type: transportType }
    if (transportType === 'stdio') {
      serverSpec.command = command || undefined
      serverSpec.args = args ? args.split(' ').filter(Boolean) : undefined
      serverSpec.cwd = cwd || undefined
    } else {
      serverSpec.url = url || undefined
      serverSpec.headers = parsedHeaders || undefined
    }

    onSave({
      name: name || 'Unnamed MCP Server',
      server: serverSpec,
      enabled,
      description: description || undefined,
      apps: initial?.apps,
      tags: initial?.tags,
      homepage: initial?.homepage,
      docs: initial?.docs,
    })
  }

  return (
    <div
      className="rounded-sm border p-4 mb-3 space-y-3"
      style={{
        borderColor: 'var(--ap-primary)',
        backgroundColor: 'color-mix(in srgb, var(--ap-primary) 3%, transparent)',
      }}
    >
      {/* Transport type */}
      <div>
        <label className="text-xs font-medium block mb-1">传输协议</label>
        <select
          value={transportType}
          onChange={(e) => setTransportType(e.target.value as McpTransportType)}
          className="w-full px-3 py-2 rounded-sm text-sm border outline-none"
          style={{
            backgroundColor: 'var(--ap-input)',
            color: 'var(--ap-foreground)',
            borderColor: 'var(--ap-border)',
          }}
        >
          <option value="stdio">stdio (子进程)</option>
          <option value="http">HTTP (远程服务器)</option>
          <option value="sse">SSE (流式传输)</option>
        </select>
      </div>

      {/* Name */}
      <div>
        <label className="text-xs font-medium block mb-1">名称</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="My MCP Server"
          className="w-full px-3 py-2 rounded-sm text-sm border outline-none"
          style={{
            backgroundColor: 'var(--ap-input)',
            color: 'var(--ap-foreground)',
            borderColor: 'var(--ap-border)',
          }}
        />
      </div>

      {/* stdio-specific fields */}
      {transportType === 'stdio' && (
        <>
          <div>
            <label className="text-xs font-medium block mb-1">命令</label>
            <input
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              placeholder="npx -y @modelcontextprotocol/server-filesystem"
              className="w-full px-3 py-2 rounded-sm text-sm border outline-none font-mono"
              style={{
                backgroundColor: 'var(--ap-input)',
                color: 'var(--ap-foreground)',
                borderColor: 'var(--ap-border)',
              }}
            />
          </div>

          <div>
            <label className="text-xs font-medium block mb-1">参数 (空格分隔)</label>
            <input
              value={args}
              onChange={(e) => setArgs(e.target.value)}
              placeholder="/path/to/allowed/dir"
              className="w-full px-3 py-2 rounded-sm text-sm border outline-none font-mono"
              style={{
                backgroundColor: 'var(--ap-input)',
                color: 'var(--ap-foreground)',
                borderColor: 'var(--ap-border)',
              }}
            />
          </div>

          <div>
            <label className="text-xs font-medium block mb-1">工作目录 (可选)</label>
            <input
              value={cwd}
              onChange={(e) => setCwd(e.target.value)}
              placeholder="/path/to/project"
              className="w-full px-3 py-2 rounded-sm text-sm border outline-none font-mono"
              style={{
                backgroundColor: 'var(--ap-input)',
                color: 'var(--ap-foreground)',
                borderColor: 'var(--ap-border)',
              }}
            />
          </div>
        </>
      )}

      {/* HTTP/SSE-specific fields */}
      {(transportType === 'http' || transportType === 'sse') && (
        <>
          <div>
            <label className="text-xs font-medium block mb-1">URL</label>
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="http://localhost:3001/mcp"
              className="w-full px-3 py-2 rounded-sm text-sm border outline-none font-mono"
              style={{
                backgroundColor: 'var(--ap-input)',
                color: 'var(--ap-foreground)',
                borderColor: 'var(--ap-border)',
              }}
            />
          </div>

          <div>
            <label className="text-xs font-medium block mb-1">自定义 Headers (JSON)</label>
            <textarea
              value={headers}
              onChange={(e) => setHeaders(e.target.value)}
              rows={2}
              placeholder='{"Authorization": "Bearer xxx"}'
              className="w-full px-3 py-2 rounded-sm text-xs border outline-none font-mono"
              style={{
                backgroundColor: 'var(--ap-input)',
                color: 'var(--ap-foreground)',
                borderColor: 'var(--ap-border)',
              }}
            />
          </div>
        </>
      )}

      {/* Description */}
      <div>
        <label className="text-xs font-medium block mb-1">描述 (可选)</label>
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="此服务器的用途说明"
          className="w-full px-3 py-2 rounded-sm text-sm border outline-none"
          style={{
            backgroundColor: 'var(--ap-input)',
            color: 'var(--ap-foreground)',
            borderColor: 'var(--ap-border)',
          }}
        />
      </div>

      {/* Enabled toggle */}
      <label className="flex items-center gap-2 text-xs cursor-pointer">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => setEnabled(e.target.checked)}
        />
        启用此 MCP 服务器
      </label>

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
          style={{
            backgroundColor: 'var(--ap-muted)',
            color: 'var(--ap-muted-foreground)',
          }}
        >
          取消
        </button>
      </div>
    </div>
  )
}
