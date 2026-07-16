// ═══════════════════════════════════════════════
// Aperture — Claude Code CLI Backend
// Protocol: NDJSON via stdout (--output-format stream-json --verbose)
// ═══════════════════════════════════════════════

import { execSync } from 'child_process'
import { existsSync } from 'fs'
import { resolve } from 'path'
import type { AgentBackend } from './types'
import type { StartParams, SpawnCommand, DetectResult, AgentEvent, Provider } from '../../shared/types'

const BINARY_NAME = process.platform === 'win32' ? 'claude.cmd' : 'claude'

// ─── Detection ──────────────────────────────────

function findClaudeBinary(): string | null {
  const names = process.platform === 'win32' ? ['claude.cmd', 'claude'] : ['claude']
  for (const name of names) {
    try {
      const cmd = process.platform === 'win32' ? `where ${name} 2>nul` : `which ${name} 2>/dev/null`
      const result = execSync(cmd, { encoding: 'utf-8' })
      for (const line of result.trim().split('\n')) {
        const trimmed = line.trim()
        if (trimmed && existsSync(trimmed)) return trimmed
      }
    } catch { /* not found */ }
  }

  for (const base of [
    resolve(process.env.HOME || '~', '.npm-global', 'bin', BINARY_NAME),
    resolve(process.env.LOCALAPPDATA || '~', 'npm-cache', BINARY_NAME),
    resolve('/usr/local/bin', BINARY_NAME),
    resolve('/opt/homebrew/bin', BINARY_NAME)
  ]) {
    if (existsSync(base)) return base
  }
  return null
}

// ─── Helpers ────────────────────────────────────

/** Extract content blocks from an assistant message, yielding 0+ AgentEvents */
function* parseAssistantContent(msg: Record<string, unknown>): Generator<AgentEvent> {
  const blocks: Array<Record<string, unknown>> =
    (msg as { message?: { content?: Array<Record<string, unknown>> } }).message?.content ?? []

  for (const block of blocks) {
    switch (block.type) {
      case 'thinking':
        yield { type: 'thinking', text: (block.thinking as string) ?? '' }
        break
      case 'text':
        yield { type: 'content', text: (block.text as string) ?? '' }
        break
      case 'tool_use':
        yield {
          type: 'tool_use',
          id: (block.id as string) ?? '',
          name: (block.name as string) ?? '',
          input: block.input ?? {}
        }
        break
    }
  }
}

// ─── Backend ────────────────────────────────────

export const claudeBackend: AgentBackend = {
  id: 'claude',
  name: 'Claude Code',
  description: "Anthropic's official CLI agent for software engineering",
  binaryName: BINARY_NAME,

  async detect(): Promise<DetectResult> {
    const path = findClaudeBinary()
    if (!path) return { installed: false, error: 'Claude Code CLI not found' }
    try {
      const version = execSync(`"${path}" --version`, { encoding: 'utf-8' }).trim()
      return { installed: true, path, version }
    } catch {
      return { installed: true, path }
    }
  },

  buildCommand(params: StartParams, _provider?: Provider): SpawnCommand {
    const binary = findClaudeBinary() || BINARY_NAME

    // stdin stream-json mode (TOKENICODE style)
    const args: string[] = [
      '-p', params.prompt,
      '--output-format', 'stream-json',
      '--include-partial-messages',
      '--verbose'
    ]

    if (params.sessionId) args.push('--resume', params.sessionId)
    if (params.model) args.push('--model', params.model)

    const mode = params.permissionMode ?? 'ask'
    switch (mode) {
      case 'bypass': args.push('--permission-mode', 'bypassPermissions'); break
      case 'code':   args.push('--permission-mode', 'acceptEdits'); break
      case 'plan':   args.push('--permission-mode', 'plan'); break
      default:       args.push('--permission-mode', 'bypassPermissions'); break
    }

    return { command: binary, args, cwd: params.cwd }
  },

  /** Build a user message for stdin stream-json mode (NDJSON single line) */
  buildUserMessage(text: string): string {
    return JSON.stringify({
      type: 'user',
      message: {
        role: 'user',
        content: [{ type: 'text', text }]
      }
    }) + '\n'
  },

  parseLine(line: string): AgentEvent[] {
    if (!line.trim()) return []
    try {
      const msg = JSON.parse(line)
      switch (msg.type) {
        case 'stream_event': {
          const evt = msg.event as Record<string, unknown> | undefined
          if (!evt) return []
          switch (evt.type) {
            case 'content_block_delta': {
              const delta = evt.delta as Record<string, unknown> | undefined
              if (delta?.type === 'thinking_delta')
                return [{ type: 'thinking', text: (delta.thinking as string) ?? '' }]
              if (delta?.type === 'text_delta')
                return [{ type: 'content', text: (delta.text as string) ?? '' }]
              return []
            }
            case 'content_block_start': {
              const block = evt.content_block as Record<string, unknown> | undefined
              if (block?.type === 'tool_use')
                return [{ type: 'tool_use', id: (block.id as string) ?? '', name: (block.name as string) ?? '', input: block.input ?? {} }]
              return []
            }
            case 'message_stop':
              return [{ type: 'done' }]
            default:
              return []
          }
        }

        case 'assistant':
          // --include-partial-messages is always active, so content blocks
          // already arrived via stream_event content_block_delta events.
          // Do NOT re-emit content here — it would double up every
          // thinking/text/tool_use block in the frontend.
          return []

        case 'user':
          // tool_result is inside user messages
          const blocks = (msg.message?.content ?? []) as Array<Record<string, unknown>>
          return blocks
            .filter((b) => b.type === 'tool_result')
            .map((b) => ({
              type: 'tool_result' as const,
              id: (b.tool_use_id as string) ?? '',
              content: typeof b.content === 'string' ? b.content : JSON.stringify(b.content),
              isError: (b.is_error as boolean) ?? false
            }))

        case 'result':
          return [{ type: 'done', exitCode: msg.is_error ? 1 : 0, usage: msg.usage, cost: msg.total_cost_usd }]

        case 'system':
          return msg.subtype === 'init'
            ? [{ type: 'system', subtype: 'init', data: msg }]
            : [] // skip thinking_tokens noise

        case 'control_request': {
          const req = msg.request as Record<string, unknown> | undefined
          if (req?.subtype === 'can_use_tool') {
            return [{
              type: 'permission',
              requestId: (msg.request_id as string) ?? '',
              toolName: (req.tool_name as string) ?? '',
              input: req.input ?? {},
              description: req.description as string | undefined
            }]
          }
          return []
        }

        default:
          return []
      }
    } catch {
      return []
    }
  },

  buildControlCommand(action, value) {
    const id = Math.random().toString(36).slice(2, 10)
    switch (action) {
      case 'interrupt':
        return JSON.stringify({ type: 'control_request', request_id: id, request: { subtype: 'interrupt' } })
      case 'set_mode':
        return JSON.stringify({ type: 'control_request', request_id: id, request: { subtype: 'set_permission_mode', mode: value ?? 'default' } })
      case 'set_model':
        return JSON.stringify({ type: 'control_request', request_id: id, request: { subtype: 'set_model', model: value } })
      default:
        return null
    }
  },

  buildResumeArgs(sessionId) {
    return ['--resume', sessionId]
  },

  buildEnv(_params, provider) {
    const env: Record<string, string> = {}
    if (provider?.apiUrl) env['ANTHROPIC_BASE_URL'] = provider.apiUrl
    return env
  }
}
