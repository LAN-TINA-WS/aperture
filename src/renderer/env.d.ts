/// <reference types="vite/client" />

export {}

declare global {
  interface Window {
    api: {
      agent: {
        start: (params: unknown) => Promise<{ pid: number; sessionId: string }>
        kill: (pid: number) => Promise<void>
        resume: (params: unknown) => Promise<{ pid: number; sessionId: string }>
        permission: (response: unknown) => Promise<void>
        control: (action: unknown) => Promise<void>
        list: () => Promise<Array<{ pid: number; backendId: string; sessionId: string }>>
        sendMessage: (params: { pid: number; text: string }) => Promise<void>
        setPermissionMode: (pid: number, mode: string) => Promise<void>
      }
      session: {
        list: () => Promise<unknown[]>
        get: (id: string) => Promise<unknown>
        create: (opts: unknown) => Promise<unknown>
        delete: (id: string, meta?: { sourcePath?: string; providerId?: string }) => Promise<{ deleted: boolean; fileDeleted?: boolean; error?: string }>
        rename: (id: string, title: string) => Promise<void>
        renameScanned: (sessionId: string, title: string) => Promise<void>
        pin: (id: string, pinned: boolean) => Promise<void>
        archive: (id: string) => Promise<void>
      }
      scanner: {
        scan: () => Promise<Array<{ providerId: string; sessionId: string; title: string | null; sourcePath: string; projectDir: string | null; resumeCommand: string | null; lastActiveAt: number | null }>>
        messages: (providerId: string, sessionId: string, sourcePath?: string) => Promise<Array<{ role: string; content: string; ts: number | null }>>
        onScanResult: (cb: (sessions: unknown) => void) => () => void
      }
      provider: {
        list: () => Promise<unknown[]>
        save: (p: unknown) => Promise<void>
        delete: (id: string) => Promise<void>
        test: (id: string) => Promise<{ success: boolean; latencyMs?: number; error?: string }>
      }
      backend: {
        list: () => Promise<Array<{ id: string; name: string; description: string }>>
        detect: (id: string) => Promise<{ installed: boolean; path?: string; version?: string; error?: string }>
        install: (id: string) => Promise<{ success: boolean; error?: string }>
      }
      file: {
        list: (dir: string) => Promise<unknown[]>
        read: (path: string) => Promise<string>
        write: (path: string, content: string) => Promise<void>
      }
      settings: {
        get: (key: string) => Promise<unknown>
        set: (key: string, value: unknown) => Promise<void>
      }
      ccswitch: {
        readSettings: () => Promise<unknown>
        readConfig: () => Promise<unknown>
        readProviders: () => Promise<unknown[]>
        readCurrentProviders: () => Promise<unknown[]>
        readUsage: (days?: number) => Promise<Array<{
          date: string; input_tokens: number; output_tokens: number
          request_count: number; total_cost_usd: string
        }>>
        testRead: () => Promise<unknown>
        debugPaths: () => Promise<unknown>
      }
      agentConfig: {
        scan: () => Promise<Array<{ agentName: string; installed: boolean; providerName?: string; endpoint?: string }>>
        import: () => Promise<unknown[]>
        debug: () => Promise<unknown>
      }
      app: {
        getVersion: () => Promise<string>
        getHome: () => Promise<string>
        openPath: (p: string) => Promise<void>
        minimize: () => Promise<void>
        maximize: () => Promise<void>
        close: () => Promise<void>
      }
      onStreamEvent: (cb: (data: unknown) => void) => () => void
      onStreamDone: (cb: (data: unknown) => void) => () => void
      onStreamError: (cb: (data: unknown) => void) => () => void
      onFileChanged: (cb: (data: unknown) => void) => () => void
    }
  }
}
