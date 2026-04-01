# Self-Hosted & 多端同步架构

## 愿景

Vidorra OS 是一个可以完全自托管的 Web 桌面系统。用户的数据存在自己的服务器上，不依赖任何中心化云服务。同时支持多设备访问、选择性公开分享、访客有限权限。

---

## 部署模式

### 模式一：纯本地（默认）
数据存在浏览器 IndexedDB，无需服务器。适合个人单设备使用。

### 模式二：Self-Hosted（核心目标）
用户部署自己的 Vidorra Server，数据存在自己的服务器（PostgreSQL / SQLite）。
多设备通过同一服务器同步，数据完全自控。

### 模式三：托管云服务（可选，商业化路径）
Vidorra 官方提供托管服务，用户无需自己部署服务器。数据存在官方服务器。

三种模式共用同一套前端代码，通过 `StorageAdapter` 抽象层切换后端。

---

## 核心架构：StorageAdapter 抽象

DataStore 的底层存储通过适配器模式解耦，支持多种后端：

```ts
interface StorageAdapter {
  // 基础 CRUD
  query(namespace: string, filter: QueryFilter): Promise<Record[]>
  insert(namespace: string, record: Record): Promise<void>
  update(namespace: string, id: string, patch: Partial<Record>): Promise<void>
  delete(namespace: string, id: string): Promise<void>

  // 实时订阅
  subscribe(namespace: string, callback: (records: Record[]) => void): Unsubscribe

  // 同步状态
  getSyncStatus(): SyncStatus
}

// 三种实现
class IndexedDBAdapter implements StorageAdapter { ... }   // 纯本地
class RemoteAdapter implements StorageAdapter { ... }      // Self-Hosted / 云服务
class HybridAdapter implements StorageAdapter { ... }      // 本地优先 + 后台同步（推荐）
```

**HybridAdapter（推荐）**：本地 IndexedDB 作为缓存层，后台与服务器同步。离线时继续工作，联网后自动同步。

---

## Vidorra Server

Self-Hosted 服务端，用户自己部署。

### 技术选型

| 组件 | 选型 | 理由 |
|------|------|------|
| 运行时 | Node.js / Bun | 与前端同语言，降低维护成本 |
| 框架 | Hono | 轻量，支持 Bun/Node/Cloudflare Workers |
| 数据库 | SQLite（默认）/ PostgreSQL（可选） | SQLite 零依赖，单文件，适合个人部署 |
| ORM | Drizzle ORM | TypeScript 原生，支持 SQLite + PostgreSQL |
| 实时同步 | WebSocket | 多设备实时推送数据变化 |
| 认证 | 自研简单 token | 无需 OAuth，self-hosted 场景用户就是管理员 |
| 部署 | Docker 单容器 | `docker run vidorra/server` 一行启动 |

### 部署目标

```bash
# 最简部署：一行命令
docker run -p 3000:3000 -v ./data:/data vidorra/server

# 访问
open http://localhost:3000
```

数据存在 `./data/vidorra.db`（SQLite），用户完全掌控。

---

## 多设备同步

### 同步策略：LWW（last-write-wins）

以 `updatedAt` 时间戳为准，最后写入的版本胜出。不引入 CRDT——个人数据场景下多设备同时修改同一记录的概率极低，LWW 完全够用（见 ADR-0008）。

```ts
interface SyncRecord {
  id: string
  namespace: string
  data: unknown
  updatedAt: number      // Unix timestamp（毫秒），冲突时取最大值
  deviceId: string       // 最后修改的设备 ID
  version: number        // Server 分配的单调递增版本号
  deleted: boolean       // 软删除
}
```

**冲突解决**：同一条记录在多设备同时修改时，取 `updatedAt` 最大的版本。

### 同步流程

```
设备 A 写入数据
  │
  ├─ 1. 写入本地 IndexedDB（立即生效）
  ├─ 2. 标记为 pending sync
  └─ 3. 通过 WebSocket 推送到 Server
         │
         ├─ Server 写入数据库
         └─ Server 广播给其他在线设备
              │
              └─ 设备 B、C 收到推送，更新本地 IndexedDB
```

**离线处理**：
- 离线时写入本地，标记 `syncStatus: 'pending'`
- 重新联网时，批量上传 pending 记录
- Server 返回冲突时，展示冲突解决 UI（P3，初期直接 last-write-wins）

---

## App Store 可配置仓库源

类似 Homebrew tap 或 Docker registry，用户可以添加自定义 App 源。

### 源格式

每个源是一个 JSON 文件，托管在任意 HTTP 服务器（GitHub、自己的服务器均可）：

```json
{
  "name": "Vidorra Official",
  "description": "官方精选应用",
  "maintainer": "vidorra-team",
  "apps": [
    {
      "id": "com.vidorra.notes",
      "name": "Notes",
      "manifestUrl": "https://notes.vidorra.dev/manifest.json",
      "category": "productivity",
      "description": "简洁的笔记应用",
      "screenshots": ["./screenshots/1.png"],
      "verified": true
    }
  ]
}
```

### 用户配置

在 Settings > App Store > 源管理 中添加：

```
官方源（默认）：https://registry.vidorra.dev/apps.json
自定义源：     https://github.com/yourname/my-apps/raw/main/registry.json
私有源：       http://internal.company.com/vidorra-apps.json
```

### 安全

- 官方源的 App 标记 `verified: true`，展示认证徽章
- 第三方源的 App 安装时展示明显警告
- 用户可以完全禁用官方源，只用自己的私有源

---

## 公网分享与访客权限

### 设计前提

**单用户系统**：Vidorra OS 只为一个人设计。没有多人协作编辑，没有共享工作区。
分享是单向的：你的内容 → 别人只读（可评论）。

### 分享模型

每个 DataStore 命名空间可以独立设置分享策略：

```ts
type SharePolicy =
  | { type: 'private' }                          // 仅自己可见（默认）
  | { type: 'public-read'; slug: string }        // 公开只读，通过 slug 访问
  | { type: 'link'; token: string }              // 私密链接，知道链接才能访问
```

不存在 `read-write` 的访客权限。访客唯一的写入能力是**评论**，评论走独立的评论系统（见下文）。

### 访客体验：独立 App 路由

访客不进入 Vidorra OS 的桌面 Shell，而是直接访问一个独立的 App 页面：

```
https://your-server.com/app/blog/posts/my-first-post
https://your-server.com/app/blog
https://your-server.com/app/photos/album/2024-japan
```

路由格式：`/app/{appSlug}/{...appInternalPath}`

这个路由加载对应 App 的独立视图（无 Dock、无 Menubar、无窗口框），App 通过 URL 参数感知自己处于「公开分享模式」，只渲染公开内容。

**优势**：
- 访客看到的是干净的 App 界面，不是操作系统
- URL 可以直接分享、被搜索引擎索引
- App 可以针对公开模式做专门的 UI（如博客的阅读排版）
- 无需加载整个 Shell，性能更好

### App 的两种运行模式

```ts
type AppMode =
  | 'desktop'   // 运行在 Vidorra OS 桌面，有窗口框，通过 KernelBus 通信
  | 'standalone' // 独立页面，无 Shell，通过 URL 参数获取上下文
```

App 通过 SDK 感知当前模式：

```ts
const app = createApp()
await app.ready()

if (app.mode === 'standalone') {
  // 公开分享模式：只渲染公开内容，隐藏编辑功能
  const slug = app.standaloneParams.get('slug')
  renderPublicView(slug)
} else {
  // 桌面模式：完整功能
  renderFullApp()
}
```

### 评论系统

访客唯一的写入能力。评论数据存在 Server 的独立表中，不走 DataStore 的命名空间权限系统：

- 访客无需登录即可评论（可选：要求填写名称/邮箱）
- 评论需要主人审核后才公开（防垃圾）
- 主人在桌面端的 App 内管理评论（审核、删除）
- 评论通过 Server API 直接读写，不经过 KernelBus

---

## 认证系统

### Self-Hosted 认证

Self-Hosted 场景下，用户就是管理员，认证极简：

```
首次访问 → 设置密码 → 生成长期 token → 存在 localStorage
后续访问 → 携带 token → Server 验证 → 返回数据
```

不需要 OAuth、不需要邮件验证，就像路由器管理页面一样简单。

### 多用户（P3）

Self-Hosted 支持多用户（家庭共用一台服务器）：

- 管理员创建用户账号
- 每个用户有独立的数据空间
- 用户间可以共享特定命名空间

### Token 安全

- Token 存在 `httpOnly cookie`（防 XSS）
- 支持多设备 token，可以单独吊销某个设备
- Token 不过期（self-hosted 场景用户自己管理）

---

## 数据导出 / 迁移

用户随时可以导出全部数据，不被锁定：

```bash
# 从 Self-Hosted Server 导出
curl -H "Authorization: Bearer $TOKEN" \
  https://your-server.com/api/export > vidorra-backup.json

# 导入到新服务器
curl -X POST -H "Authorization: Bearer $TOKEN" \
  -d @vidorra-backup.json \
  https://new-server.com/api/import
```

导出格式是标准 JSON，每个命名空间一个数组，无私有格式。

---

## 路线图

| 阶段 | 功能 | 优先级 |
|------|------|--------|
| P1 | 纯本地 IndexedDB（已规划） | 核心 |
| P2 | Self-Hosted Server（SQLite + WebSocket 同步） | 高 |
| P2 | App Store 多源支持 | 高 |
| P3 | 公网分享 + 访客权限 | 中 |
| P3 | 多用户支持 | 中 |
| P4 | 托管云服务 | 低（商业化） |
| P4 | 端对端加密（E2EE） | 低 |

---

## 相关 ADR

- [ADR-0006 StorageAdapter 抽象](../adr/0006-storage-adapter.md)
- [ADR-0007 Self-Hosted Server 选型](../adr/0007-self-hosted-server.md)
- [ADR-0008 同步策略](../adr/0008-sync-strategy.md)
