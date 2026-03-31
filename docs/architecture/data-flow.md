# 数据流

## App 发起请求的完整流程

```
App (iframe)
  │
  │  postMessage({ id, type, payload })
  ▼
KernelBus.onMessage(event)
  │
  ├─ 1. 校验 event.origin → 查找 AppPermissionContext
  │       未知 origin → 静默丢弃
  │
  ├─ 2. Permission Guard 校验权限
  │       权限不足 → 返回 { error, code: 403 }
  │
  ├─ 3. 路由到对应 Handler
  │       window.*      → WindowManager
  │       data.*        → DataStore
  │       notifications.* → NotificationCenter
  │       theme.*       → ThemeEngine
  │       filesystem.*  → VFS
  │
  ├─ 4. Handler 执行，返回结果
  │
  └─ 5. postMessage 回 App
         { id, result } 或 { id, error, code }
```

---

## DataStore 读写流程

### 写入

```
App.data.collection(ns).insert(record)
  │
  │  postMessage: { type: 'data.insert', namespace, record }
  ▼
KernelBus → Permission Guard (检查 datastore.write:ns)
  │
  ▼
DataStore.insert(ns, record)
  │
  ├─ Zod schema 校验（按 manifest.exposes 定义）
  ├─ 写入 IndexedDB（通过 Dexie）
  ├─ 使内存缓存失效（LRU cache invalidate）
  └─ 通知所有订阅该命名空间的 App
       │
       └─ EventEmitter.emit('data:changed', ns, records)
            │
            └─ postMessage 推送给订阅的 App iframe
```

### 查询

```
App.data.collection(ns).query(filter)
  │
  ▼
KernelBus → Permission Guard (检查 datastore.read:ns)
  │
  ▼
DataStore.query(ns, filter)
  │
  ├─ 检查 LRU 缓存
  │     命中 → 立即返回缓存，后台刷新（stale-while-revalidate）
  │     未命中 → 查询 IndexedDB
  │
  └─ 返回结果给 App
```

---

## 主题变化推送流程

```
用户在 Settings App 修改主题
  │
  ▼
ThemeEngine.setTheme(tokens)
  │
  ├─ 更新系统 CSS 变量（:root）
  ├─ 持久化到 DataStore（com.vidorra.system:theme）
  └─ EventEmitter.emit('theme:changed', tokens)
       │
       └─ 向所有已注册主题订阅的 App 推送
            postMessage({ type: 'event', name: 'theme:changed', payload: tokens })
```

---

## AI Buddy 数据流

```
用户输入
  │
  ▼
BuddyShell (UI)
  │
  ▼
BuddyCore
  │
  ├─ 构建系统上下文（当前聚焦 App、窗口列表、DataStore schema）
  ├─ 调用 AI API（流式）
  │
  └─ AI 返回工具调用
       │
       ▼
     ToolExecutor
       │
       ├─ 展示确认弹窗（用户确认）
       ├─ 以 com.vidorra.buddy 身份发起 KernelBus 请求
       └─ 经过完整的 Permission Guard 校验
```

---

## 事件总线（宿主侧）

宿主侧的 EventEmitter 不经过 postMessage，直接在 JS 内部传递：

```ts
// 内核模块间通信（同一 JS 上下文）
eventBus.on('app:focused', (appId) => {
  menubar.loadAppMenu(appId)
  shortcutManager.activateAppShortcuts(appId)
})

eventBus.on('window:closed', (windowId) => {
  cleanupRegistry.cleanup(windowId)
})
```

跨 iframe 的事件推送才走 postMessage（通过 KernelBus 的 EventEmitter 模块）。
