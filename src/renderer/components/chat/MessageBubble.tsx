// ═══════════════════════════════════════════════
// Aperture — MessageBubble (1:1 Hermes Desktop)
//
// User:  standalone-glass card, 2-line clamp + fade
//        expand on click, text-foreground/95
// Assistant: full-width, no card
//        thinking → DisclosureRow (caret RIGHT)
//        text → react-markdown (Hermes heading scale)
//        tools → tool-chip (Hermes opacity fade)
// ═══════════════════════════════════════════════

import { useState, memo, useCallback, useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { StreamMessage } from '../../stores/chatStore'

/* ═══════════════════════════════════════════════
   User message — 1:1 Hermes sticky-human-bubble
   standalone-glass, 2-line clamp, fade mask
   ═══════════════════════════════════════════════ */

const UserMsg = memo(function UserMsg({ msg }: Props) {
  const [expanded, setExpanded] = useState(false)
  const [copied, setCopied] = useState(false)
  const content = msg.content
  const lines = content.split('\n')
  const isLong = lines.length > 4 || content.length > 300
  const clampActive = !expanded && isLong

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(content).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }, [content])

  return (
    <div className="relative w-full py-[var(--conv-turn-gap)] group/user">
      {/* Copy button — visible on group hover (Hermes action bar pattern) */}
      <div className="absolute -top-0.5 right-0 z-10 opacity-0 group-hover/user:opacity-100 transition-opacity">
        <button
          onClick={handleCopy}
          className="px-1.5 py-0.5 rounded text-[10px]"
          style={{
            backgroundColor: 'var(--ap-muted)',
            color: 'var(--ap-muted-foreground)',
          }}
        >
          {copied ? '已复制' : '复制'}
        </button>
      </div>

      {/* Bubble — standalone-glass matching Hermes USER_BUBBLE_BASE_CLASS */}
      <button
        type="button"
        className="standalone-glass relative flex w-full min-w-0 max-w-full flex-col gap-1.5 overflow-y-auto rounded px-3 py-2 text-left select-text"
        style={{
          fontSize: 'var(--conv-text-size)',
          lineHeight: 'var(--human-msg-line-height)',
          color: 'color-mix(in srgb, var(--ap-foreground) 95%, transparent)',
          borderColor: 'var(--ap-user-bubble-border)',
          cursor: isLong ? 'pointer' : 'default',
        }}
        onClick={() => isLong && setExpanded(!expanded)}
        title={isLong ? (expanded ? '收起' : '展开全部') : undefined}
      >
        {/* Clamped content with bottom fade */}
        <div className={clampActive ? 'user-msg-clamp' : undefined}>
          <span className="whitespace-pre-wrap break-words block">{content}</span>
        </div>

        {/* Expand/collapse hint */}
        {isLong && (
          <span
            className="block text-[11px] opacity-50 hover:opacity-80 transition-opacity"
            style={{ color: 'var(--ap-muted-foreground)' }}
          >
            {expanded ? '收起' : '展开全部'}
          </span>
        )}
      </button>
    </div>
  )
})

/* ═══════════════════════════════════════════════
   Thinking block — 1:1 Hermes DisclosureRow
   Caret on RIGHT of title, body with left border
   ═══════════════════════════════════════════════ */

function ThinkingBlock({ text, streaming }: { text: string; streaming: boolean }) {
  const [open, setOpen] = useState(streaming)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom while streaming
  useEffect(() => {
    if (streaming && open && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [text, streaming, open])

  return (
    <div className="thinking-disclosure" style={{ fontSize: 'var(--conv-tool-size)' }}>
      {/* Header — Hermes DisclosureRow pattern: title + caret RIGHT */}
      <div
        className="thinking-disclosure-header"
        onClick={() => setOpen(!open)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && setOpen(!open)}
      >
        {/* Title with shimmer while streaming */}
        <span className={streaming ? 'shimmer-text' : ''}>
          思考中{streaming ? '…' : ''}
        </span>

        {/* Caret — rotates on open, hidden until hover (Hermes pattern) */}
        <svg
          width="10"
          height="10"
          viewBox="0 0 10 10"
          fill="currentColor"
          className="shrink-0 transition-transform duration-150"
          style={{
            transform: open ? 'rotate(90deg)' : 'rotate(0deg)',
            opacity: open ? 0.8 : undefined,
          }}
        >
          <path d="M3 1l4 4-4 4" />
        </svg>
      </div>

      {/* Body — left border + fade during live preview */}
      {open && (
        <div
          ref={scrollRef}
          className={streaming ? 'thinking-preview' : ''}
          style={{ marginTop: '0.25rem' }}
        >
          <div className="thinking-disclosure-body">
            {text}
          </div>
        </div>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════
   Code block card — 1:1 Hermes code-card
   Header (lang + copy) + body (highlighted code)
   ═══════════════════════════════════════════════ */

function CodeBlockCard({
  lang,
  code,
  copied,
  setCopied,
  ...props
}: {
  lang: string
  code: string
  copied: boolean
  setCopied: (v: boolean) => void
  [key: string]: unknown
}) {
  const codeRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (codeRef.current) {
      try {
        const hljs = (window as any).hljs
        if (hljs) {
          codeRef.current.removeAttribute('data-highlighted')
          hljs.highlightElement(codeRef.current)
        }
      } catch {
        /* hljs not loaded yet — harmless */
      }
    }
  }, [code])

  return (
    <div className="code-card">
      {/* Header — language label left, copy button right */}
      <div className="code-card-header">
        <span className="font-medium">{lang}</span>
        <button
          onClick={() => {
            navigator.clipboard.writeText(code)
            setCopied(true)
            setTimeout(() => setCopied(false), 1500)
          }}
          className="hover:opacity-70 transition-opacity"
        >
          {copied ? '已复制' : '复制'}
        </button>
      </div>

      {/* Body — monospace code */}
      <div className="code-card-body">
        <pre>
          <code
            ref={codeRef}
            className={lang ? `language-${lang}` : ''}
            {...props}
          >
            {code}
          </code>
        </pre>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════
   Assistant message — 1:1 Hermes AssistantMessage
   No card, conversation font sizing, paragraph gap
   ═══════════════════════════════════════════════ */

const AssistantMsg = memo(function AssistantMsg({ msg }: Props) {
  const streaming = msg.status === 'streaming'
  const hasContent = msg.content.length > 0
  const hasThinking = Boolean(msg.thinking)

  return (
    <div
      className="w-full py-[var(--conv-turn-gap)]"
      style={{ paddingLeft: 'var(--msg-text-indent)' }}
    >
      <div
        className="flex flex-col"
        style={{
          fontSize: 'var(--conv-text-size)',
          lineHeight: 'var(--conv-line-height)',
          color: 'var(--ap-foreground)',
          gap: 'var(--turn-block-gap)',
        }}
      >
        {/* Thinking — Hermes DisclosureRow pattern */}
        {hasThinking && (
          <ThinkingBlock text={msg.thinking!} streaming={streaming} />
        )}

        {/* Tool calls — Hermes tool-chip pattern */}
        {msg.toolCalls && msg.toolCalls.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--tool-row-gap)' }}>
            {msg.toolCalls.map((tc) => (
              <div key={tc.id} className="tool-chip">
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 12 12"
                  fill="currentColor"
                  className="shrink-0"
                >
                  <path d="M2 2h3l1 3-1 3H2l-1-3zM7 2h3l1 3-1 3H7l-1-3z" />
                </svg>
                <span className="font-medium">{tc.name}</span>
              </div>
            ))}
          </div>
        )}

        {/* Content — react-markdown with Hermes heading scale */}
        {hasContent && (
          <div className="wrap-anywhere">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={MarkdownComponents}>
              {msg.content}
            </ReactMarkdown>

            {/* Streaming cursor — Hermes block cursor */}
            {streaming && <span className="stream-cursor" />}
          </div>
        )}

        {/* Loading state — three dots (Hermes dither pattern) */}
        {streaming && !hasContent && !hasThinking && (
          <div className="loading-dots">
            <span className="loading-dot" />
            <span className="loading-dot" />
            <span className="loading-dot" />
          </div>
        )}

        {/* Interrupted indicator */}
        {msg.status === 'interrupted' && (
          <div
            className="flex items-center gap-1.5 text-xs italic"
            style={{ color: 'var(--ap-muted-foreground)', opacity: 0.7 }}
          >
            <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
              <rect x="3" y="3" width="10" height="10" rx="1" />
            </svg>
            已中断
          </div>
        )}
      </div>
    </div>
  )
})

/* ═══════════════════════════════════════════════
   Markdown components — 1:1 Hermes heading scale
   ═══════════════════════════════════════════════ */

const MarkdownComponents = {
  // ─── Code blocks (fenced) ──────────────────
  code({ className, children, ...props }: any) {
    // Inline code
    if (!className) {
      return (
        <code
          className="px-[0.1875rem] py-px rounded-[0.25rem] font-mono text-[0.9em] font-normal"
          style={{
            backgroundColor: 'color-mix(in srgb, var(--ap-primary) 8%, transparent)',
          }}
          {...props}
        >
          {children}
        </code>
      )
    }
    // Fenced code → code-card
    const lang = className.replace('language-', '') || 'text'
    const [copied, setCopied] = useState(false)
    const code = String(children).replace(/\n$/, '')
    return (
      <CodeBlockCard lang={lang} code={code} copied={copied} setCopied={setCopied} {...props} />
    )
  },

  pre: ({ children }: any) => <>{children}</>,

  // ─── Headings — Hermes chat scale ──────────
  h1: ({ children, ...props }: any) => (
    <h1 className="my-1 font-semibold text-[1rem] tracking-tight" {...props}>
      {children}
    </h1>
  ),
  h2: ({ children, ...props }: any) => (
    <h2 className="my-1 font-semibold text-[0.9375rem] tracking-tight" {...props}>
      {children}
    </h2>
  ),
  h3: ({ children, ...props }: any) => (
    <h3 className="my-1 font-semibold text-[0.875rem]" {...props}>
      {children}
    </h3>
  ),
  h4: ({ children, ...props }: any) => (
    <h4 className="my-1 font-semibold text-[0.8125rem]" {...props}>
      {children}
    </h4>
  ),

  // ─── Paragraph — Hermes paragraph-gap ──────
  p: ({ children }: any) => (
    <p className="wrap-anywhere" style={{ marginBlock: 'var(--conv-para-gap) 0' }}>
      {children}
    </p>
  ),

  // ─── Links ────────────────────────────────
  a: ({ href, children }: any) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="break-all underline underline-offset-4 font-semibold"
      style={{
        color: 'var(--ap-foreground)',
        textDecorationColor: 'color-mix(in srgb, currentColor 20%, transparent)',
      }}
    >
      {children}
    </a>
  ),

  // ─── Blockquote — border-left ─────────────
  blockquote: ({ children }: any) => (
    <blockquote
      className="border-s-2 ps-3 my-2 italic"
      style={{
        borderColor: 'var(--ap-border)',
        color: 'var(--ap-muted-foreground)',
      }}
    >
      {children}
    </blockquote>
  ),

  // ─── Horizontal rule — quiet spacing ──────
  hr: () => <div aria-hidden className="my-3" />,

  // ─── Lists ────────────────────────────────
  ul: ({ children }: any) => (
    <ul className="list-disc pl-5 my-1 space-y-0.5" style={{ listStylePosition: 'outside' }}>
      {children}
    </ul>
  ),
  ol: ({ children }: any) => (
    <ol className="list-decimal pl-5 my-1 space-y-0.5" style={{ listStylePosition: 'outside' }}>
      {children}
    </ol>
  ),
  li: ({ children }: any) => (
    <li className="text-sm" style={{ lineHeight: 'var(--conv-line-height)' }}>
      {children}
    </li>
  ),

  // ─── Tables ───────────────────────────────
  table: ({ children }: any) => (
    <div className="overflow-x-auto my-2">
      <table
        className="min-w-full border-collapse text-xs"
        style={{ borderColor: 'var(--ap-border)' }}
      >
        {children}
      </table>
    </div>
  ),
  th: ({ children }: any) => (
    <th
      className="border px-2 py-1 font-semibold text-left"
      style={{
        borderColor: 'var(--ap-border)',
        backgroundColor: 'var(--ap-muted)',
      }}
    >
      {children}
    </th>
  ),
  td: ({ children }: any) => (
    <td className="border px-2 py-1" style={{ borderColor: 'var(--ap-border)' }}>
      {children}
    </td>
  ),

  // ─── Strong / Emphasis ────────────────────
  strong: ({ children }: any) => (
    <strong style={{ color: 'var(--ap-foreground)' }}>{children}</strong>
  ),
}

/* ═══════════════════════════════════════════════
   Entry point — route by role
   ═══════════════════════════════════════════════ */

interface Props {
  msg: StreamMessage
}

export default function MessageBubble({ msg }: Props) {
  if (msg.role === 'user') return <UserMsg msg={msg} />
  return <AssistantMsg msg={msg} />
}
