# ADR-0009 App 独立路由（Standalone Mode）

**状态**：已采纳
**日期**：2026-03

## 背景

App 有两种使用场景：
1. 用户在桌面 Shell 中使用（有窗口框、Dock、Menubar）
2. 内容分享给外部访客（访客不需要也不应该看到操作系统的壳）

需要决定访客如何访问分享内容。

## 决策

引入 `/app/{appSlug}/{...path}` 路由，让 App 可以脱离 Shell 独立运行。

```
/app/blog                        → 博客首页
/app/blog/posts/my-first-post    → 某篇文章
/app/photos/album/2024-japan     → 相册
/app/notes/note/abc123           → 分享的笔记（需要 link token）
```

## App 的两种模式

| 模式 | 触发条件 | Shell | KernelBus | 数据来源 |
|------|----------|-------|-----------|----------|
| `desktop` | 在 Vidorra OS 桌面打开 | 有 | 有 | DataStore（完整权限） |
| `standalone` | 通过 `/app/` 路由访问 | 无 | 无 | Server REST API（只读公开数据） |

## Standalone 模式的数据获取

Standalone 模式下没有 KernelBus，App 直接调用 Server 的公开 REST API：

```
GET /api/public/{appSlug}/{namespace}?filter=...
```

Server 根据该命名空间的 SharePolicy 决定返回哪些数据（只返回 `published: true` 的记录等）。

App 通过 SDK 感知模式并切换数据获取方式：

```ts
const app = createApp()
await app.ready()

if (app.mode === 'standalone') {
  // 直接 fetch，不走 KernelBus
  const posts = await fetch(`/api/public/blog/posts`).then(r => r.json())
  render(posts)
} else {
  // 走 DataStore
  const posts = await app.data.collection('com.yourname.blog:posts').query()
  render(posts)
}
```

## manifest.json 新增字段

```json
{
  "standalone": {
    "slug": "blog",
    "routes": [
      { "path": "/",              "entry": "./public/index.html" },
      { "path": "/posts/:slug",   "entry": "./public/post.html" }
    ],
    "publicNamespaces": [
      {
        "namespace": "com.yourname.blog:posts",
        "filter": { "published": true }
      }
    ]
  }
}
```

## 为什么不让访客进入 Shell

- Shell 加载成本高（Zustand store、WindowManager、所有组件）
- 访客看到操作系统界面会困惑，体验差
- 独立页面可以被搜索引擎索引（SEO）
- 独立页面可以针对内容做专门排版（博客的阅读体验 ≠ 桌面 App 的操作体验）

## 影响

- SDK 需要新增 `mode`、`standaloneParams` 字段
- manifest.json 需要新增 `standalone` 配置块
- Server 需要实现 `/api/public/` 路由，按 SharePolicy 过滤数据
- App 开发者需要考虑两种模式的 UI（可以共用组件，条件渲染编辑功能）
