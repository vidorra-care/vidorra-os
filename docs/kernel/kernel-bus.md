# KernelBus

## 职责

KernelBus 是 App 与内核之间的唯一通信通道。所有跨 iframe 的请求和响应都经过它。

---

## 消息格式

### App → Kernel（请求）

```ts
interface KernelRequest {
  id: string          // 唯一请求 ID，用于匹配响应
  type: string        // 消息类型，如 'window.setTitle'
  payload: unknown    // 请求参数
}
```

### Kernel → App（响应）

```ts
type KernelResponse =
  | { id: string; result: unknown }           // 成功
  | { id: string; error: string; code: number } // 失败

// 主动推送（无 id）
interface KernelEvent {
  type: 'event'
  name: string        // 如 'theme:changed', 'menu:action'
  payload: unknown
}
```

---

## 请求生命周期

```
App 调用 SDK 方法
  → SDK 生成唯一 id
  → postMessage 发送请求
  → 等待响应（AbortController 超时控制）
  → 收到响应，resolve 或 reject Promise
```

超时默认 5000ms，可按消息类型配置：

```ts
const TIMEOUT_BY_TYPE: Record<string, number> = {
  'data.query':   10000,  // 大数据集查询给更多时间
  'window.*':     2000,   // 窗口操作应该很快
  'default':      5000,
}
```

---

## 所有消息类型

### 窗口控制

| type | payload | 说明 |
|------|---------|------|
| `window.setTitle` | `{ title: string }` | 设置窗口标题 |
| `window.resize` | `{ width, height }` | 调整窗口大小 |
| `window.requestFullscreen` | `{}` | 请求全屏 |
| `window.exitFullscreen` | `{}` | 退出全屏 |
| `window.minimize` | `{}` | 最小化 |
| `window.focus` | `{}` | 聚焦窗口 |
| `window.createChild` | `{ url, title, modal, size }` | 创建子窗口 |
| `window.close` | `{}` | 关闭窗口 |
| `window.getRect` | `{}` | 获取当前窗口尺寸和位置 |

### 通知

| type | payload | 说明 |
|------|---------|------|
| `notifications.send` | `{ title, body, icon?, onClick? }` | 发送通知 |

### 数据层

| type | payload | 说明 |
|------|---------|------|
| `data.query` | `{ namespace, filter?, orderBy?, limit? }` | 查询记录 |
| `data.insert` | `{ namespace, record }` | 插入记录 |
| `data.update` | `{ namespace, id, patch }` | 更新记录 |
| `data.delete` | `{ namespace, id }` | 删除记录 |
| `data.subscribe` | `{ namespace, subscriptionId }` | 订阅变化 |
| `data.unsubscribe` | `{ subscriptionId }` | 取消订阅 |

### 主题

| type | payload | 说明 |
|------|---------|------|
| `theme.get` | `{}` | 获取当前主题 |
| `theme.subscribe` | `{ subscriptionId }` | 订阅主题变化 |

### Spotlight

| type | payload | 说明 |
|------|---------|------|
| `spotlight.register` | `{ actions }` | 注册 Spotlight 动作（manifest 已声明时自动注册） |

---

## 错误码

| code | 含义 |
|------|------|
| 400 | 请求格式错误（payload 校验失败） |
| 403 | 权限不足 |
| 404 | 资源不存在 |
| 408 | 请求超时 |
| 500 | 内核内部错误 |

---

## 相关文档

- [KernelBus API 参考](../api/kernel-bus-api.md)
- [安全模型](../architecture/security-model.md)
- [ADR-0003 postMessage RPC 设计](../adr/0003-postmessage-rpc.md)
