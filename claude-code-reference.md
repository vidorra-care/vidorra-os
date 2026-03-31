# Claude Code 源码对 Vidorra OS 的具体借鉴

> 基于对 `@anthropic-ai/claude-code@2.1.88` 还原源码的深度阅读，
> 结合 Vidorra OS（WebOS）的产品设计文档，整理出可直接落地的参考点。

---

## 1. KernelBus — postMessage RPC 设计

### 问题
你的 KernelBus 需要实现双向 RPC：App 发请求，宿主响应；宿主也可以主动推送事件给 App。
如何管理 pending 请求、超时、错误？

### Claude Code 的做法（MCP client transport）

```ts
// 核心模式：用 Map 管理 pending 请求
type PendingRequest = {
  resolve: (value: unknown) => void
  reject: (reason: Error) => void
  abortController: AbortController
}

class KernelBus {
  private pending = new Map<string, PendingRequest>()

  async request<T>(appId: AppId, method: string, params: unknown, timeout = 5000): Promise<T> {
    const id = crypto.randomUUID()
    const abortController = new AbortController()

    // 超时用 AbortController，不用 setTimeout + clearTimeout
    const timeoutId = setTimeout(() => {
      abortController.abort(new Error(`KernelBus timeout: ${method}`))
    }, timeout)

    return new Promise<T>((resolve, reject) => {
      this.pending.set(id, { resolve, reject, abortController })

      abortController.signal.addEventListener('abort', () => {
        this.pending.delete(id)
        clearTimeout(timeoutId)
        reject(abortController.signal.reason)
      })

      // 发送到 iframe
      this.sendToApp(appId, { id, method, params })
    })
  }

  // 收到 iframe 响应时调用
  handleResponse(id: string, result: unknown, error?: string) {
    const pending = this.pending.get(id)
    if (!pending) return
    this.pending.delete(id)
    if (error) pending.reject(new Error(error))
    else pending.resolve(result)
  }
}
```

### 关键点
- **不要用 `setTimeout` + `clearTimeout` 手动管理超时**，用 `AbortController`，可以被外部取消
- pending Map 的 key 是请求 ID，不是 appId，同一个 App 可以并发多个请求
- 响应时先 `delete` 再 `resolve`，防止重复响应

---

## 2. Permission Guard — 权限鉴权的不可变上下文

### 问题
App 通过 postMessage 发来请求时，如何确保权限校验不被绕过？

### Claude Code 的做法（ToolPermissionContext + DeepImmutable）

```ts
// 权限上下文在 App 安装时创建，运行时只读
type DeepImmutable<T> = {
  readonly [K in keyof T]: T[K] extends object ? DeepImmutable<T[K]> : T[K]
}

interface AppPermissionContext {
  readonly appId: AppId
  readonly origin: string           // 来自 manifest.entry 的 origin，不信任 App 自报
  readonly grantedPermissions: ReadonlySet<string>
  readonly sandboxFlags: ReadonlyArray<SandboxFlag>
}

// Permission Guard 核心逻辑
class PermissionGuard {
  // origin → context 映射，在宿主侧维护
  private contexts = new Map<string, DeepImmutable<AppPermissionContext>>()

  check(event: MessageEvent, requiredPermission: string): boolean {
    // 关键：用 event.origin 查找，不信任 event.data.appId
    const ctx = this.contexts.get(event.origin)
    if (!ctx) return false  // 未注册的 origin 一律拒绝
    return ctx.grantedPermissions.has(requiredPermission)
  }
}
```

### 三级权限规则（直接对应你的 manifest.permissions）

```ts
type PermissionRule =
  | { type: 'alwaysAllow'; pattern: string }   // 无需弹窗，如 window.setTitle
  | { type: 'alwaysDeny';  pattern: string }   // 永远拒绝，如访问其他 App 私有数据
  | { type: 'alwaysAsk';   pattern: string }   // 安装时弹窗确认

const PERMISSION_RULES: PermissionRule[] = [
  { type: 'alwaysAllow', pattern: 'window.*' },
  { type: 'alwaysAllow', pattern: 'notifications.send' },
  { type: 'alwaysAsk',   pattern: 'datastore.read:*' },
  { type: 'alwaysAsk',   pattern: 'datastore.write:*' },
  { type: 'alwaysDeny',  pattern: 'datastore.write:com.global:*' },  // 全局数据只读
]
```

### 关键点
- **永远用 `event.origin` 鉴权，不用 `event.data.appId`**，后者可以被伪造
- 权限上下文用 `DeepImmutable` 包装，防止运行时被修改
- 权限规则集中管理，不散落在各个 handler 里

---

## 3. DataStore 缓存层 — LRU + 字节限制

### 问题
DataStore 基于 IndexedDB，频繁读取会有性能问题。如何设计内存缓存层？

### Claude Code 的做法（FileStateCache）

```ts
import { LRUCache } from 'lru-cache'

class DataStoreCache {
  private cache: LRUCache<string, unknown>

  constructor() {
    this.cache = new LRUCache({
      max: 500,                    // 最多 500 条记录
      maxSize: 25 * 1024 * 1024,  // 最多 25MB
      sizeCalculation: (value) => {
        return JSON.stringify(value).length * 2  // UTF-16 估算字节数
      },
      ttl: 1000 * 60 * 5,         // 5 分钟 TTL
    })
  }

  // 命名空间归一化：防止 "budget:tx" 和 "budget:tx/" 被视为不同 key
  private normalizeKey(namespace: string, query: unknown): string {
    return `${namespace.toLowerCase().replace(/\/$/, '')}:${JSON.stringify(query)}`
  }

  get(namespace: string, query: unknown): unknown | undefined {
    return this.cache.get(this.normalizeKey(namespace, query))
  }

  set(namespace: string, query: unknown, value: unknown): void {
    this.cache.set(this.normalizeKey(namespace, query), value)
  }

  // 写入时使缓存失效（精确到命名空间）
  invalidate(namespace: string): void {
    for (const key of this.cache.keys()) {
      if (key.startsWith(namespace.toLowerCase())) {
        this.cache.delete(key)
      }
    }
  }
}
```

### TTL 缓存 + 后台刷新（用于实时订阅）

```ts
// Claude Code 的 memoizeWithTTL 模式
// 先返回旧缓存，后台刷新，兼顾速度和新鲜度
async function queryWithStaleWhileRevalidate(namespace: string, filter: unknown) {
  const cached = cache.get(namespace, filter)

  if (cached) {
    // 后台刷新，不阻塞返回
    queryIndexedDB(namespace, filter).then(fresh => {
      cache.set(namespace, filter, fresh)
      notifySubscribers(namespace, fresh)  // 通知实时订阅者
    })
    return cached
  }

  // 无缓存时同步等待
  const result = await queryIndexedDB(namespace, filter)
  cache.set(namespace, filter, result)
  return result
}
```

---

## 4. manifest.json 校验 — Zod Schema

### 问题
App 提交的 manifest.json 格式各异，如何做严格校验并给出友好错误信息？

### Claude Code 的做法（Zod + 运行时校验）

```ts
import { z } from 'zod'

// 权限字符串格式校验
const PermissionSchema = z.string().regex(
  /^(datastore\.(read|write):[a-z0-9.-]+:[a-z0-9_-]+|notifications\.send|filesystem\.(read|write)|window\.\*)$/,
  '权限格式无效，示例：datastore.read:com.example.app:transactions'
)

const ManifestSchema = z.object({
  id: z.string().regex(/^[a-z][a-z0-9]*(\.[a-z][a-z0-9]*)+$/, '必须是反向域名格式，如 com.example.app'),
  name: z.string().min(1).max(50),
  version: z.string().regex(/^\d+\.\d+\.\d+$/, '必须是 semver 格式'),
  entry: z.string().url('必须是有效 URL'),
  icon: z.string(),
  category: z.enum(['productivity', 'finance', 'entertainment', 'developer', 'utility']),
  defaultSize: z.object({
    width: z.number().min(300).max(3840),
    height: z.number().min(200).max(2160),
  }),
  minSize: z.object({
    width: z.number().min(200),
    height: z.number().min(150),
  }),
  permissions: z.array(PermissionSchema).default([]),
  spotlightActions: z.array(z.object({
    keyword: z.string(),
    action: z.string(),
  })).default([]),
  menubar: z.record(z.array(z.union([
    z.object({ label: z.string(), action: z.string(), shortcut: z.string().optional() }),
    z.object({ type: z.literal('separator') }),
  ]))).default({}),
  exposes: z.record(z.object({
    description: z.string(),
    schema: z.string(),
  })).default({}),
})

export type Manifest = z.infer<typeof ManifestSchema>

// 使用：返回值和错误分离
function parseManifest(raw: unknown): { manifest: Manifest } | { errors: z.ZodError } {
  const result = ManifestSchema.safeParse(raw)
  if (result.success) return { manifest: result.data }
  return { errors: result.error }
}
```

### Schema 缓存（避免重复解析）

```ts
// Claude Code 的 getToolSchemaCache 模式
const manifestCache = new Map<string, Manifest>()

async function getManifest(appId: AppId): Promise<Manifest> {
  if (manifestCache.has(appId)) return manifestCache.get(appId)!
  const raw = await fetchManifest(appId)
  const result = parseManifest(raw)
  if ('errors' in result) throw new ManifestParseError(appId, result.errors)
  manifestCache.set(appId, result.manifest)
  return result.manifest
}
```

---

## 5. SDK 消息类型 — Discriminated Union

### 问题
postMessage 的消息类型如何设计才能让 TypeScript 穷举检查，避免运行时类型错误？

### Claude Code 的做法（判别联合类型 + 品牌类型）

```ts
// 品牌类型：防止 AppId 和 WindowId 混用
type AppId = string & { readonly __brand: 'AppId' }
type WindowId = string & { readonly __brand: 'WindowId' }
type CollectionNs = string & { readonly __brand: 'CollectionNs' }

function appId(s: string): AppId { return s as AppId }
function windowId(s: string): WindowId { return s as WindowId }

// SDK → Kernel 的消息（判别联合）
type KernelRequest =
  | { type: 'window.setTitle';      id: string; payload: { title: string } }
  | { type: 'window.resize';        id: string; payload: { width: number; height: number } }
  | { type: 'window.requestFullscreen'; id: string; payload: Record<never, never> }
  | { type: 'window.createChild';   id: string; payload: { url: string; title: string; modal: boolean } }
  | { type: 'notifications.send';   id: string; payload: { title: string; body: string; icon?: string } }
  | { type: 'data.query';           id: string; payload: { namespace: CollectionNs; filter: QueryFilter } }
  | { type: 'data.insert';          id: string; payload: { namespace: CollectionNs; record: unknown } }
  | { type: 'data.subscribe';       id: string; payload: { namespace: CollectionNs; subscriptionId: string } }
  | { type: 'theme.get';            id: string; payload: Record<never, never> }

// Kernel → SDK 的响应
type KernelResponse =
  | { type: 'response'; id: string; result: unknown }
  | { type: 'error';    id: string; error: string; code: number }
  | { type: 'event';    name: string; payload: unknown }  // 主动推送

// KernelBus 处理时可以穷举
function handleRequest(event: MessageEvent, req: KernelRequest) {
  switch (req.type) {
    case 'window.setTitle':
      // TypeScript 知道 req.payload.title 是 string
      windowManager.setTitle(req.payload.title)
      break
    case 'data.query':
      // TypeScript 知道 req.payload.namespace 是 CollectionNs
      return dataStore.query(req.payload.namespace, req.payload.filter)
    // ... 如果漏掉某个 case，TypeScript 会报错（配合 never 检查）
  }
}
```

---

## 6. WindowManager 状态管理 — 极简 Store

### 问题
窗口状态（位置、大小、层级、焦点）频繁变化，如何避免不必要的重渲染？

### Claude Code 的做法（createStore + Object.is）

```ts
// 极简 store，不需要 Redux/MobX
function createStore<T>(initialState: T) {
  let state = initialState
  const listeners = new Set<() => void>()

  return {
    getState: () => state,
    setState: (updater: Partial<T> | ((prev: T) => T)) => {
      const next = typeof updater === 'function'
        ? updater(state)
        : { ...state, ...updater }

      // Object.is 检查：状态未变化时不触发更新
      if (Object.is(state, next)) return
      state = next
      listeners.forEach(fn => fn())
    },
    subscribe: (fn: () => void) => {
      listeners.add(fn)
      return () => listeners.delete(fn)  // 返回取消订阅函数
    },
  }
}

// WindowManager 使用
interface WindowState {
  windows: WindowDescriptor[]
  focusedId: WindowId | null
  zIndexCounter: number
}

const windowStore = createStore<WindowState>({
  windows: [],
  focusedId: null,
  zIndexCounter: 100,
})

// 拖拽时频繁更新 rect，Object.is 确保只有真正变化时才触发渲染
function updateWindowRect(id: WindowId, rect: Partial<WindowRect>) {
  windowStore.setState(prev => ({
    ...prev,
    windows: prev.windows.map(w =>
      w.id === id ? { ...w, rect: { ...w.rect, ...rect } } : w
    ),
  }))
}
```

> 你已选 Zustand，它底层就是这个模式。关键是**拖拽时只更新 rect，不重建整个 windows 数组**。

---

## 7. Shell 启动性能 — 并行预取

### 问题
Shell 启动时需要加载：已安装 App 列表、DataStore 连接、主题配置、用户设置。如何避免串行阻塞？

### Claude Code 的做法（main.tsx 并行预取）

```ts
// ❌ 串行：慢
async function initShell() {
  const apps = await loadInstalledApps()
  const theme = await loadTheme()
  const settings = await loadSettings()
  const dataStore = await initDataStore()
  renderShell({ apps, theme, settings, dataStore })
}

// ✅ 并行：Claude Code 的做法
async function initShell() {
  // 所有初始化并行触发
  const [apps, theme, settings, dataStore] = await Promise.all([
    loadInstalledApps(),
    loadTheme(),
    loadSettings(),
    initDataStore(),
  ])
  renderShell({ apps, theme, settings, dataStore })
}

// 更进一步：在模块导入阶段就开始预取（不等 React 挂载）
// shell/index.ts
const appsPromise = loadInstalledApps()    // 立即开始，不 await
const themePromise = loadTheme()

// App.tsx
function App() {
  const apps = use(appsPromise)   // React 19 的 use()，或 Suspense
  const theme = use(themePromise)
  // ...
}
```

### 懒加载非关键模块

```ts
// Spotlight、Mission Control 不在启动路径上，延迟加载
const Spotlight = lazy(() => import('./Spotlight'))
const MissionControl = lazy(() => import('./MissionControl'))

// 只有用户触发时才加载
function Shell() {
  const [showSpotlight, setShowSpotlight] = useState(false)
  return (
    <>
      <Desktop />
      <Dock />
      {showSpotlight && (
        <Suspense fallback={null}>
          <Spotlight />
        </Suspense>
      )}
    </>
  )
}
```

---

## 8. 错误处理 — 自定义错误类 + 分类

### Claude Code 的做法

```ts
// 自定义错误类携带上下文
class ManifestParseError extends Error {
  constructor(
    public readonly appId: string,
    public readonly zodError: z.ZodError,
  ) {
    super(`manifest.json 解析失败: ${appId}`)
    this.name = 'ManifestParseError'
  }
}

class PermissionDeniedError extends Error {
  constructor(
    public readonly appId: AppId,
    public readonly permission: string,
  ) {
    super(`权限被拒绝: ${appId} 请求 ${permission}`)
    this.name = 'PermissionDeniedError'
    this.code = 403
  }
  readonly code: number
}

class KernelBusTimeoutError extends Error {
  constructor(public readonly method: string, public readonly appId: AppId) {
    super(`KernelBus 超时: ${method} from ${appId}`)
    this.name = 'KernelBusTimeoutError'
  }
}

// 错误分类：决定是否重试
function categorizeError(err: Error): 'retryable' | 'permanent' | 'user-action-required' {
  if (err instanceof KernelBusTimeoutError) return 'retryable'
  if (err instanceof PermissionDeniedError) return 'user-action-required'
  if (err instanceof ManifestParseError) return 'permanent'
  return 'permanent'
}
```

---

## 9. 内存安全 — WeakRef + 清理注册表

### 问题
App 关闭后，相关的事件监听器、订阅、AbortController 如何自动清理？

### Claude Code 的做法

```ts
// 清理注册表：统一管理生命周期
class CleanupRegistry {
  private handlers = new Map<AppId, Array<() => void>>()

  register(appId: AppId, cleanup: () => void): () => void {
    if (!this.handlers.has(appId)) this.handlers.set(appId, [])
    this.handlers.get(appId)!.push(cleanup)
    // 返回单个取消注册函数
    return () => {
      const list = this.handlers.get(appId)
      if (list) {
        const idx = list.indexOf(cleanup)
        if (idx !== -1) list.splice(idx, 1)
      }
    }
  }

  // App 关闭时调用，清理所有资源
  cleanup(appId: AppId): void {
    const handlers = this.handlers.get(appId) ?? []
    handlers.forEach(fn => fn())
    this.handlers.delete(appId)
  }
}

const cleanupRegistry = new CleanupRegistry()

// 使用示例：DataStore 订阅
function subscribeToCollection(appId: AppId, namespace: CollectionNs, cb: Callback) {
  const unsub = dataStore.subscribe(namespace, cb)
  // 注册清理，App 关闭时自动取消订阅
  cleanupRegistry.register(appId, unsub)
}

// App 关闭时
function closeApp(appId: AppId) {
  cleanupRegistry.cleanup(appId)  // 自动清理所有订阅、监听器
  windowStore.setState(prev => ({
    ...prev,
    windows: prev.windows.filter(w => w.appId !== appId),
  }))
}
```

---

## 10. Feature Flag — 控制功能开关

### 问题
Mission Control、多账户、PWA 等高级特性如何在不影响核心功能的情况下逐步开放？

### Claude Code 的做法（构建时 + 运行时双重控制）

```ts
// 运行时 feature flag（从 localStorage 或远程配置读取）
const FEATURES = {
  MISSION_CONTROL: false,
  MULTI_ACCOUNT: false,
  CLOUD_SYNC: false,
  PLUGIN_API: false,
} as const

type FeatureKey = keyof typeof FEATURES

function isFeatureEnabled(key: FeatureKey): boolean {
  // 优先读 localStorage（开发者调试用）
  const override = localStorage.getItem(`feature.${key}`)
  if (override !== null) return override === 'true'
  return FEATURES[key]
}

// 在组件中使用
function Shell() {
  return (
    <>
      <Desktop />
      <Dock />
      {isFeatureEnabled('MISSION_CONTROL') && <MissionControl />}
    </>
  )
}

// 在 KernelBus 中使用：未启用的功能直接返回 403
function handleRequest(req: KernelRequest) {
  if (req.type === 'plugin.register' && !isFeatureEnabled('PLUGIN_API')) {
    return { error: 'Plugin API 尚未开放', code: 403 }
  }
  // ...
}
```

---

## 总结：优先级排序

| 优先级 | 模块 | 借鉴点 | 影响 |
|--------|------|--------|------|
| P0 | KernelBus | AbortController 超时、pending Map | 通信稳定性 |
| P0 | Permission Guard | origin 鉴权、DeepImmutable | 安全边界 |
| P1 | SDK 消息类型 | Discriminated Union、Branded Types | 类型安全 |
| P1 | manifest 校验 | Zod schema、Schema 缓存 | 开发者体验 |
| P1 | 错误处理 | 自定义错误类、错误分类 | 可调试性 |
| P2 | DataStore 缓存 | LRU + 字节限制、stale-while-revalidate | 性能 |
| P2 | Shell 启动 | 并行预取、懒加载 | 启动速度 |
| P2 | 内存安全 | CleanupRegistry、WeakRef | 稳定性 |
| P3 | Feature Flag | 运行时开关 | 迭代灵活性 |
