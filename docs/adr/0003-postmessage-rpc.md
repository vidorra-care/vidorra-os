# ADR-0003 postMessage RPC 协议

**状态**：已采纳
**日期**：2026-03

## 背景

iframe 与宿主页面的通信只能通过 postMessage。需要设计一个可靠的请求/响应协议。

## 决策

自研 KernelBus，实现双向 RPC over postMessage。

## 协议设计

**请求**：`{ id: uuid, type: string, payload: unknown }`
**响应**：`{ id: uuid, result: unknown }` 或 `{ id: uuid, error: string, code: number }`
**推送**：`{ type: 'event', name: string, payload: unknown }`（无 id）

## 关键决策点

**用 UUID 而非自增 ID**：
- 防止不同 App 的请求 ID 冲突
- 无需维护全局计数器

**用 AbortController 管理超时**：
- 比 setTimeout + clearTimeout 更干净
- 可以被外部取消（用户关闭 App 时取消所有 pending 请求）

**origin 鉴权而非 appId 鉴权**：
- `event.data.appId` 可以被伪造
- `event.origin` 由浏览器保证，不可伪造
- 在 App 安装时建立 `origin → appId` 映射

**静默丢弃未知 origin**：
- 不返回错误，防止攻击者探测系统
- 只在开发模式下打印警告

## 备选方案

**使用现有 RPC 库（comlink 等）**：
- comlink 功能强大，但不支持权限拦截
- 我们需要在每个请求上做权限校验，自研更灵活
- 放弃原因：无法在中间层插入权限校验

**BroadcastChannel**：
- 不支持跨 origin，放弃
