// ═══════════════════════════════════════════════
// Aperture — UsageTrendChart
//
// 用量趋势面积图组件 (recharts)
// 包含: 统计卡片 + 日期选择器 + 面积趋势图
// 从 CC Switch SQLite 读取真实用量数据
// ═══════════════════════════════════════════════

import { useState, useMemo, useEffect } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

/* ═══════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════ */

type DateRange = 'today' | '7d' | '30d' | '90d'

interface TrendDataPoint {
  date: string
  inputTokens: number
  outputTokens: number
  cost: number
  requests: number
}

/* ═══════════════════════════════════════════════
   Helpers
   ═══════════════════════════════════════════════ */

function getDaysForRange(range: DateRange): number {
  switch (range) {
    case 'today': return 1
    case '7d': return 7
    case '30d': return 30
    case '90d': return 90
  }
}

function formatTokens(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`
  return String(value)
}

function formatCost(value: number): string {
  return `$${value.toFixed(4)}`
}

/* ═══════════════════════════════════════════════
   DateRangeSelector
   ═══════════════════════════════════════════════ */

const DATE_RANGE_OPTIONS: { key: DateRange; label: string }[] = [
  { key: 'today', label: '今日' },
  { key: '7d', label: '近7天' },
  { key: '30d', label: '近30天' },
  { key: '90d', label: '近90天' },
]

function DateRangeSelector({
  value,
  onChange,
}: {
  value: DateRange
  onChange: (r: DateRange) => void
}) {
  return (
    <div className="flex items-center gap-1 mb-4">
      {DATE_RANGE_OPTIONS.map((opt) => {
        const active = value === opt.key
        return (
          <button
            key={opt.key}
            onClick={() => onChange(opt.key)}
            className="px-3 py-1 text-xs rounded-sm border transition-colors"
            style={{
              borderColor: active ? 'var(--ap-primary)' : 'var(--ap-border)',
              backgroundColor: active ? 'var(--ap-primary)' : 'transparent',
              color: active ? 'var(--ap-primary-foreground)' : 'var(--ap-foreground)',
            }}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

/* ═══════════════════════════════════════════════
   StatsCards
   ═══════════════════════════════════════════════ */

interface StatsCardsProps {
  data: TrendDataPoint[]
  hasRealData: boolean
}

function StatsCards({ data, hasRealData }: StatsCardsProps) {
  const stats = useMemo(() => {
    if (!hasRealData || data.length === 0) {
      return null
    }
    const totalInput = data.reduce((sum, d) => sum + d.inputTokens, 0)
    const totalOutput = data.reduce((sum, d) => sum + d.outputTokens, 0)
    const totalCost = data.reduce((sum, d) => sum + d.cost, 0)
    const requestCount = data.reduce((sum, d) => sum + d.requests, 0)

    return {
      totalTokens: totalInput + totalOutput,
      requestCount,
      totalCost,
    }
  }, [data, hasRealData])

  const cards = [
    {
      icon: '\u{1F4CA}', // 📊
      label: 'Token 总数',
      value: stats ? formatTokens(stats.totalTokens) : '—',
      hint: '输入+输出',
    },
    {
      icon: '\u{1F4E1}', // 📡
      label: '请求次数',
      value: stats ? stats.requestCount.toLocaleString() : '—',
      hint: '',
    },
    {
      icon: '\u{1F4B0}', // 💰
      label: '花费',
      value: stats ? formatCost(stats.totalCost) : '—',
      hint: '估算成本',
    },
    {
      icon: '\u{1F517}', // 🔗
      label: 'Provider 数',
      value: hasRealData ? '—' : '—',
      hint: '活跃 provider',
    },
  ]

  return (
    <div className="grid grid-cols-4 gap-3 mb-4">
      {cards.map((c) => (
        <div
          key={c.label}
          className="rounded-sm border p-3 text-center"
          style={{
            borderColor: 'var(--ap-border)',
            backgroundColor: 'var(--ap-card)',
          }}
        >
          <div className="text-lg mb-1">{c.icon}</div>
          <div
            className="text-xl font-bold"
            style={{ color: 'var(--ap-foreground)' }}
          >
            {c.value}
          </div>
          <div
            className="text-xs mt-1"
            style={{ color: 'var(--ap-muted-foreground)' }}
          >
            {c.label}
          </div>
          {c.hint && (
            <div
              className="text-[10px] mt-0.5"
              style={{ color: 'var(--ap-muted-foreground)', opacity: 0.6 }}
            >
              {c.hint}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

/* ═══════════════════════════════════════════════
   Custom Tooltip
   ═══════════════════════════════════════════════ */

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{
    name: string
    value: number
    color: string
  }>
  label?: string
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null

  return (
    <div
      className="rounded-sm border px-3 py-2 text-xs"
      style={{
        backgroundColor: 'var(--ap-card)',
        borderColor: 'var(--ap-border)',
        color: 'var(--ap-foreground)',
      }}
    >
      <div className="font-medium mb-1" style={{ color: 'var(--ap-foreground)' }}>
        {label}
      </div>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2" style={{ color: entry.color }}>
          <span
            className="inline-block w-2 h-2 rounded-full shrink-0"
            style={{ backgroundColor: entry.color }}
          />
          <span style={{ color: 'var(--ap-muted-foreground)' }}>
            {entry.name === 'inputTokens'
              ? '输入 Token'
              : entry.name === 'outputTokens'
                ? '输出 Token'
                : '成本'}
            :
          </span>
          <span className="font-mono font-medium" style={{ color: 'var(--ap-foreground)' }}>
            {entry.name === 'cost' ? formatCost(entry.value) : formatTokens(entry.value)}
          </span>
        </div>
      ))}
    </div>
  )
}

/* ═══════════════════════════════════════════════
   TrendChart
   ═══════════════════════════════════════════════ */

const CHART_COLORS = {
  inputTokens: '#3b82f6', // 蓝
  outputTokens: '#22c55e', // 绿
  cost: '#f43f5e', // 红
}

function TrendChart({ data }: { data: TrendDataPoint[] }) {
  const showDots = data.length <= 31

  return (
    <div
      className="rounded-sm border p-4"
      style={{
        borderColor: 'var(--ap-border)',
        backgroundColor: 'var(--ap-card)',
      }}
    >
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
          >
            <defs>
              <linearGradient id="inputTokensGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={CHART_COLORS.inputTokens} stopOpacity={0.15} />
                <stop offset="95%" stopColor={CHART_COLORS.inputTokens} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="outputTokensGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={CHART_COLORS.outputTokens} stopOpacity={0.15} />
                <stop offset="95%" stopColor={CHART_COLORS.outputTokens} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="costGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={CHART_COLORS.cost} stopOpacity={0.1} />
                <stop offset="95%" stopColor={CHART_COLORS.cost} stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--ap-border)"
              opacity={0.5}
              vertical={false}
            />

            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: 'var(--ap-muted-foreground)' }}
              tickLine={false}
              axisLine={{ stroke: 'var(--ap-border)' }}
              interval={data.length > 31 ? 'preserveStartEnd' : 0}
            />

            <YAxis
              yAxisId="tokens"
              tick={{ fontSize: 11, fill: 'var(--ap-muted-foreground)' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={formatTokens}
              orientation="left"
            />

            <YAxis
              yAxisId="cost"
              tick={{ fontSize: 11, fill: 'var(--ap-muted-foreground)' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) => `$${v.toFixed(2)}`}
              orientation="right"
            />

            <Tooltip content={<CustomTooltip />} />

            {/* 输入 Token — 蓝色实线 */}
            <Area
              yAxisId="tokens"
              type="monotone"
              dataKey="inputTokens"
              name="inputTokens"
              stroke={CHART_COLORS.inputTokens}
              fill="url(#inputTokensGrad)"
              strokeWidth={1.5}
              dot={showDots ? { r: 2, fill: CHART_COLORS.inputTokens, strokeWidth: 0 } : false}
              activeDot={{ r: 4, fill: CHART_COLORS.inputTokens, strokeWidth: 0 }}
            />

            {/* 输出 Token — 绿色实线 */}
            <Area
              yAxisId="tokens"
              type="monotone"
              dataKey="outputTokens"
              name="outputTokens"
              stroke={CHART_COLORS.outputTokens}
              fill="url(#outputTokensGrad)"
              strokeWidth={1.5}
              dot={showDots ? { r: 2, fill: CHART_COLORS.outputTokens, strokeWidth: 0 } : false}
              activeDot={{ r: 4, fill: CHART_COLORS.outputTokens, strokeWidth: 0 }}
            />

            {/* 成本 — 红色虚线（右轴） */}
            <Area
              yAxisId="cost"
              type="monotone"
              dataKey="cost"
              name="cost"
              stroke={CHART_COLORS.cost}
              fill="url(#costGrad)"
              strokeWidth={1.5}
              strokeDasharray="6 3"
              dot={showDots ? { r: 2, fill: CHART_COLORS.cost, strokeWidth: 0 } : false}
              activeDot={{ r: 4, fill: CHART_COLORS.cost, strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* 图例 */}
      <div className="flex items-center justify-center gap-6 mt-2 pt-2 border-t" style={{ borderColor: 'var(--ap-border)' }}>
        {[
          { label: '输入 Token', color: CHART_COLORS.inputTokens },
          { label: '输出 Token', color: CHART_COLORS.outputTokens },
          { label: '成本', color: CHART_COLORS.cost, dashed: true },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-1.5">
            <div
              className="w-3 h-0.5"
              style={{
                backgroundColor: item.color,
                ...(item.dashed
                  ? { background: 'none', borderTop: `1.5px dashed ${item.color}` }
                  : {}),
              }}
            />
            <span className="text-[11px]" style={{ color: 'var(--ap-muted-foreground)' }}>
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════
   Empty State
   ═══════════════════════════════════════════════ */

function EmptyState() {
  return (
    <div className="text-center py-16" style={{ color: 'var(--ap-muted-foreground)' }}>
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" opacity={0.3}>
        <path d="M3 3v18h18" /><path d="M7 16l4-8 4 4 4-6" />
      </svg>
      <p className="mt-4 text-sm font-medium">暂无使用数据</p>
      <p className="mt-1 text-xs">用量数据将在您通过 Aperture 使用 AI Agent 后自动记录</p>
      <p className="mt-3 text-xs" style={{ color: 'var(--ap-muted-foreground)', opacity: 0.6 }}>
        提示：如需导入历史数据，请先从 CC Switch 同步用量数据库
      </p>
    </div>
  )
}

/* ═══════════════════════════════════════════════
   UsageTrendChart — 主组件
   ═══════════════════════════════════════════════ */

export default function UsageTrendChart() {
  const [dateRange, setDateRange] = useState<DateRange>('30d')
  const [rawData, setRawData] = useState<Array<{
    date: string; input_tokens: number; output_tokens: number
    request_count: number; total_cost_usd: string
  }>>([])
  const [loading, setLoading] = useState(true)
  const [hasRealData, setHasRealData] = useState(false)

  // 从 CC Switch 读取真实用量数据
  useEffect(() => {
    const load = async () => {
      try {
        const days = getDaysForRange('90d') // 加载 90 天数据，前端按 dateRange 筛选
        const usage = await window.api.ccswitch.readUsage(days)
        if (usage && usage.length > 0) {
          setRawData(usage)
          setHasRealData(true)
        }
      } catch {
        // 读取失败（CC Switch 未安装或 DB 不存在），静默处理
      }
      setLoading(false)
    }
    load()
  }, [])

  // 将原始数据转换为图表数据 + 按 dateRange 筛选
  const data: TrendDataPoint[] = useMemo(() => {
    if (!hasRealData || rawData.length === 0) return []

    const rangeDays = getDaysForRange(dateRange)
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - rangeDays)
    cutoff.setHours(0, 0, 0, 0)

    return rawData
      .filter((r) => {
        const d = new Date(r.date + 'T00:00:00')
        return d >= cutoff
      })
      .map((r) => ({
        date: new Date(r.date + 'T00:00:00').toLocaleDateString('zh-CN', {
          month: '2-digit',
          day: '2-digit',
        }),
        inputTokens: r.input_tokens,
        outputTokens: r.output_tokens,
        cost: parseFloat(r.total_cost_usd || '0'),
        requests: r.request_count,
      }))
  }, [rawData, dateRange, hasRealData])

  if (loading) {
    return null // 或放一个简单的加载占位，避免闪烁
  }

  return (
    <div className="space-y-0">
      <StatsCards data={data} hasRealData={hasRealData} />
      <DateRangeSelector value={dateRange} onChange={setDateRange} />

      {hasRealData && data.length > 0 ? (
        <TrendChart data={data} />
      ) : (
        <EmptyState />
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════
   Named exports for granular usage
   ═══════════════════════════════════════════════ */

export { formatTokens, formatCost }
