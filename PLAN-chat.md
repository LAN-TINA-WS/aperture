# Aperture — 对话重构方案

> 基于 Hermes Desktop 消息渲染 + TOKENICODE CLI 流式处理

## 研究结论

### Hermes Desktop 核心模式
- **消息结构**: `ChatMessage{id, role, content: ContentBlock[], thought?, createdAt}`
- **ContentBlock**: `{type:'text'|'tool_use'|'tool_result'|'reasoning', text, toolName, ...}`
- **流式状态**: `$busy` (是否处理中), `$awaitingResponse` (等待回复)
- **思考块**: `ThinkingDisclosure` 组件——流式时自动展开、完后自动收起、shimmer 动画
- **代码块**: `CodeCard`——圆角卡片，头部含语言标签+复制按钮，等宽字体
- **用户消息**: 玻璃气泡，右对齐，sticky 贴顶
- **布局**: 侧边栏 280px + 聊天区 flex + 可选右侧栏

### TOKENICODE 核心模式
- **消息类型**: text/tool_use/thinking/tool_result/permission/plan/question/todo
- **流式处理**: `StreamController` 用 rAF 缓冲，`partialText`+`partialThinking` 中间态
- **Tab 架构**: 每个会话独立 TabSession，Tab→stdinId 映射
- **续接**: `--resume <sessionId>` + `--continue` 双模式
- **会话扫描**: 直接读各 CLI 的本地存储文件

## Aperture 当前状态 (Phase 1 已完成)

```
[✓] Claude backend: spawn CLI → NDJSON parse → IPC
[✓] ChatStore: addUserMessage/addAssistantMessage/appendContent/appendThinking
[✓] MessageBubble: react-markdown + 代码块 + 思考折叠 + 用户气泡
[✓] 6 后端 session 扫描器 (Claude/Codex/Gemini/Hermes/OpenCode/OpenClaw)
[✓] 侧边栏分组显示 + 点击加载历史消息
[✓] 工具栏固定 + 窗口控件 + 设置齿轮
```

## Phase 2 — 对话渲染精修

### 2.1 消息类型扩展
当前只有 text/thinking/tool_use。需要补充：
- `tool_result` — 工具调用结果
- `permission` — 权限请求卡片
- `error` — 错误消息

### 2.2 流式状态优化
- 用 `partialText`/`partialThinking` 替代当前逐 token append
- 思考块：流式时自动展开，完成后自动折叠
- 添加 rAF 缓冲减少每 token 渲染次数

### 2.3 UI 细节对齐 Hermes
- 用户气泡：`rounded-xl border border-(--ap-user-bubble-border) bg-(--ap-user-bubble)`
- 思考标题：`思考中…` + shimmer + 箭头动画
- 代码块：`rounded-[0.625rem]` 卡片式 + 语言标签 + 复制
- 消息间距：`space-y-4` between turns

## Phase 3 — Claude --resume 接续

### 3.1 新会话
- 用户发送消息 → auto-create session → `claude -p "prompt" --output-format stream-json --verbose`

### 3.2 已有会话
- 点击侧边栏会话 → 加载 .jsonl 历史 → 渲染消息
- 用户输入新消息 → `claude --resume <sessionId> --output-format stream-json --verbose`
- 新消息追加到历史后面

### 3.3 消息持久化
- Claude 自己管理 .jsonl 文件——我们只读，不写
- 下次启动时重新扫描即可看到新消息

## Phase 4 — 多 CLI 后端支持

### 4.1 已有 Claude Code ✓
### 4.2 Hermes Agent
- session 扫描：读 `~/.hermes/state.db` + `sessions/` 目录
- 流式对话：通过 Hermes gateway API（非 CLI）

### 4.3 Codex CLI
- session 扫描：读 `~/.codex/sessions/` + `session_index.jsonl`
- 流式对话：`codex --output-format stream-json`

## 实施顺序

| # | 任务 | 预计影响 |
|---|------|---------|
| 1 | 修复 MessageBubble 思考块展开/折叠逻辑 | 中 |
| 2 | 添加 partialText/partialThinking 流式缓冲 | 中 |
| 3 | 消息类型补全 (tool_result, error) | 小 |
| 4 | Claude --resume 接续 | 大 |
| 5 | 多轮对话测试验证 | - |
