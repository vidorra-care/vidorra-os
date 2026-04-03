# Phase 4: SDK v0.1 - Context

**Gathered:** 2026-04-03
**Status:** Ready for planning

<domain>
## Phase Boundary

创建 `@vidorra/sdk` 包，向外暴露开发者友好的 `createApp()` API，内部封装 `KernelBusClient` 通信层。

**包含：**
- 新建 `packages/bus` — 将 `KernelBusClient` 和 bus 相关类型从 `@vidorra/kernel`/`@vidorra/types` 迁移至此公共包
- 实现 `createApp()` 返回 `VidorraApp` 对象（嵌套命名空间：`app.ready()`, `app.window.*`, `app.theme.*`）
- Vite lib build，产出 `dist/vidorra-sdk.js` (ESM) + `dist/index.d.ts`；`dist/` 不提交 git
- 满足 SDK-01–SDK-04（bundle ≤ 8 KB gzip，全量 TypeScript 类型）

**不包含：**
- App 内部功能实现（Phase 5）
- E2E 集成测试（Phase 6）
- 任何 Shell 侧修改（Shell 已在 Phase 3 完成 KernelBusHost 接入）

</domain>

<decisions>
## Implementation Decisions

### @vidorra/bus 重构（先决步骤）
- **D-01:** 新建 `packages/bus` 包（`@vidorra/bus`），从 `@vidorra/kernel` 移走 `KernelBusClient`，从 `@vidorra/types` 移走 `KernelBusMessage / KernelBusResponse / KernelBusPush`
- **D-02:** `@vidorra/kernel` 改为依赖 `@vidorra/bus`（保持现有 KernelBusHost 可以 import KernelBusClient 类型）；`@vidorra/types` 的 `kernel-bus.ts` 可保留 re-export 或删除，以保持向后兼容
- **D-03:** `@vidorra/sdk` 依赖 `@vidorra/bus`，不依赖 `@vidorra/kernel`（避免 AppRegistry/ThemeEngine 等 Shell 专属逻辑进入 SDK bundle）
- **D-04:** `@vidorra/bus` 是纯 TypeScript，无框架依赖，环境 `happy-dom`（与现有 kernel 测试策略一致）

### createApp() API 设计
- **D-05:** `createApp()` 返回 `VidorraApp` 接口实例（具名导出类型），构造时立刻实例化 `KernelBusClient` 并调用 `client.init()`
- **D-06:** API 采用嵌套命名空间：
  ```typescript
  const app = createApp()
  await app.ready()              // 发送 app.ready 信号，返回 Promise<void>
  await app.window.setTitle('My App')
  await app.window.close()
  await app.window.minimize()
  await app.window.maximize()
  await app.window.resize(800, 600)
  const mode = await app.theme.get()  // Promise<'light' | 'dark'>
  const unsub = app.theme.onChange((mode) => { ... })  // 返回取消订阅函数
  ```
- **D-07:** `app.ready()` 返回 `Promise<void>`（发送信号后立即 resolve，无需 Shell 确认——`app.ready` 是单向信号）
- **D-08:** `app.window.*` 所有方法均返回 `Promise<void>`（或对应值），内部调用 `KernelBusClient.send()`
- **D-09:** `app.theme.get()` 返回 `Promise<'light' | 'dark'>`，内部调用 `KernelBusClient.send('theme.get')`
- **D-10:** `app.theme.onChange(cb)` 订阅 Shell 推送，内部调用 `KernelBusClient.onPush()`，仅转发 `method === 'theme.changed'` 的消息；返回取消订阅函数

### TypeScript 类型导出
- **D-11:** 导出具名接口 `VidorraApp`、`VidorraWindow`、`VidorraTheme`，附全量 JSDoc
- **D-12:** 所有类型从 `@vidorra/sdk` 顶层导出，用户无需额外 import 子路径

### Bundle 配置
- **D-13:** `packages/sdk` 用 Vite 的 `lib` 模式构建：
  - `entry: 'src/index.ts'`
  - `formats: ['es']`，输出 `dist/vidorra-sdk.js`
  - `rollupOptions.external: []`（将 `@vidorra/bus` 依赖内联进 bundle，保证 < 8 KB 自包含）
  - TypeScript declarations 通过 `vite-plugin-dts` 或 `tsc --declaration` 生成 `dist/index.d.ts`
- **D-14:** `packages/sdk/package.json` exports：
  ```json
  {
    "exports": {
      ".": {
        "types": "./dist/index.d.ts",
        "default": "./dist/vidorra-sdk.js"
      }
    }
  }
  ```
- **D-15:** `dist/` 加入 `.gitignore`；CI/构建前需先 `pnpm --filter @vidorra/sdk build`
- **D-16:** SDK-04 要求 bundle ≤ 8 KB gzip —— 构建后用 `gzip -c dist/vidorra-sdk.js | wc -c` 验证

### 测试策略
- **D-17:** `packages/sdk` 单元测试：mock `KernelBusClient`（`vi.mock('@vidorra/bus')`），验证 `createApp()` 是否正确调用 `client.send()` / `client.sendReady()` / `client.onPush()`
- **D-18:** `packages/bus` 单元测试：与现有 `kernel-bus-client.test.ts` 相同策略（happy-dom，fake timers）；迁移后原测试文件随模块一起移动

### Claude's Discretion
- `VidorraApp` 是类（class）还是普通对象（POJO）——保持实现细节灵活
- `@vidorra/bus` 包内部模块拆分方式
- `app.window.resize` 参数形式（positional `(w, h)` vs 对象 `{ width, height }`）——与 KernelBusClient 参数保持一致即可

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### 现有 KernelBus 实现（迁移来源）
- `packages/kernel/src/kernel-bus-client.ts` — 完整 KernelBusClient 实现，迁移至 @vidorra/bus
- `packages/kernel/src/kernel-bus-client.test.ts` — 配套测试，随模块迁移
- `packages/kernel/src/kernel-bus-host.ts` — KernelBusHost，依赖 KernelBusClient 类型；迁移后需更新 import
- `packages/kernel/src/index.ts` — 迁移后需移除 KernelBusClient 导出
- `packages/types/src/kernel-bus.ts` — KernelBusMessage / KernelBusResponse / KernelBusPush，迁移至 @vidorra/bus

### 现有 SDK 存根
- `packages/sdk/src/index.ts` — 当前空存根，Phase 4 从这里展开
- `packages/sdk/package.json` — 需补充 scripts.build、scripts.test、dependencies（@vidorra/bus）

### 需求原文
- `.planning/REQUIREMENTS.md` §SDK — SDK-01 ~ SDK-04 完整验收标准

### 设计参考
- `.planning/phases/03-kernelbus-bridge/03-CONTEXT.md` — Phase 3 决策（D-07: requestId, D-08: response 格式, D-09: 类型位置, D-13: 5s 超时）
- `packages/kernel/src/kernel-bus-host.ts` — KernelBusHostCallbacks 接口（app.window.* 方法映射关系）

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `KernelBusClient`（`packages/kernel/src/kernel-bus-client.ts`）：整体迁移至 `@vidorra/bus`，SDK 直接使用
- `KernelBusPush / KernelBusMessage / KernelBusResponse`（`packages/types/src/kernel-bus.ts`）：迁移至 `@vidorra/bus/src/types.ts`
- `packages/sdk/src/index.ts`：空存根，可直接扩展

### Established Patterns
- TypeScript strict，无 `any`
- 类 + 单例导出（kernel 层）—— SDK 用 `createApp()` 工厂函数，不导出单例（一个 App 进程对应一个 client 实例）
- Vite lib build（参考 shell 的 vite.config.ts）
- Co-located `.test.ts` 文件；happy-dom 环境

### Integration Points
- `packages/sdk` → `@vidorra/bus`（新建依赖）
- `packages/kernel` → `@vidorra/bus`（替换原有 KernelBusClient 内部 import，KernelBusHost 测试需更新 mock 路径）
- `packages/types`：`kernel-bus.ts` 可选删除或 re-export（待规划阶段决定兼容策略）
- `pnpm-workspace.yaml`：需确认 `packages/bus` 已纳入工作区

</code_context>

<specifics>
## Specific Ideas

- `createApp()` 工厂函数（非单例）：每次调用创建新的 `KernelBusClient` 实例并 `init()`
- `app.ready()` 发送 `app.ready` 单向信号后立即 `resolve()`，不等待 Shell 回应
- `app.theme.onChange(cb)` 内部只传递 `method === 'theme.changed'` 的 push 消息，过滤其他 push 类型

</specifics>

<deferred>
## Deferred Ideas

- `app.window.focus()` API —— Phase 5 或 Phase 6 按需补充
- `app.storage.*` 跨 App 数据层 —— v2 DataStore 阶段（DS-01, DS-02）
- `app.notification.*` —— v2 Notifications 阶段（NOTF-01）
- SDK CDN 发布（unpkg / jsDelivr 路由）—— MVP 后，阶段 6 集成测试通过后考虑

</deferred>

---

*Phase: 04-sdk-v01*
*Context gathered: 2026-04-03*
