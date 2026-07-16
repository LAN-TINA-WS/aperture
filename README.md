# Aperture — 通用 AI Agent 桌面壳

> Aperture /ˈæpətʃər/ — 光圈，开口。
> 摄影中控制光进入量的装置。一个开口，决定多少 AI 智能流入你的工作流。
> 不制造光，只决定光的形状和方向。
>
> **⚠️ 开发阶段 — 当前为 Alpha 版本，API 和行为可能随时变更。暂不建议用于生产环境。**

## 一句话
**为所有 AI Agent CLI 提供统一、优雅的桌面体验。一个窗口，通向任何 Agent。**

---

## 已实现功能 (Alpha)

| 功能 | 状态 | 说明 |
|------|:---:|------|
| **Claude Code 直连** | ✅ | CLI spawn 多轮对话，`--continue` 会话保持，流式 parsing |
| **Provider 管理** | ✅ | 75+ 预设 Provider，本地 Agent 配置扫描，支持 HTTP/SOCKS 代理 |
| **会话侧边栏** | ✅ | 按项目分组、新建/删除/重命名/右键菜单 |
| **底部状态栏** | ✅ | 20px 全宽，轮次耗时 · 上下文用量 · 审批模式 · 版本号 |
| **设置面板** | ✅ | Hermes 风格侧边栏导航，9 个独立 Section，字体大小自由调节 |
| **消息折叠** | ✅ | 按轮次渐进释放，避免长对话卡顿 |
| **停止/排队** | ✅ | 思考中终止进程 + 新消息自动排队 |
| **智能滚动** | ✅ | 流式输出时可翻阅历史不被打断 |
| **session-scanner** | ✅ | 直接读取 `~/.claude/projects/` 扫描 Claude Code 历史会话 |
| **CC Switch 导入** | ✅ | 读取 CC Switch SQLite 数据库迁移 Provider/设置 |

> 参考项目: [CC Switch](https://github.com/farion1231/cc-switch) (MIT) · 设计灵感: [Hermes Desktop](https://nousresearch.com)

---

## 路线图 (Roadmap)

### CLI 后端接入

| 后端 | 状态 | 计划 |
|------|:---:|------|
| **Claude Code** | ✅ 已接入 | 命令行直接对接,项目持久化,数据透明 |
| **OpenAI Codex** | 🔧 规划中 | spawn stdin/stdout 协议, provider 切换 |
| **Gemini CLI** | 🔧 规划中 | 复用通用 Gemini backend |
| **Hermes Agent** | 📋 远期 | 与 Hermes Desktop 深度联动 |
| **OpenCode** | 📋 远期 | 通用 CLI backend |
| **OpenClaw** | 📋 远期 | 通用 CLI backend |

### 核心能力

| 功能 | 计划 |
|------|------|
| **MCP 全协议支持** | 管理本地/远程 MCP 服务器, 热加载工具 |
| **权限审批 UI** | 接管 `Ask`/`Code`/`Plan`/`Bypass` 四种模式的可视化审批 |
| **文件浏览器** | 右侧详情面板显示项目文件树 |
| **内嵌终端** | xterm.js + node-pty, 一键打开 Agent 所在目录终端 |
| **应用打包发布** | electron-builder → Windows/macOS/Linux 安装包 |
| **自动更新** | electron-updater, GitHub Releases 分发 |

---

## 1. 技术选型

| 层 | 选型 | 理由 |
|---|---|---|
| 桌面框架 | **Electron 35** | Chromium 渲染一致性；xterm.js 内嵌终端；npm 全生态 |
| 前端 | **React 19 + TypeScript** | 三个参考项目（TOKENICODE/CC Switch/Hermes）均用此栈 |
| 样式 | **Tailwind CSS 4 + CSS 变量主题** | 借鉴 Hermes token 体系；亮/暗/自定义三模式 |
| 状态管理 | **Zustand 5** | 轻量无模板，与参考项目一致 |
| 构建 | **Vite 7 + electron-vite** | HMR 热重载，electron-vite 社区成熟方案 |
| IPC | **contextBridge + ipcRenderer/ipcMain** | Electron 安全标准；Renderer 不直接访问 Node.js |
| 数据库 | **better-sqlite3** | 同步 API，零延迟；会话/Provider/设置全存 SQLite |
| 编辑器 | **CodeMirror 6** | 文件编辑 + diff 高亮 + 语法着色 |
| 终端(可选) | **xterm.js + node-pty** | 内嵌 CLI 终端面板 |
| 包管理 | **pnpm** | monorepo 友好，三个参考项目均用 pnpm |

## 2. 项目结构

```
Aperture/
├── package.json
├── electron-builder.yml              # 打包配置（nsis/dmg/appimage）
├── electron.vite.config.ts
│
├── src/
│   ├── main/                         # Electron 主进程 (Node.js)
│   │   ├── index.ts                  # 入口：BrowserWindow、IPC 注册
│   │   ├── windows.ts                # 多窗口管理
│   │   ├── ipc/                      # IPC handlers
│   │   │   ├── agent.ts              # agent:start / kill / permission / control
│   │   │   ├── session.ts            # session:list / get / delete / rename / export
│   │   │   ├── provider.ts           # provider:list / save / delete / test
│   │   │   ├── file.ts               # file:list / read / write / watch
│   │   │   └── settings.ts           # settings:get / set
│   │   ├── agent/                    # Agent Backend 抽象层 ★核心★
│   │   │   ├── types.ts              # AgentBackend 接口 + 事件类型
│   │   │   ├── registry.ts           # Backend 注册中心
│   │   │   ├── manager.ts            # 进程生命周期管理（spawn/kill/stdin/stdout）
│   │   │   ├── claude.ts             # Claude Code CLI backend
│   │   │   ├── hermes.ts             # Hermes Agent CLI backend
│   │   │   ├── codex.ts              # OpenAI Codex CLI backend
│   │   │   └── generic.ts            # 通用 OpenAI 兼容 backend
│   │   ├── db/
│   │   │   ├── connection.ts         # better-sqlite3 单例
│   │   │   ├── migrate.ts            # 迁移 runner
│   │   │   └── repositories/
│   │   │       ├── sessions.ts       # 会话 CRUD
│   │   │       ├── messages.ts       # 消息存取
│   │   │       ├── providers.ts      # Provider 管理
│   │   │       └── settings.ts       # 键值设置
│   │   └── utils/
│   │       ├── stream.ts             # 通用 NDJSON/SSE 行解析
│   │       ├── proxy.ts              # 代理检测（env → macOS sys → port probe）
│   │       ├── crypto.ts             # API key 对称加密
│   │       └── platform.ts           # 平台差异适配
│   │
│   ├── preload/                      # contextBridge 安全暴露
│   │   ├── index.ts
│   │   └── index.d.ts
│   │
│   ├── renderer/                     # React 前端
│   │   ├── index.html
│   │   ├── main.tsx
│   │   ├── App.tsx                   # 根组件：主题注入 + ErrorBoundary
│   │   │
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── AppShell.tsx      # 三栏布局容器 + resize 拖拽
│   │   │   │   ├── Sidebar.tsx       # 左侧栏
│   │   │   │   ├── ChatArea.tsx      # 中间聊天区
│   │   │   │   ├── DetailPanel.tsx   # 右侧详情（可收起）
│   │   │   │   └── StatusBar.tsx     # 底部状态栏
│   │   │   │
│   │   │   ├── chat/
│   │   │   │   ├── Thread.tsx        # 消息列表虚拟滚动
│   │   │   │   ├── MessageBubble.tsx # 单条消息气泡
│   │   │   │   ├── ThinkingBlock.tsx # 思考阶段展开/折叠
│   │   │   │   ├── ToolCard.tsx      # 工具调用卡片（代码/文件/命令）
│   │   │   │   ├── PermissionCard.tsx# 权限审批卡片（allow/deny）
│   │   │   │   ├── Composer.tsx      # 底部输入框（TipTap 富文本）
│   │   │   │   ├── ModelSelector.tsx # 模型下拉选择器
│   │   │   │   ├── ModeSelector.tsx  # Ask/Code/Bypass 三态切换
│   │   │   │   └── BackendSelector.tsx# Agent 后端切换
│   │   │   │
│   │   │   ├── sidebar/
│   │   │   │   ├── SessionList.tsx   # 会话列表（按日期分组）
│   │   │   │   ├── SessionItem.tsx   # 单条会话项
│   │   │   │   ├── SessionGroup.tsx  # 今天/昨天/本周/更早
│   │   │   │   └── SearchBar.tsx     # 会话搜索
│   │   │   │
│   │   │   ├── detail/
│   │   │   │   ├── FileExplorer.tsx  # 文件树浏览
│   │   │   │   ├── FilePreview.tsx   # 文件预览
│   │   │   │   ├── CodeEditor.tsx    # CodeMirror 编辑器
│   │   │   │   └── DiffView.tsx      # 文件差异对比
│   │   │   │
│   │   │   ├── settings/
│   │   │   │   ├── SettingsDialog.tsx# 设置弹窗
│   │   │   │   ├── ProviderTab.tsx   # API Provider 管理
│   │   │   │   ├── BackendTab.tsx    # Agent 后端安装/配置
│   │   │   │   ├── ThemeTab.tsx      # 主题选择
│   │   │   │   ├── ShortcutTab.tsx   # 快捷键配置
│   │   │   │   └── AboutTab.tsx      # 版本/更新
│   │   │   │
│   │   │   ├── command/
│   │   │   │   └── CommandPalette.tsx# Ctrl+K 命令面板
│   │   │   │
│   │   │   └── ui/                   # 通用 UI 原语（shadcn 风格）
│   │   │       ├── button.tsx
│   │   │       ├── dialog.tsx
│   │   │       ├── dropdown-menu.tsx
│   │   │       ├── input.tsx
│   │   │       ├── tooltip.tsx
│   │   │       ├── badge.tsx
│   │   │       ├── separator.tsx
│   │   │       ├── scroll-area.tsx
│   │   │       ├── tabs.tsx
│   │   │       ├── select.tsx
│   │   │       ├── switch.tsx
│   │   │       ├── kbd.tsx
│   │   │       └── context-menu.tsx
│   │   │
│   │   ├── stores/                   # Zustand (每个 store 独立文件)
│   │   │   ├── sessionStore.ts       # 会话 CRUD + 选择状态
│   │   │   ├── agentStore.ts         # Agent 活动状态 + 子任务树
│   │   │   ├── providerStore.ts      # Provider 配置列表
│   │   │   ├── backendStore.ts       # Backend 注册/检测状态
│   │   │   ├── chatStore.ts          # 当前对话流状态
│   │   │   ├── fileStore.ts          # 文件浏览/选中状态
│   │   │   ├── themeStore.ts         # 主题/字体/字号
│   │   │   └── settingsStore.ts      # UI 偏好设置
│   │   │
│   │   ├── hooks/                    # 自定义 hooks
│   │   │   ├── useAgentStream.ts     # IPC 流式接收 + 缓冲区处理
│   │   │   ├── useIpc.ts             # IPC invoke 封装（loading/error）
│   │   │   ├── useTheme.ts           # CSS 变量注入 + 亮暗切换
│   │   │   ├── useKeyboard.ts        # 全局快捷键注册
│   │   │   ├── useResizable.ts       # 面板拖拽 resize
│   │   │   └── useFileWatcher.ts     # 文件变更推送
│   │   │
│   │   ├── lib/
│   │   │   ├── ipc.ts                # IPC 客户端类型安全封装
│   │   │   ├── markdown.ts           # react-markdown + rehype/remark 配置
│   │   │   ├── i18n.ts               # i18next 中文/英文
│   │   │   └── utils.ts              # cn() / 格式化 / 工具函数
│   │   │
│   │   └── styles/
│   │       ├── globals.css           # Tailwind 导入 + CSS 变量注入
│   │       ├── aperture-light.css    # Aperture 亮色主题
│   │       ├── aperture-dark.css     # Aperture 暗色主题
│   │       └── tokens.css            # 完整 token 定义（30+ 变量）
│   │
│   └── shared/                       # 主进程 ↔ 渲染进程 共享类型
│       ├── types/
│       │   ├── agent.ts
│       │   ├── session.ts
│       │   ├── provider.ts
│       │   ├── file.ts
│       │   └── ipc.ts                # IPC 通道枚举 + 参数/返回值类型
│       └── constants.ts
│
├── resources/                        # 应用图标
│   ├── icon.icns
│   ├── icon.ico
│   └── icon.png
│
└── tests/
    ├── main/
    │   ├── agent/                    # Backend 单元测试
    │   └── db/                       # 数据库测试
    └── renderer/
        ├── stores/                   # Store 单元测试
        ├── components/               # 组件测试
        └── e2e/                      # Playwright + Electron E2E
```

## 3. 核心架构

### 3.1 进程模型

```
┌────────────────────────────────────────────────────┐
│                 Main Process (Node.js)              │
│                                                    │
│  ┌──────────────────────────────────────────────┐  │
│  │           AgentBackend Registry               │  │
│  │                                              │  │
│  │  ┌─────────┐ ┌────────┐ ┌───────┐ ┌───────┐ │  │
│  │  │ Claude  │ │ Hermes │ │ Codex │ │Generic│ │  │
│  │  │  Code   │ │ Agent  │ │  CLI  │ │OpenAI │ │  │
│  │  └────┬────┘ └───┬────┘ └──┬────┘ └──┬────┘ │  │
│  │       │          │         │         │      │  │
│  │  ┌────▼──────────▼─────────▼─────────▼──────┐ │  │
│  │  │          Process Manager                 │ │  │
│  │  │  child_process.spawn()                   │ │  │
│  │  │  stdout/stderr stream → AgentEvent       │ │  │
│  │  │  stdin.write() → control/permission      │ │  │
│  │  └─────────────────────────────────────────┘ │  │
│  │                                              │  │
│  │  ┌────────────┐ ┌──────────┐ ┌────────────┐ │  │
│  │  │ better-    │ │   fs     │ │   Proxy    │ │  │
│  │  │ sqlite3    │ │  watch   │ │  Detector  │ │  │
│  │  └────────────┘ └──────────┘ └────────────┘ │  │
│  └──────────────────────┬───────────────────────┘  │
│                         │ contextBridge IPC         │
└─────────────────────────┼──────────────────────────┘
                          │
┌─────────────────────────┼──────────────────────────┐
│             Renderer Process (Chromium)             │
│  ┌──────────────────────▼────────────────────────┐ │
│  │                React App                       │ │
│  │                                                │ │
│  │  ┌──────────┬───────────────────┬────────────┐ │ │
│  │  │ Sidebar  │    Chat Area      │   Detail   │ │ │
│  │  │ 280px    │    flex-grow      │   0-400px  │ │ │
│  │  │          │                   │            │ │ │
│  │  │Backend ▼│ ┌───────────────┐ │ File Tree  │ │ │
│  │  │Sessions  │ │Message Thread │ │ Editor     │ │ │
│  │  │Search    │ │┌─────────────┐│ │ Diff View  │ │ │
│  │  │          │ ││ Thinking    ││ │            │ │ │
│  │  │          │ ││ Content     ││ │            │ │ │
│  │  │          │ ││ Tool Cards  ││ │            │ │ │
│  │  │          │ │└─────────────┘│ │            │ │ │
│  │  │          │ ├───────────────┤ │            │ │ │
│  │  │          │ │   Composer    │ │            │ │ │
│  │  │          │ │ [input...]  ▷│ │            │ │ │
│  │  │          │ └───────────────┘ │            │ │ │
│  │  └──────────┴───────────────────┴────────────┘ │ │
│  └────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────┐ │
│  │ StatusBar: ▸ Running | tokens:12k | 03:45      │ │
│  └────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

### 3.2 AgentBackend 接口

```typescript
// —— src/main/agent/types.ts ——

interface StartParams {
  prompt: string
  cwd: string
  model?: string
  sessionId?: string           // 恢复已有 CLI 会话
  permissionMode?: PermissionMode
  thinkingLevel?: ThinkingLevel
  providerConfig?: ProviderConfig
  env?: Record<string, string>
}

type PermissionMode = 'ask' | 'code' | 'plan' | 'bypass'
type ThinkingLevel  = 'off' | 'low' | 'medium' | 'high' | 'max'

// 标准化事件（所有 Agent 后端统一输出）
type AgentEvent =
  | { type: 'thinking';    text: string }
  | { type: 'content';     text: string }
  | { type: 'tool_use';    id: string; name: string; input: unknown }
  | { type: 'tool_result'; id: string; content: string; isError?: boolean }
  | { type: 'permission';  requestId: string; toolName: string; input: unknown; description?: string }
  | { type: 'system';      subtype: 'init' | 'model_change' | 'mode_change'; data: unknown }
  | { type: 'error';       message: string; fatal?: boolean }
  | { type: 'done';        exitCode?: number }

// 每个 Agent 后端必须实现
interface AgentBackend {
  id: string
  name: string
  description: string
  binaryName: string          // CLI 可执行文件名

  /** 检测本地是否已安装 */
  detect(): Promise<DetectResult>

  /** 安装 CLI（如未安装则引导安装） */
  install?(): Promise<InstallResult>

  /** 构建启动进程的参数 */
  buildCommand(params: StartParams): SpawnCommand

  /** 将 CLI 的原始输出行解析为标准 AgentEvent。
   *  返回 null 表示该行不需要发送到前端。 */
  parseLine(line: string): AgentEvent | null

  /** 构建权限响应（写入 stdin） */
  buildPermissionResponse(
    requestId: string,
    decision: 'allow' | 'deny',
    reason?: string
  ): string

  /** 构建运行时控制命令（切换模式/模型/中断） */
  buildControlCommand(
    action: 'interrupt' | 'set_mode' | 'set_model',
    value?: string
  ): string | null

  /** 构建恢复会话的额外参数 */
  buildResumeArgs?(sessionId: string): string[]

  /** 构建环境变量 */
  buildEnv?(params: StartParams, provider?: ProviderConfig): Record<string, string>
}

interface DetectResult {
  installed: boolean
  path?: string
  version?: string
  error?: string
}

interface SpawnCommand {
  command: string               // 可执行文件路径
  args: string[]                // 命令行参数
  cwd: string                   // 工作目录
  env?: Record<string, string>  // 环境变量
}
```

### 3.3 流式通信时序

```
Renderer                        Main                         CLI Process
   │                              │                              │
   │── agent:start(params) ──────►│                              │
   │                              │── backend.buildCommand()     │
   │                              │── child_process.spawn() ────►│
   │                              │                              │
   │                              │◄── stdout '{"type":"..."}' ──│
   │                              │── parseLine() → AgentEvent   │
   │◄── stream:event ────────────│                              │
   │── React setState            │                              │
   │                              │◄── stdout line ──────────────│
   │                              │── parseLine() ...            │
   │◄── stream:event ────────────│                              │
   │                              │         ...（循环）           │
   │                              │◄── process 'exit' ───────────│
   │◄── stream:done ─────────────│                              │
   │                              │                              │
   │── agent:permission ────────►│                              │
   │   { requestId, decision }   │── stdin.write(response) ─────►│
   │                              │                              │
   │── agent:control ───────────►│                              │
   │   { action: 'set_mode' }    │── stdin.write(ctrlCmd) ──────►│
   │                              │                              │
   │── agent:kill ──────────────►│                              │
   │                              │── process.kill('SIGTERM') ──►│
```

### 3.4 IPC 通道总览

```typescript
// —— src/shared/types/ipc.ts ——

/** 双向 Request-Response */
type IpcInvokeChannel =
  // Agent 操作
  | 'agent:start'          // → pid
  | 'agent:kill'           // → void
  | 'agent:resume'         // → pid
  | 'agent:permission'     // → void
  | 'agent:control'        // → void
  | 'agent:list'           // → ActiveSession[]

  // 会话操作
  | 'session:list'         // → Session[]
  | 'session:get'          // → Session + Messages
  | 'session:delete'       // → void
  | 'session:rename'       // → void
  | 'session:pin'          // → void
  | 'session:archive'      // → void
  | 'session:export'       // → string (file path)

  // Provider 操作
  | 'provider:list'        // → Provider[]
  | 'provider:save'        // → void
  | 'provider:delete'      // → void
  | 'provider:test'        // → TestResult

  // Backend 操作
  | 'backend:list'         // → BackendMeta[]
  | 'backend:detect'       // → DetectResult
  | 'backend:install'      // → InstallResult

  // 文件操作
  | 'file:list'            // → FileNode[]
  | 'file:read'            // → string
  | 'file:write'           // → void
  | 'file:watch'           // → void (start watching)

  // 设置
  | 'settings:get'         // → Settings
  | 'settings:set'         // → void

  // 系统
  | 'app:getVersion'       // → string
  | 'app:checkUpdate'      // → UpdateInfo?
  | 'dialog:openFolder'    // → string?

/** Main → Renderer 单向推送 */
type IpcPushChannel =
  | 'stream:event'         // AgentEvent
  | 'stream:done'          // { exitCode?: number }
  | 'stream:error'         // { message: string }
  | 'file:changed'         // { path: string; type: 'add' | 'change' | 'delete' }
  | 'app:updateAvailable'  // UpdateInfo
```

### 3.5 数据库 Schema

```sql
-- 会话
CREATE TABLE sessions (
  id          TEXT PRIMARY KEY,      -- UUID
  title       TEXT,                  -- 自动生成 / 用户命名
  backend_id  TEXT NOT NULL,         -- 'claude' | 'hermes' | 'codex' | 'generic'
  provider_id TEXT,                  -- 关联的 Provider ID
  cwd         TEXT NOT NULL,
  model       TEXT,
  permission  TEXT DEFAULT 'ask',    -- ask | code | plan | bypass
  status      TEXT DEFAULT 'active', -- active | archived
  pinned      INTEGER DEFAULT 0,
  message_count INTEGER DEFAULT 0,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 消息（每条对话轮次）
CREATE TABLE messages (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id   TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  role         TEXT NOT NULL,        -- user | assistant | system
  content      TEXT,                 -- Markdown
  thinking     TEXT,                 -- 思考过程（折叠显示）
  tool_calls   TEXT,                 -- JSON: ToolCall[]
  tool_results TEXT,                 -- JSON: ToolResult[]
  token_count  INTEGER,
  created_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Provider 配置
CREATE TABLE providers (
  id             TEXT PRIMARY KEY,   -- UUID
  name           TEXT NOT NULL,
  backend_id     TEXT NOT NULL,      -- 适用的 Agent 后端
  api_url        TEXT,
  api_key_enc    TEXT,               -- AES 加密存储
  model          TEXT,
  extra_config   TEXT,               -- JSON
  is_default     INTEGER DEFAULT 0,
  sort_order     INTEGER DEFAULT 0,
  created_at     TEXT NOT NULL DEFAULT (datetime('now'))
);

-- MCP 服务器配置
CREATE TABLE mcp_servers (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  command    TEXT,                   -- 启动命令
  args       TEXT,                   -- JSON: string[]
  url        TEXT,                   -- HTTP MCP 地址
  enabled    INTEGER DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 键值设置
CREATE TABLE settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- 索引
CREATE INDEX idx_messages_session ON messages(session_id);
CREATE INDEX idx_sessions_updated ON sessions(updated_at DESC);
CREATE INDEX idx_providers_backend ON providers(backend_id);
```

---

## 4. 配色方案：Aperture 主题

```
                    Light                        Dark
───────────────────────────────────────────────────────────
background        #F8FAFF (淡蓝白)             #0B1A3A (深靛蓝)
sidebar           #F1F5FF                      #07142E
foreground        #17171A (近黑)               #E8E0D0 (暖奶油)
card              #FFFFFF                      #0F2045
border            #D0D8F0                      #243868
primary           #3366FF (电光蓝)             #E8E0D0
ring              #3366FF                      #E8E0D0
midground         #3366FF                      #4488DD
muted             #EEF2FF                      #162D56
mutedForeground   #666678                      #8899BB
destructive       #D94050                      #D9485A

─── Agent 阶段色 ───────────────────────────────────────
agent.thinking    #8B5CF6 (紫)                 #A78BFA
agent.writing     #3B82F6 (蓝)                 #60A5FA
agent.tool        #F59E0B (琥珀)               #FBBF24
agent.done        #10B981 (翠绿)               #34D399
agent.error       #EF4444 (红)                 #F87171

─── Diff 色 ────────────────────────────────────────────
diff.added.bg     #DCFCE7                      #064E3B
diff.removed.bg   #FEE2E2                      #7F1D1D
```

CSS 变量前缀：`--ap-*`（aperture）

```css
:root {
  --ap-background: #F8FAFF;
  --ap-foreground: #17171A;
  /* ... 32 tokens */
}

.dark {
  --ap-background: #0B1A3A;
  --ap-foreground: #E8E0D0;
  /* ... */
}
```

---

## 5. 功能路线图

### P0 — 最小可用 (目标：能聊天)
- [ ] `pnpm create @quick-start/electron` 初始化
- [ ] AppShell 三栏布局 + CSS Token 主题注入
- [ ] AgentBackend 接口 + Claude Code 实现
- [ ] Main 进程 spawn CLI → stdout 行解析 → IPC push → React 流式渲染
- [ ] 单会话完整对话流程（输入 → 发送 → 显示 → 工具卡片）

### P1 — 核心体验 (目标：日常可用)
- [ ] 多会话管理（创建/切换/删除/重命名/搜索/置顶/归档）
- [ ] SQLite 会话持久化 + 消息恢复
- [ ] Provider 管理（API key 加密存储、连接测试、导入导出）
- [ ] 权限审批（Ask/Code/Bypass 三模式 + 工具调用卡片）
- [ ] Agent 活动指示器（思考/写入/工具 阶段动画 + 子 Agent 树）

### P2 — 增强 (目标：功能完整)
- [ ] Hermes Agent / Codex CLI / Generic OpenAI 三个新 backend
- [ ] 文件浏览器 + CodeMirror 编辑器 + Diff 视图
- [ ] 快捷键系统（Ctrl+K 命令面板、Ctrl+N 新建会话）
- [ ] 系统托盘（最小化到托盘、右键切换会话）
- [ ] 代理自动检测（env → macOS sys proxy → port probe → 手动配置）
- [ ] 亮色主题 + 主题切换

### P3 — 打磨 (目标：可以发布)
- [ ] MCP 服务器管理（添加/启用/测试）
- [ ] 会话导出（Markdown / JSON）
- [ ] 用量统计面板（token / 费用 / 趋势图）
- [ ] i18n 中英文切换
- [ ] 自动更新（electron-updater）
- [ ] 打包发布（nsis .exe / dmg / AppImage）

---

## 6. 快捷键设计

| 快捷键 | 功能 |
|---|---|
| `Ctrl+N` | 新建会话 |
| `Ctrl+K` | 命令面板 |
| `Ctrl+B` | 切换侧边栏 |
| `Ctrl+.` | 切换详情面板 |
| `Ctrl+Enter` | 发送消息 |
| `Ctrl+Shift+C` | 复制最后一条回复 |
| `Ctrl+,` | 打开设置 |
| `Ctrl+1/2/3` | 切换 Ask/Code/Bypass 模式 |
| `Ctrl+L` | 切换到亮色/暗色主题 |
| `Escape` | 关闭弹窗/中断 Agent |

---

## 7. 开发约定

| 类型 | 规范 | 示例 |
|---|---|---|
| 文件 | kebab-case | `agent-stream.ts`, `message-bubble.tsx` |
| React 组件 | PascalCase | `MessageBubble`, `ToolCard` |
| 函数/变量 | camelCase | `startAgent`, `parseStreamLine` |
| 类型/接口 | PascalCase | `AgentBackend`, `StartParams` |
| IPC 通道 | `domain:action` | `agent:start`, `session:list` |
| CSS 变量 | `--ap-token-name` | `--ap-background`, `--ap-agent-thinking` |
| Git 分支 | `type/desc` | `feat/claude-backend`, `fix/stream-parse` |
| 提交信息 | Conventional | `feat: add Claude Code backend` |

---

## 8. 启动命令

```bash
# 进入项目
cd D:/Deploy/Warehouse/Aperture

# 初始化
pnpm create @quick-start/electron . --template react-ts

# 开发
pnpm dev                    # electron-vite 热重载

# 测试
pnpm test                   # vitest
pnpm test:e2e               # playwright

# 构建
pnpm build
pnpm build:win              # → dist/Aperture-Setup-x64.exe
pnpm build:mac              # → dist/Aperture-x64.dmg
pnpm build:linux            # → dist/Aperture-x64.AppImage
```

---

## 9. 参考项目速查

| 项目 | 路径 | 参考内容 |
|---|---|---|
| TOKENICODE | `D:\Deploy\Warehouse\TOKENICODE` | 流式聊天 UI、会话管理、权限卡片、文件浏览器 |
| CC Switch | `D:\Deploy\Warehouse\cc-switch` | 多 Provider 管理、MCP 面板、用量追踪 |
| Hermes Agent | `D:\Deploy\Warehouse\hermes` | 主题 token 体系、UI 组件库、亮暗双模配色 |

---

*文档版本: 0.2.0 · 创建: 2026-07-14 · 更新: 2026-07-14 · 作者: Axiom (冰绪) + 蓝天*
