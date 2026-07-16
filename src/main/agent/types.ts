// ═══════════════════════════════════════════════
// Aperture — Agent Backend Interface
// Every CLI agent backend must implement this.
// ═══════════════════════════════════════════════

import type {
  StartParams,
  SpawnCommand,
  DetectResult,
  InstallResult,
  AgentEvent,
  Provider
} from '../../shared/types'

// ─── Interface ──────────────────────────────────

export interface AgentBackend {
  /** Unique ID (e.g. 'claude', 'hermes', 'codex') */
  readonly id: string
  /** Display name (e.g. 'Claude Code') */
  readonly name: string
  /** One-line description */
  readonly description: string
  /** CLI binary name to search for */
  readonly binaryName: string

  /** Check if the CLI is installed and discoverable */
  detect(): Promise<DetectResult>

  /** Build the spawn command for starting a session */
  buildCommand(params: StartParams, provider?: Provider): SpawnCommand

  /** Build a user message for stdin stream-json mode (NDJSON single line) */
  buildUserMessage?(text: string): string

  /**
   * Parse a single line of stdout into a standardized AgentEvent.
   * Return empty array if the line should be dropped (empty, noise, etc.)
   */
  parseLine(line: string): AgentEvent[]

  /**
   * Build a control command string to write to stdin.
   * Used for runtime actions: interrupt, set_mode, set_model.
   * Return null if the backend does not support runtime control.
   */
  buildControlCommand(
    action: 'interrupt' | 'set_mode' | 'set_model',
    value?: string
  ): string | null

  /** Build extra CLI args for resuming a session */
  buildResumeArgs?(sessionId: string): string[]

  /** Build environment variables injected into the CLI process */
  buildEnv?(params: StartParams, provider?: Provider): Record<string, string>

  /** Build a user message string to write to stdin for multi-turn conversation */
  buildUserMessage?(text: string): string

  /** Install the CLI (optional — some backends guide the user) */
  install?(): Promise<InstallResult>
}

// ─── Registry ───────────────────────────────────

const backends = new Map<string, AgentBackend>()

export function registerBackend(backend: AgentBackend): void {
  backends.set(backend.id, backend)
}

export function getBackend(id: string): AgentBackend | undefined {
  return backends.get(id)
}

export function listBackends(): AgentBackend[] {
  return Array.from(backends.values())
}

export async function detectAll(): Promise<
  Array<{ backend: AgentBackend; result: DetectResult }>
> {
  const results: Array<{ backend: AgentBackend; result: DetectResult }> = []
  for (const backend of backends.values()) {
    results.push({ backend, result: await backend.detect() })
  }
  return results
}
