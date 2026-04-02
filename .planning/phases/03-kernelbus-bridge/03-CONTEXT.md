# Phase 3: KernelBus (Bridge) - Context

**Gathered:** 2026-04-02
**Status:** Ready for planning

<domain>
## Phase Boundary

实现 Shell 与 App iframe 之间的 postMessage RPC 通信层：

- **Shell 侧** — `KernelBusHost`：监听 `message` 事件，验证来源，分发到对应 window 操作，返回 response
- **App 侧** — `KernelBusClient`（存根，供 Phase 4 SDK 消费）：发送 request，等待 response，超时 reject

**不包含：** SDK 的 `createApp` 和用户端 API（Phase 4）、任何 App 内部功能（Phase 5）。

</domain>

<decisions>
## Implementation Decisions

### 信任模型（BUS-01）
- **D-01:** `app.ready` 消息触发信任授权 — iframe 打开后默认不可信；App iframe 必须先发送 `{ method: 'app.ready' }` 消息，Shell 才将该 `contentWindow` 加入白名单；白名单之外的所有消息静默丢弃
- **D-02:** Shell 需要在 `WindowFrame` 中通过 `ref` 获取每个 iframe 的 `contentWindow`，注册到 `KernelBusHost` 维护的 `Map<WindowProxy, windowId>` 中
- **D-03:** 窗口关闭时，对应 `contentWindow` 从白名单中移除

### 支持的 RPC 方法（BUS-02）
App iframe 可调用的方法（通过 postMessage 发送 `KernelBusMessage`）：
- `window.setTitle(title: string)` → 更新 `useWindowStore` 中对应窗口的 title
- `window.close()` → 调用 `closeWindow(windowId)`
- `window.minimize()` → 调用 `setWindowState(windowId, 'minimized')`
- `window.maximize()` → 调用 `toggleMaximize(windowId)`
- `window.resize({ width, height })` → 调用 `setWindowRect` 更新尺寸（保持当前位置）
- `theme.get()` → 返回 `themeEngine.getResolvedMode()`（`'light' | 'dark'`）

### 主题推送（BUS-02 扩展）
- **D-04:** 除 `theme.get`（pull）外，Shell 还需支持主题变化推送（push）
- **D-05:** 当 `ThemeEngine` 触发变化时，`KernelBusHost` 向所有受信 iframe 主动发送 `{ type: 'push', method: 'theme.changed', params: { mode: 'light' | 'dark' } }` 通知消息（无 requestId）
- **D-06:** Push 通知与 Request/Response 消息通过有无 `requestId` 字段区分：有 requestId = RPC 调用；无 requestId = 单向推送

### Request/Response 协议（BUS-03）
- **D-07:** 每个请求必须包含 `requestId: string`（UUID 或递增 ID），Shell 在 response 中原样返回
- **D-08:** Response 结构：`{ requestId, result? }` 成功 或 `{ requestId, error: string }` 失败
- **D-09:** `KernelBusMessage` 和 `KernelBusResponse` 类型已在 `packages/types/src/kernel-bus.ts` 定义，直接使用，如需扩展（push 通知格式）在 types 包中追加

### 错误处理
- **D-10:** 未授权来源（不在白名单中的 `contentWindow`）— 静默丢弃，不发送任何 response
- **D-11:** 已授权来源调用未知 method — 返回 `{ requestId, error: 'Unknown method: <method>' }`
- **D-12:** `app.ready` 本身不返回 response（单向信号）

### 超时（BUS-04）
- **D-13:** 客户端（`KernelBusClient`）发出请求后，5 秒内未收到匹配 `requestId` 的 response 则 `Promise.reject(new Error('KernelBus timeout: <method>'))`

### 测试策略
- **D-14:** `KernelBusHost` 和 `KernelBusClient` 使用 Vitest + `vi.fn()` mock `window.postMessage` / `window.addEventListener` 进行纯单元测试
- **D-15:** 不在 Phase 3 实现 iframe 级集成测试；集成验证留到 Phase 6 E2E（Playwright）
- **D-16:** 测试文件与源文件并置（co-located `.test.ts`）

### 代码位置
- `KernelBusHost` → `packages/kernel/src/kernel-bus-host.ts`（类 + 单例导出，与 AppRegistry/ThemeEngine 模式一致）
- `KernelBusClient` → `packages/kernel/src/kernel-bus-client.ts`（Class，供 Phase 4 SDK 实例化）
- 新增类型（如 push 通知格式）→ `packages/types/src/kernel-bus.ts`
- `WindowFrame` 需增加 `iframeRef`，在 mount 时调用 `kernelBusHost.registerFrame(windowId, contentWindow)`，unmount 时调用 `unregisterFrame(windowId)`

### Claude's Discretion
- requestId 生成方式（`crypto.randomUUID()` 或简单递增计数器）
- `KernelBusHost` 内部的 `Map` 数据结构细节
- ThemeEngine 订阅的具体解绑时机

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### 类型定义
- `packages/types/src/kernel-bus.ts` — `KernelBusMessage`、`KernelBusResponse` 类型，Phase 3 直接使用并按需扩展
- `packages/types/src/window.ts` — `WindowDescriptor`、`WindowState`、`WindowRect` 类型
- `packages/types/src/manifest.ts` — `AppManifest` 类型

### 现有核心模块
- `packages/kernel/src/app-registry.ts` — `AppRegistry` 类 + `appRegistry` 单例，代码结构参考
- `packages/kernel/src/theme-engine.ts` — `ThemeEngine` 类，`subscribe(cb)` 方法供 KernelBusHost 订阅主题变化
- `packages/kernel/src/index.ts` — kernel 包导出模式（需新增 KernelBusHost / Client 导出）

### Shell 集成点
- `packages/shell/src/components/WindowFrame/WindowFrame.tsx` — 当前 iframe 渲染位置，需增加 ref 和 register/unregister 调用
- `packages/shell/src/stores/useWindowStore.ts` — 已有 `setWindowState`, `setWindowRect`, `closeWindow`, `focusWindow` 等 action，KernelBusHost 直接调用

### 整体设计参考
- `docs/plans/mvp-plan.md` — MVP 规划，Phase 3 Bridge 节
- `.planning/REQUIREMENTS.md` — BUS-01 ~ BUS-04 需求原文

### 无外部 spec（协议由本 context 完整定义）

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `packages/types/src/kernel-bus.ts`：`KernelBusMessage` / `KernelBusResponse` 接口已定义，直接使用
- `packages/kernel/src/theme-engine.ts`：`subscribe(cb)` 返回 unsubscribe 函数，KernelBusHost 可订阅主题变化推送给 iframe
- `packages/shell/src/stores/useWindowStore.ts`：`setWindowState`, `setWindowRect`, `closeWindow`, `toggleMaximize` 已实现，KernelBusHost 调用即可；`setTitle` 需确认是否存在（可能需补充）

### Established Patterns
- 类 + 单例导出（`class X + export const x = new X()`）— AppRegistry、ThemeEngine 已验证
- TypeScript strict 模式，无 `any`
- Co-located `.test.ts` 文件
- happy-dom 环境（`packages/kernel/vitest.config.ts`）

### Integration Points
- `WindowFrame.tsx`：iframe `ref` 缺失，需增加 `React.useRef<HTMLIFrameElement>` 并在 effect 中调用 `kernelBusHost.registerFrame` / `unregisterFrame`
- `packages/kernel/src/index.ts`：需导出 `KernelBusHost`、`kernelBusHost`、`KernelBusClient`
- Shell 入口 `packages/shell/src/main.tsx`：可能需在启动时初始化 `kernelBusHost`（挂载全局 `message` 监听器）

</code_context>

<specifics>
## Specific Ideas

- 消息协议以 `requestId` 有无区分 RPC（双向）和 push（单向）
- 白名单存储为 `Map<WindowProxy, string>`（contentWindow → windowId），窗口关闭时清理
- `app.ready` 是单向信号，无需 response
- `KernelBusClient` Phase 3 只需实现核心 `send(method, params)` 方法（返回 Promise），Phase 4 SDK 在其上封装 `app.window.*` / `app.theme.*` 高层 API

</specifics>

<deferred>
## Deferred Ideas

- `theme.subscribe` SDK 端 API 封装 — Phase 4（Phase 3 实现 Shell 侧推送即可）
- 多窗口同一 origin 的精细权限控制 — 暂不需要，白名单按 contentWindow 实例区分
- 消息队列 / 重试机制 — YAGNI，MVP 阶段不需要
- Permission guard for app installs — 来自 Phase 1 deferred，仍延迟

</deferred>

---

*Phase: 03-kernelbus-bridge*
*Context gathered: 2026-04-02*
