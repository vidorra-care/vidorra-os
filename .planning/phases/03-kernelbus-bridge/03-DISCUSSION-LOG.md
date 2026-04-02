# Phase 3: KernelBus (Bridge) - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-02
**Phase:** 03-kernelbus-bridge
**Areas discussed:** 信任模型, 主题订阅, 错误处理, 测试策略

---

## 信任模型（Trust model）

| Option | Description | Selected |
|--------|-------------|----------|
| app.ready 授权信任 | iframe 先发 app.ready → Shell 把该 contentWindow 加入白名单 → 后续方法调用才有效。更安全，BUS-01 原文意图。 | ✓ |
| 打开即信任 | openWindow 时就把 origin 放入白名单，app.ready 只是生命周期通知。简单但信任边界较松。 | |

**User's choice:** app.ready 授权信任
**Notes:** 白名单按 `contentWindow` 实例存储（Map<WindowProxy, windowId>），窗口关闭时清理

---

## 主题订阅（Theme subscription）

| Option | Description | Selected |
|--------|-------------|----------|
| pull 只读 | theme.get 返回当前值即可，App 主动查询。Phase 3 范围内实现小。 | |
| pull + push | theme.get + Shell 在主题切换时主动推送给所有受信 iframe。App 能实时响应。SDK 层需要对应 API。 | ✓ |

**User's choice:** pull + push
**Notes:** 推送消息格式 `{ type: 'push', method: 'theme.changed', params: { mode } }`，无 requestId；与 RPC 消息通过 requestId 有无区分

---

## 错误处理（Error handling）

| Option | Description | Selected |
|--------|-------------|----------|
| 来源丢弃，方法报错 | 未授权来源：静默丢弃（不露出 shell 内部信息）。未知 method：返回 error response（客户端 Promise.reject）。 | ✓ |
| 所有失败都报错 | 少一个分支，但会泄露信息给未知调用方。 | |
| 全部静默丢弃 | 调试困难。 | |

**User's choice:** 来源丢弃，方法报错
**Notes:** 未知方法 error 格式：`{ requestId, error: 'Unknown method: <method>' }`；app.ready 本身不返回 response

---

## 测试策略（Testing strategy）

| Option | Description | Selected |
|--------|-------------|----------|
| 单元测试 + 延迟集成 | vi.fn() mock postMessage，Vitest 对 KernelBusHost 进行纯单元测试；集成验证留到 Phase 6 E2E。最小配置。 | ✓ |
| happy-dom 集成测试 | happy-dom + MockMessageChannel 模拟双向通信，写集成级别测试。更真实但配置工作量大。 | |
| Playwright E2E | 测试整个 postMessage 链路。最真实，但 Phase 3 配置成本高，建议留到 Phase 6。 | |

**User's choice:** 单元测试 + 延迟集成
**Notes:** 测试文件与源文件并置 (.test.ts)，使用 happy-dom 环境（与 kernel 包一致）

---

## Claude's Discretion

- requestId 生成方式（crypto.randomUUID 或递增计数器）
- KernelBusHost 内部 Map 数据结构细节
- ThemeEngine 订阅的具体解绑时机

## Deferred Ideas

- theme.subscribe SDK 端 API 封装 — Phase 4
- 多窗口同 origin 精细权限控制 — 暂不需要
- 消息队列/重试机制 — YAGNI
