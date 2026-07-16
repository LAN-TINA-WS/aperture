# Aperture 对话断裂根因诊断报告

> **诊断日期**: 2026-07-16  
> **范围**: `agent:start` → `stream:event` 完整链路  
> **SDK**: `@anthropic-ai/claude-agent-sdk` v0.3.209  
> **核心文件**: `src/main/agent/manager.ts`, `src/main/agent/sdk.ts`, `src/main/index.ts`, `src/renderer/components/layout/ChatArea.tsx`, `src/preload/index.ts`

---

## 一、SDK 独立验证（基准测试）

直接调用 SDK `query()` 确认 SDK 本身无问题：

```
$ node -e "...import { query }..."
[test] INIT: session_id=02f790b8-fccc-4bdf-8350-a6a45f29d3b9 model=deepseek-v4-pro
[test] Loop complete. Total messages: 48, gotInit: true
```

**结论**: SDK 正常工作。`system.init` 是第一条消息，包含真实的 `session_id`。`resume` 参数也验证通过（多轮对话可正常恢复）。

---

## 二、各检查点详细分析

### 检查点 1: `createQuery` 流程 (sdk.ts:54-76)

| 项目 | 状态 | 说明 |
|------|------|------|
| Options 构建 | ✅ 正确 | `permissionMode`, `includePartialMessages`, `allowedTools` 正确传递 |
| `allowDangerouslySkipPermissions` | ✅ 正确 | bypassPermissions 模式下自动设置为 true |
| `resume` 参数 | ✅ 正确 | `params.sessionId` → `opts.resume` |
| **sessionId 返回值** | ❌ 硬编码 `''` | **第 75 行**: `return { query: q, sessionId: '', cwd: params.cwd }` |

**sessionId 空字符串的根因**: `createQuery` 在创建 `QueryHandle` 时无法知道真实的 session_id。SDK 不通过 `query()` 的返回值提供 session_id，而是在第一条异步消息 `system.init` 中携带。因此 `createQuery` 只能返回空字符串。真实的 session_id 在 `pumpMessages` 中通过 `system.init` 事件事后补充。

```typescript
// sdk.ts:74-76 — sessionId 永远为 ''
const q = sdkQuery({ prompt: params.prompt, options: opts })
return { query: q, sessionId: '', cwd: params.cwd }
```

**影响**: 低。渲染进程不使用 `agent:start` 返回的 `sessionId`（ChatArea.tsx:219 仅使用 `result.pid`）。真正的 session_id 通过 `stream:event` 异步获取。

---

### 检查点 2: `startAgent` 完整流程 (manager.ts:24-62)

| 步骤 | 状态 | 说明 |
|------|------|------|
| 创建 AbortController | ✅ | 用于中断 |
| queryCounter 自增 | ✅ | 生成唯一 queryId |
| createQuery 调用 | ✅ | 创建 SDK Query + QueryHandle |
| activeQueries 注册 | ✅ | 第 51-56 行 |
| **pumpMessages 启动** | ⚠️ **Fire-and-forget** | **第 59 行: 未 await** |
| 返回值构建 | ⚠️ | `sessionId: handle.sessionId` 恒为 `''` |

```typescript
// manager.ts:59 — 关键行: pumpMessages 不被 await
pumpMessages(queryId, handle.query, window, abortController.signal)  // ← 无 await!
return { queryId: queryCounter, sessionId: handle.sessionId }          // ← sessionId 恒为 ''
```

**`pumpMessages` 不 await 的含义**:
- ✅ 正面: 不阻塞 `agent:start` 响应，渲染进程快速获得 pid
- ❌ 负面: `pumpMessages` 中的未捕获异常不会向上传播，调用方无感知
- ⚠️ pumpMessages 内部有 try/catch → stream:error，但渲染进程不监听此通道（见后文）

---

### 检查点 3: `pumpMessages` 消息循环 (manager.ts:103-148)

```typescript
async function pumpMessages(queryId, query, window, signal) {
  try {
    for await (const msg of query) {        // ← 异步迭代 SDK 消息
      if (signal.aborted) break              // ← 中断检查

      if (msg.type === 'system' && msg.subtype === 'init') {
        // 捕获真实 session_id
        activeQueries.get(queryId)!.handle.sessionId = sm.session_id
        // 发送精简版 init 事件给渲染进程
        window.webContents.send('stream:event', {
          queryId, event: { type: 'system', subtype: 'init',
            data: { session_id: sm.session_id } }  // ← 缺少 model, tools!
        })
        continue  // ← 跳过 adaptMessage
      }

      const events = adaptMessage(msg)       // ← SDK消息 → AgentEvent
      for (const event of events) {
        if (event.type === 'done')
          window.webContents.send('stream:done', { ... })
        else
          window.webContents.send('stream:event', { queryId, event })
      }
    }
  } catch (err) {
    window.webContents.send('stream:error', { queryId, message })  // ← 渲染进程不监听!
  } finally {
    if (!signal.aborted)
      window.webContents.send('stream:done', { queryId, exitCode: 0 })
    activeQueries.delete(queryId)            // ← 清理，后续消息走新 Query
  }
}
```

**发现的问题**:

| # | 问题 | 严重度 | 说明 |
|---|------|--------|------|
| 1 | **`system.init` 事件数据不完整** | 🟡 MEDIUM | 只发送 `{session_id}`，丢失 `model` 和 `tools`。`adaptMessage` 有完整版本(第103行)但被 `continue` 跳过。 |
| 2 | **`stream:error` 无人监听** | 🔴 **CRITICAL** | manager.ts:139 发送 `stream:error`，但 preload/index.ts 和 ChatArea.tsx 都没有监听此通道。SDK 异常被静默丢弃。 |
| 3 | **双重 `stream:done`** | 🟢 LOW | `result` 消息产生 `done` 事件 + `finally` 又发送 `stream:done`。`setMessageDone` 幂等，无实际危害。 |

---

### 检查点 4: `adaptMessage` 消息转换 (sdk.ts:98-188)

| SDK 消息类型 | 处理方式 | 产出 AgentEvent |
|-------------|----------|----------------|
| `system.init` | ✅ 正确 | `{ type:'system', subtype:'init', data:{session_id,model,tools} }` |
| `system.*` (其他) | ⚠️ 丢弃 | `[]` — thinking_tokens/status 等被丢弃（设计如此） |
| `stream_event.content_block_delta` | ✅ 正确 | thinking / content 逐字产出 |
| `stream_event.content_block_start` | ✅ 正确 | tool_use |
| `assistant` | ⚠️ 仅子代理 | 仅 `parent_tool_use_id` 为真时产出的 tool_use |
| `user` | ✅ 正确 | tool_result |
| `result` | ✅ 正确 | done + usage/cost |
| 未知类型 | ⚠️ 静默丢弃 | `[]` — SDK 新消息类型可能被遗漏 |

**注意**: `adaptMessage` 从不产生 `{type:'error'}` 事件。ChatArea.tsx:128 的 `case 'error'` 是死代码。

---

### 检查点 5: 渲染进程事件接收 (ChatArea.tsx + preload/index.ts)

```typescript
// preload/index.ts — 暴露给渲染进程的 API
onStreamEvent: (cb) => { ipcRenderer.on('stream:event', handler); return cleanup }
onStreamDone:  (cb) => { ipcRenderer.on('stream:done', handler);  return cleanup }
// ❌ 缺失: onStreamError — 没有 'stream:error' 监听器!
```

**ChatArea.tsx 事件处理**:

| 通道 | 监听 | 状态 |
|------|------|------|
| `stream:event` | ✅ `onStreamEvent` (第102行) | 处理 thinking/content/tool_use/done/error |
| `stream:done` | ✅ `onStreamDone` (第136行) | 处理完成/中断 |
| **`stream:error`** | **❌ 未监听** | **critical bug** |

```typescript
// ChatArea.tsx:102-132 — onStreamEvent 处理的事件类型
switch (event.type) {
  case 'system':     // 设置 activeSessionMeta.sessionId
  case 'thinking':   // appendThinking
  case 'content':    // appendContent
  case 'tool_use':   // addToolUse
  case 'done':       // setMessageDone + setUsage
  case 'error':      // setMessageError ← 死代码! adaptMessage 从不产生此类型
}
```

---

### 检查点 6: `sendUserMessage` (manager.ts:72-91)

```typescript
export async function sendUserMessage(queryId, text, _window) {
  const aq = activeQueries.get(queryId)
  if (!aq) return                                    // ← 静默返回，无错误提示

  aq.handle.query.streamInput(
    (async function* () { yield msg })()
  ).catch(() => {})                                  // ← 🔴 静默吞掉所有 streamInput 错误!
}
```

**问题**: `.catch(() => {})` 吞噬所有 `streamInput` 异常。如果 streamInput 失败（如 Query 已关闭），渲染进程完全不知道消息未送达。

---

### 检查点 7: 多轮对话流程

**第一轮**:
```
User → handleSend() → agent:start → startAgent() → createQuery()
  → sdkQuery(prompt, {opts}) → pumpMessages() (后台)
  → 返回 {pid, sessionId:''}
  → system.init 到达 → handle.sessionId 更新 → stream:event(init) → activeSessionMeta.sessionId 设置
  → 后续消息流 → stream:done → activeQueries.delete(queryId)
```

**第二轮** (在第一轮完成后):
```
User → handleSend() → !isStreaming → 分支到 agent:start
  → 获取 activeSessionMeta.sessionId (已由 system.init 设置)
  → agent:start({..., sessionId: "xxx-xxxx"})
  → createQuery({..., sessionId: "xxx-xxxx"})
  → opts.resume = "xxx-xxxx"  ← ✅ 正确恢复会话
  → 新 Query, 新 pumpMessages
```

**多轮对话在流中** (用户在第一轮未完成时发送):
```
User → handleSend() → isStreaming === true
  → agent:send-message({pid, text})
  → sendUserMessage() → streamInput(gen)  ← ✅ 注入消息到活跃 Query
  → pumpMessages 继续迭代，自然产出回复
```

---

## 三、关键 Bug 汇总

| # | 严重度 | 描述 | 文件:行 | 修复建议 |
|---|--------|------|---------|----------|
| 🔴 1 | **CRITICAL** | `stream:error` 通道无渲染进程监听器 — SDK 运行异常被静默丢弃，UI 卡在 streaming 状态 | preload/index.ts, ChatArea.tsx | 在 preload 添加 `onStreamError`，在 ChatArea 添加 useEffect 监听 `stream:error` |
| 🟡 2 | HIGH | `opts.env` 替换整个子进程环境 — 当 provider 配置了 env 时，PATH/HOME 等关键变量丢失 | sdk.ts:64, ChatArea.tsx:211-215 | 合并 env: `{...process.env, ...params.env}` |
| 🟡 3 | HIGH | `sendUserMessage` 静默吞掉 `streamInput` 所有错误 | manager.ts:88-90 | 至少 log 错误，最佳：发送 `stream:error` |
| 🟡 4 | MEDIUM | `system.init` 发送不完整数据，缺少 model/tools | manager.ts:117 | 复用 adaptMessage 的 init 处理，或补全字段 |
| 🟡 5 | MEDIUM | `pumpMessages` fire-and-forget — 未处理的 rejection 丢失 | manager.ts:59 | 添加 `.catch()` 或 `unhandledRejection` 全局处理 |
| 🟢 6 | LOW | `activeSessionMeta` 被 init 事件覆盖，丢失 pid | ChatArea.tsx:109 | 合并而非替换: `setActiveSessionMeta(prev => ({...prev, sessionId}))` |
| 🟢 7 | LOW | `sessionId: ''` 在 `agent:start` 返回值 — 语义混淆 | sdk.ts:75, manager.ts:61 | 改为不返回 sessionId，或标注为异步获取 |

---

## 四、修复优先级

### 立即修复 (P0)

**Bug #1: 添加 `stream:error` 通道监听**

这是在出现 SDK 错误时 UI 永远卡住的根因。

1. **preload/index.ts** — 添加 `onStreamError`:
```typescript
onStreamError: (cb: (data: unknown) => void) => {
  const handler = (_: unknown, data: unknown) => cb(data)
  ipcRenderer.on('stream:error', handler)
  return () => ipcRenderer.removeListener('stream:error', handler)
},
```

2. **ChatArea.tsx** — 添加 useEffect:
```tsx
useEffect(() => {
  const cleanup = window.api.onStreamError((data: any) => {
    const lastMsg = useChatStore.getState().messages.at(-1)
    const msgId = lastMsg?.id ?? ''
    useChatStore.getState().setMessageError(msgId, data.message)
    setStreaming(false)
  })
  return () => cleanup?.()
}, [])
```

### 短期修复 (P1)

**Bug #2: 修复 env 替换问题**

在 `sdk.ts:64` 将直接赋值改为合并:
```typescript
// 修改前
if (params.env) opts.env = params.env

// 修改后
if (params.env) opts.env = { ...process.env, ...params.env }
```

### 中期改进 (P2)

- **Bug #3**: 修复 `sendUserMessage` 的错误静默吞噬
- **Bug #4**: `system.init` 使用 adaptMessage 的完整数据
- **Bug #5**: 添加 `pumpMessages` 错误处理

---

## 五、验证方法

1. **SDK 独立测试**（已完成）:
```bash
cd /d/Deploy/Warehouse/Aperture
node --input-type=module -e "
import { query } from '@anthropic-ai/claude-agent-sdk'
// ... 验证 query/resume/streamInput
"
```

2. **stream:error 修复后验证**: 在 SDK 选项中设置无效路径触发错误，确认渲染进程收到 error 事件并更新 UI。

3. **多轮对话测试**: 发送两条消息，确认 session 正确恢复（第二条请求的 CPU/Token 应比第一条少）。

4. **env 修复后验证**: 配置 provider 后发送消息，确认 SDK 正常工作。
