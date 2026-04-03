# Phase 4: SDK v0.1 - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-03
**Phase:** 04-sdk-v01
**Areas discussed:** Bundle & 打包方式, SDK ↔ kernel 依赖, createApp() API shape, Theme 订阅 API

---

## Bundle & 打包方式

| Option | Description | Selected |
|--------|-------------|----------|
| Vite lib 模式产出（推荐） | packages/sdk 加 Vite lib build，产出 dist/vidorra-sdk.js（ESM）+ dist/vidorra-sdk.d.ts | ✓ |
| 纯 tsc 编译，不打包 | 只 tsc 生成 dist/index.js，无 treeshake / 无依赖内联 | |
| 双产物（ESM + IIFE） | Vite 同时产出 ES module 和 IIFE（script 全局变量） | |

**User's choice:** Vite lib 模式产出

**Follow-up — dist 目录**

| Option | Description | Selected |
|--------|-------------|----------|
| dist/ 目录，提交 git | 方便 CI 验证 bundle size | |
| dist/ 目录，不提交 git | 只推源码；构建产物在 CI 或使用前按需生成 | ✓ |

**User's choice:** dist/ 不提交 git

---

## SDK ↔ kernel 依赖

| Option | Description | Selected |
|--------|-------------|----------|
| 依赖 @vidorra/kernel，直接 import | packages/sdk 直接 import { KernelBusClient } from '@vidorra/kernel' | |
| 内联精简版 BusClient，不依赖 kernel | packages/sdk/src 内写一份极简 BusClient，只抄 send/sendReady/onPush | |
| 重构成共享包 @vidorra/bus | KernelBusClient 从 kernel 包移到新的 @vidorra/bus，sdk 和 kernel 共用 | ✓ |

**User's choice:** 重构成共享包 @vidorra/bus

**Follow-up — 包层次位置**

| Option | Description | Selected |
|--------|-------------|----------|
| 新建 packages/bus | packages/bus/src/index.ts 只导出 KernelBusClient 和相关类型 | ✓ |
| 移到 @vidorra/types（不新增包） | 直接将 kernel-bus-*.ts 移入 packages/types，类型与运行时逻辑混放 | |
| @vidorra/kernel/bus 小路径导出 | kernel 保持现有导出，加一个子路径 @vidorra/kernel/bus | |

**User's choice:** 新建 packages/bus

---

## createApp() API Shape

| Option | Description | Selected |
|--------|-------------|----------|
| 嵌套命名空间（app.window.* / app.theme.*） | app.window.setTitle() / app.theme.get() 等分组 | ✓ |
| 平层命名（app.setTitle、app.getTheme…） | 方法全部挂在 app 顶层，无命名空间 | |

**User's choice:** 嵌套命名空间

**Follow-up — app.ready() 返回类型**

| Option | Description | Selected |
|--------|-------------|----------|
| app.ready() 返回 Promise<void> | 发送信号后立即 resolve，与其他 API 调用一致 | ✓ |
| app.ready() 返回 void（同步） | 更语义直白，但没有 await 是否成功的反馈 | |

**User's choice:** Promise<void>

**Follow-up — TypeScript 类型导出**

| Option | Description | Selected |
|--------|-------------|----------|
| 导出 VidorraApp 接口 + 全量 JSDoc | createApp() 返回类型为 VidorraApp，全量文档注释 | ✓ |
| 不导出类型，靠推断 | 返回类型直接用内联小案（infer），开发者依赖 IDE 自动推断 | |

**User's choice:** 导出 VidorraApp 接口 + 全量 JSDoc

---

## Theme 订阅 API

| Option | Description | Selected |
|--------|-------------|----------|
| app.theme.onChange(cb) 订阅推送 | 依赖 KernelBusClient.onPush()，开发者无需轮询 | ✓ |
| 只有 app.theme.get()，不订阅 | 最简单，但主题变化时 App 无法实时响应 | |

**User's choice:** app.theme.onChange(cb) 订阅推送

**Follow-up — app.theme.get() 返回类型**

| Option | Description | Selected |
|--------|-------------|----------|
| Promise<'light' \| 'dark'> | 与其他 RPC 方法一致 | ✓ |
| 同步返回（内部缓存） | 依赖 SDK 缓存最近一次 onChange 的值 | |

**User's choice:** Promise<'light' | 'dark'>

---

## Claude's Discretion

- `VidorraApp` 是类（class）还是普通对象（POJO）——实现细节，Claude 决定
- `@vidorra/bus` 包内部模块拆分方式
- `app.window.resize` 参数形式（positional vs 对象）——与 KernelBusClient 一致即可

## Deferred Ideas

- `app.window.focus()` API — Phase 5/6 按需
- `app.storage.*` 跨 App 数据层 — v2 DataStore
- `app.notification.*` — v2 Notifications
- SDK CDN 发布 — MVP 后
