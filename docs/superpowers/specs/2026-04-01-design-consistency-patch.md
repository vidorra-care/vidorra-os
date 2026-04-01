# Vidorra OS 设计自洽性修订

**日期**: 2026-04-01  
**类型**: 设计修订（对现有设计文档的补丁和补充规范）  
**状态**: 已批准

---

## 背景

对 Vidorra OS 现有设计文档（PRD、架构文档、ADR、内核文档）进行全面自洽性审查，发现 4 处前后矛盾、5 处设计漏洞、若干设计空白。本文档记录所有修订决策，作为后续更新各原始文档的权威依据。

---

## 第一部分：矛盾修复

### M1. 同步策略命名统一

**问题**: `docs/architecture/self-hosted.md` 将同步策略称为 "CRDT-lite（last-write-wins + 向量时钟）"，与 `ADR-0008` 明确选定的 LWW 策略矛盾。实际 `SyncRecord` 结构中也没有向量时钟字段。

**修订**: 
- `self-hosted.md` 中的 "CRDT-lite" 标题改为 "LWW（last-write-wins）"
- 删除"向量时钟"相关描述
- ADR-0008 为权威文档，self-hosted.md 与之对齐

**受影响文档**: `docs/architecture/self-hosted.md`

---

### M2. AI Buddy 权限规则统一

**问题**: `ADR-0005` 说"AI Buddy 工具调用不适用 `alwaysAllow`，即使低风险操作也应让用户感知"，但 `docs/ai-buddy/tools.md` 中 6 个工具（`app_open`、`app_list`、`data_query` 等）均标注"不需要确认"，两者直接矛盾。

**修订决策**: **read-only 操作不需要确认，write 操作逐次确认。**

| 工具 | 类型 | 是否需要确认 |
|------|------|------------|
| `app_list` | 只读 | 否 |
| `app_open` | 操作（低风险） | 否 |
| `data_query` | 只读 | 否 |
| `get_namespace_schema` | 只读（新增，见 N4） | 否 |
| `spotlight_search` | 只读 | 否 |
| `notification_send` | 操作（低风险） | 否 |
| `window_arrange` | 操作（低风险） | 否 |
| `data_insert` | 写入 | **是，逐次确认** |
| `data_update` | 写入（P3） | **是，逐次确认** |
| `data_delete` | 写入（P3） | **是，逐次确认** |
| `app_install` | 写入（P3） | **是，逐次确认** |

**受影响文档**: `ADR-0005`、`docs/ai-buddy/tools.md`

---

### M3. `com.global` 命名空间写入权

**问题**: `ADR-0005` 说 `datastore.write:com.global:*` → `alwaysDeny`，"只有创建者可写"，但未定义谁是创建者，导致全局命名空间永远为空，毫无意义。

**修订决策**: **`com.global:*` 命名空间由 Vidorra 系统在初始化时预置，任何 App 均不可写。**

规则：
- 全局预置的 collection 包括：`com.global:contacts`、`com.global:events`、`com.global:categories`（初始为空，由用户通过系统 App 管理）
- App 可以声明 `datastore.read:com.global:*` 权限来读取（需用户安装时授权）
- `alwaysDeny` 对所有 App 均有效，无例外
- 未来需要新增全局 collection，通过 Vidorra OS 版本更新而非第三方 App

**受影响文档**: `ADR-0005`、`docs/kernel/data-store.md`

---

### M4. manifest 字段说明补齐

**问题**: `docs/kernel/app-registry.md` 的字段说明表未包含 `standalone` 字段，但 ADR-0009 已定义该字段。

**修订**: `app-registry.md` 字段说明表末尾补充：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `standalone` | object | — | 独立路由模式配置（访客无 Shell 直接访问），见 ADR-0009 |

**受影响文档**: `docs/kernel/app-registry.md`

---

## 第二部分：新增规范

### N1. DataStore Schema 演进规范

**问题**: 现有设计要求写入时 Zod 校验，但无 schema 版本升级路径。App 升级后旧数据字段缺失，会导致 Zod 拒绝读取旧记录。

**规范**:

#### 约束一：additive-only（强制）
所有新字段必须是 optional（`?` 或带默认值）。禁止在现有 schema 版本内新增必填字段或删除字段。

#### 约束二：breaking change 走 schemaVersion

`manifest.exposes` 新增 `schemaVersion`（整数，默认 1）和可选迁移 map：

```json
{
  "exposes": {
    "transactions": {
      "description": "用户的所有收支记录",
      "schemaVersion": 2,
      "schema": "./schemas/transaction.v2.json",
      "migrations": {
        "1→2": "./migrations/transaction-v1-to-v2.js"
      }
    }
  }
}
```

#### 迁移执行时机
- 迁移函数在 App **更新安装时**批量执行（AppRegistry.update 流程）
- 迁移失败则安装失败，数据保持原版本不变
- 迁移成功后旧版本 schema 从 AuthStore 中移除
- 读取路径不执行迁移，读取时数据始终符合当前 schemaVersion

#### 迁移函数签名
```ts
// ./migrations/transaction-v1-to-v2.js
export default function migrate(records: unknown[]): unknown[] {
  return records.map(r => ({
    ...r,
    currency: r.currency ?? 'CNY', // 新字段，提供默认值
  }))
}
```

**受影响文档**: `docs/kernel/data-store.md`、`docs/sdk/manifest.md`

---

### N2. App 间通信规范

**问题**: 现有设计只有 App→Kernel 通道，无 App 间直接通信路径，跨 App 事件无处可走。

**规范**: **用 DataStore 实时订阅作为 App 间事件总线，不新增通信通道。**

约定：
- 发布方在自己的私有命名空间中维护一个 `events` collection（如 `com.example.budget:events`）
- 消费方声明 `datastore.read:com.example.budget:events` 权限并订阅
- 事件记录格式（推荐，非强制）：

```ts
interface AppEvent {
  id: string           // UUID
  type: string         // 事件类型，如 'invoice:created'
  payload: unknown
  timestamp: number
  ttl?: number         // 可选，毫秒。DataStore 垃圾回收时清理过期事件
}
```

- 天然走权限系统（消费方需用户授权才能读取）
- 离线时事件堆积在 IndexedDB，重连后消费方仍可处理

**P3 扩展**: 若出现需要同步 RPC 的场景，再评估 `kernelBus.forward(targetAppId, msg)` 中转模式。

**受影响文档**: `docs/kernel/data-store.md`（新增"App 间通信"小节）

---

### N3. Standalone 模式 Publish 机制

**问题**: ADR-0009 中 standalone 模式直接读实时数据，存在草稿意外暴露风险；HybridAdapter 未同步完时访客看到旧数据；Server 侧过滤逻辑归属不明确。

**规范**: **引入显式 publish 动作，访客读 snapshot 而非实时数据。**

#### Publish 流程

```
桌面端用户触发 publish（按钮/自动）
  │
  ▼
app.data.collection(ns).publish(options)
  │
  ├─ 1. DataStore 按 options.filter 查询当前数据
  ├─ 2. HybridAdapter 确保本地数据已同步到 Server
  ├─ 3. 将结果写入 Server 的 published_snapshot 表
  └─ 4. 返回 { snapshotId, publishedAt }
```

#### SDK 新增方法

```ts
await app.data
  .collection('com.yourname.blog:posts')
  .publish({
    filter: { published: true },   // 仅发布 published=true 的记录
    slug: 'blog',                  // 对应 manifest.standalone.slug
  })
```

#### Server 数据模型

```ts
interface PublishedSnapshot {
  appSlug: string
  namespace: string
  records: Record[]
  publishedAt: number
  snapshotVersion: number
}
```

#### 访客数据流

```
GET /api/public/{appSlug}/{namespace}?filter=...
  │
  ├─ Server 查 published_snapshot 表（不查实时 DataStore）
  └─ 返回 snapshot 数据，无需 token
```

#### manifest 变更

`manifest.standalone.publicNamespaces` 的 `filter` 字段改为描述性（说明哪些数据允许发布），实际过滤在 `publish()` 调用时执行：

```json
{
  "standalone": {
    "slug": "blog",
    "publicNamespaces": [
      {
        "namespace": "com.yourname.blog:posts",
        "allowedFilter": { "published": true }
      }
    ]
  }
}
```

**受影响文档**: `docs/adr/0009-app-standalone-mode.md`、`docs/sdk/sdk-core.md`、`docs/architecture/self-hosted.md`

---

### N4. AI Buddy SystemContext 两阶段注入

**问题**: 用户安装 50 个 App 时，SystemContext 注入全部 App 的 schema 会导致 context 过大，token 消耗不可控。

**规范**: **两阶段 context 注入 + 新增 `get_namespace_schema` 工具。**

#### 第一阶段（每次对话开头，自动注入）

```
系统 prompt 包含：
  - 当前时间、主题（light/dark）、语言
  - 当前聚焦 App 名称 + 该 App 的完整 schema
  - 运行中的 App 列表（仅名称 + appId，无 schema）
  - 用户授权 Buddy 可访问的命名空间列表（仅名称，无 schema）
```

**上限**: 第一阶段 context 不超过 2000 token。超出时截断运行中 App 列表，聚焦 App schema 优先保留。

#### 第二阶段（AI 按需拉取）

新增工具 `get_namespace_schema`：

```ts
{
  name: 'get_namespace_schema',
  description: '获取指定命名空间的数据 schema，用于了解某个 App 的数据结构后再查询',
  parameters: {
    namespace: string  // 如 'com.example.budget:transactions'
  },
  requiresConfirmation: false  // 只读，无需确认
}
```

AI 在调用 `data_query` 之前，先调用此工具了解数据结构，避免盲查。

**受影响文档**: `docs/ai-buddy/system-context.md`、`docs/ai-buddy/tools.md`

---

### N5. SDK 自动路由 VFS/DataStore

**问题**: 文档规定"大文件走 VFS，小数据走 DataStore"，但 10MB 阈值对开发者不透明，边界模糊（5MB 的 PDF 该走哪个？）。

**规范**: **SDK 内部按字段类型自动路由，开发者使用统一 API，无感知。**

#### 路由规则（SDK 内部）

| 字段值类型 | 存储位置 | DataStore 中存什么 |
|-----------|---------|-------------------|
| `Blob` / `File` | VFS | 元数据 + `_vfsPath: string` |
| `ArrayBuffer` / `Uint8Array` | VFS | 元数据 + `_vfsPath: string` |
| 其他 JSON-serializable | DataStore | 原始值 |

#### 开发者视角（统一 API）

```ts
// 写入：含 Blob 的记录，SDK 自动分流
await app.data.collection('com.example.notes:attachments').insert({
  id: crypto.randomUUID(),
  name: 'report.pdf',
  content: pdfBlob,       // Blob → 自动存 VFS
  createdAt: Date.now(),  // number → 存 DataStore
})

// 读取：SDK 自动从 VFS 取回 Blob，开发者拿到完整记录
const record = await app.data
  .collection('com.example.notes:attachments')
  .get(id)
// record.content 已是 Blob，_vfsPath 字段不暴露给开发者
```

#### VFS 下线时机（P1）
P1 阶段 VFS 尚未实现，SDK 对 Blob 字段的处理：拒绝写入并返回明确错误 `VFS_NOT_AVAILABLE`，提示开发者 VFS 在 P2 可用。P2 VFS 实现后，该错误自然消失。

**受影响文档**: `docs/sdk/sdk-core.md`、`docs/kernel/file-system.md`

---

## 第三部分：补充规范

### C1. WindowManager z-index 溢出保护

**问题**: `window-manager.md` 描述 z-index 单调递增，但没有上限保护，理论上可以无限增长至超出渲染引擎限制。

**规范**:

```ts
function focusWindow(windowId: WindowId) {
  const nextZ = store.zIndexCounter + 1

  if (nextZ > 4999) {
    // 触发重排：将所有普通窗口按当前层级顺序重新赋值
    compactZIndexes()
    // compactZIndexes 后 zIndexCounter 为 100 + 当前窗口数
    return focusWindow(windowId)  // 重排后再聚焦
  }

  store.updateWindow(windowId, { zIndex: nextZ, focused: true })
  store.zIndexCounter = nextZ
}

function compactZIndexes() {
  const sorted = [...store.windows].sort((a, b) => a.zIndex - b.zIndex)
  sorted.forEach((win, i) => {
    store.updateWindow(win.id, { zIndex: 100 + i })
  })
  store.zIndexCounter = 100 + sorted.length
}
```

重排过程对用户无感知（相对层级不变，绝对值重置）。

**受影响文档**: `docs/kernel/window-manager.md`

---

### C2. 系统命名空间 quota 豁免

**问题**: `data-store.md` 规定每个 App 默认 50MB 配额，但 `com.vidorra.system:*` 的 quota 归属不明确。

**规范**:
- `com.vidorra.system:*` 命名空间不计入任何 App 的 50MB 配额
- 由系统独立管理，软上限 10MB（主题、设置、窗口状态等，不应接近此上限）
- 超出 10MB 时写入返回 `SYSTEM_QUOTA_EXCEEDED` 错误（属于系统 bug，而非用户操作触发）
- `com.vidorra.buddy:*`（AI Buddy 对话历史，P3）同样豁免，独立软上限 100MB

**受影响文档**: `docs/kernel/data-store.md`

---

### C3. AI Buddy 默认命名空间访问权

**问题**: `docs/ai-buddy/system-context.md` 引用 `authStore.getBuddyAccessibleNamespaces()`，但未定义哪些是默认可访问的。

**规范**:

| 命名空间范围 | 默认权限 | 说明 |
|------------|---------|------|
| `com.vidorra.system:*` | 默认可读 | 主题、系统设置（只读） |
| `com.vidorra.buddy:*` | 默认可读写 | Buddy 自己的存储 |
| `com.global:*` | **默认不可访问** | 用户在设置中授权后可读 |
| 其他 App 命名空间 | **默认不可访问** | 用户在设置中逐个授权 |

用户在 **Settings > AI Buddy > 数据访问** 中管理授权列表，每条授权记录存入 AuthStore（与普通 App 授权使用同一套机制）。

**受影响文档**: `docs/ai-buddy/system-context.md`、`docs/ai-buddy/overview.md`

---

## 变更影响矩阵

| 受影响文档 | 变更编号 | 变更类型 |
|-----------|---------|---------|
| `ADR-0005` | M2, M3 | 修订现有规则 |
| `ADR-0009` | N3 | 新增 publish 机制 |
| `docs/architecture/self-hosted.md` | M1, N3 | 修订命名；新增 snapshot 表 |
| `docs/kernel/app-registry.md` | M4 | 补充字段说明 |
| `docs/kernel/data-store.md` | M3, N1, N2, C2 | 多处补充 |
| `docs/kernel/window-manager.md` | C1 | 新增 compact 机制 |
| `docs/sdk/manifest.md` | N1, N3 | 新增 schemaVersion / publish 配置 |
| `docs/sdk/sdk-core.md` | N3, N5 | 新增 publish API；VFS 路由说明 |
| `docs/kernel/file-system.md` | N5 | 更新存储路由规则 |
| `docs/ai-buddy/tools.md` | M2, N4 | 修订确认规则；新增工具 |
| `docs/ai-buddy/system-context.md` | N4, C3 | 两阶段注入；默认权限 |
| `docs/ai-buddy/overview.md` | C3 | 补充权限说明 |

---

## 不在本文档范围内的事项

以下内容设计上有空白，但属于 P3 以后的范畴，暂不在本修订中处理：
- App 间同步 RPC（P3）
- AI Buddy 对话历史持久化到 DataStore（P3）
- 多用户支持下的 standalone 访客身份（P3）
- DataStore 冲突解决 UI（P3，当前直接 LWW）
