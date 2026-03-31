# Vidorra OS · 产品设计文档

> PRD v0.1 · Draft · 原始文档：[webos-product-design.html](../../webos-product-design.html)

---

## 目录

1. [市场定位与竞品分析](#01--市场定位)
2. [产品哲学](#02--产品哲学)
3. [系统架构](#03--系统架构)
4. [内核模块设计](#04--内核模块)
5. [App SDK 规范](#05--app-sdk)
6. [跨应用数据层](#06--跨应用数据层)
7. [应用商店](#07--应用商店)
8. [技术选型](#08--技术选型)
9. [路线图](#09--路线图)
10. [风险与对策](#10--风险与对策)

---

## 01 — 市场定位

### 竞品分析与差异化机会

Web Desktop OS 并不是空白市场，但现有产品都在关键维度上存在明显短板。

| 项目 | macOS 风格 | 框架无关 App | 跨 App 数据层 | 应用商店 | 活跃维护 | 自托管 |
|------|-----------|------------|-------------|---------|---------|--------|
| Puter | ✗ Windows 风 | △ 弱 | △ 文件系统 | △ alpha | ✓ | ✓ |
| OS.js | ✗ | ✗ 强耦合 | ✗ | ✗ | 停滞 | ✓ |
| ProzillaOS | ✗ Ubuntu 风 | ✗ React 强耦 | ✗ | ✗ | △ | ✓ |
| macos-web | ✓ UI 相似 | ✗ | ✗ | ✗ | △ | — |
| **Vidorra OS** | ✓ 核心定位 | ✓ iframe 沙箱 | ✓ 结构化 | ✓ 完整 | ✓ | ✓ |

**核心差异化**：没有任何现有项目同时实现了：
1. macOS 级视觉审美
2. 真正框架无关的 App 沙箱（App 可以是 Vue、Svelte、Next.js、甚至纯 HTML）
3. 结构化跨应用数据层

这三者的组合是护城河。

---

## 02 — 产品哲学

> Vidorra OS 不是一个应用，它是一个让其他应用存在的世界。

### 六条核心原则

**底座即平台**
内核只提供系统能力，不预设应用形态。博客、记账、天气——都由第三方 App 实现。

**沙箱优先**
每个 App 运行在独立 iframe 沙箱内，通过受控 postMessage 协议与内核通信，互不污染。

**框架无关**
App 可以用任何技术栈构建——React、Vue、Svelte、Angular，甚至原生 HTML。SDK 是协议，不是框架。

**数据互通**
打通应用之间的数据孤岛——记账 App 的分类数据可以被统计 App 直接读取，前提是授权。

**macOS 审美**
玻璃质感、精确的阴影、流畅的动画——用户不需要知道它是 Web 的。

**渐进增强**
最简 App 只需一个 URL。复杂 App 可以深度接入数据层、通知、快捷键、菜单栏定制。

---

## 03 — 系统架构

### 分层架构

```
┌─────────────────────────────────────────────────────────┐
│                        APP 层                            │
│   博客 App    记账 App    天气 App    笔记 App   ...      │
│   (Next.js)   (Vue)      (Svelte)   (纯 HTML)           │
└──────────────────────┬──────────────────────────────────┘
                       │  iframe sandbox + postMessage
┌──────────────────────▼──────────────────────────────────┐
│                      BRIDGE 层                           │
│   KernelBus (消息总线)   Permission Guard   EventEmitter │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│                      SHELL 层                            │
│   WindowManager   Dock   Menubar   Spotlight   Notifs   │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│                     KERNEL 层                            │
│   AppRegistry   DataStore   AuthStore   ThemeEngine     │
│   ShortcutManager   FileSystem (VFS)                    │
└─────────────────────────────────────────────────────────┘
```

### 关键设计决策：为什么用 iframe

iframe 沙箱是实现框架无关 App 的唯一可靠方式。每个 App 是独立的浏览器上下文，有自己的 JS 运行时、CSS 作用域、localStorage。

参考先例：VS Code 扩展在独立的 Extension Host 进程中运行，通过 RPC 通信；Figma 的 Plugin 运行在 iframe + sandbox 中。这个模式在工业界已被充分验证。

---

## 04 — 内核模块

### WindowManager

负责所有窗口的生命周期、层级（z-index）、拖拽、缩放、最小化/最大化、窗口快照（Mission Control）。

```ts
interface WindowDescriptor {
  id: string
  appId: string
  title: string
  url: string           // App 的实际 URL，加载到 iframe.src
  icon: string          // SVG / URL
  rect: WindowRect
  state: 'normal' | 'minimized' | 'maximized' | 'fullscreen'
  focused: boolean
  zIndex: number
  sandboxFlags: SandboxFlag[]
}
```

### AppRegistry

管理已安装的 App，读取并校验每个 App 的 `manifest.json`，提供安装/卸载/启动/停止接口。

```json
{
  "id": "com.yourname.budget",
  "name": "记账本",
  "version": "1.2.0",
  "entry": "https://budget.yourapp.dev",
  "icon": "./icon.svg",
  "category": "finance",
  "defaultSize": { "width": 900, "height": 600 },
  "minSize": { "width": 400, "height": 300 },
  "permissions": [
    "datastore.read:com.yourname.budget:transactions",
    "datastore.write:com.yourname.budget:transactions",
    "notifications.send"
  ],
  "spotlightActions": [
    { "keyword": "新增收支", "action": "open?modal=new-entry" }
  ],
  "menubar": {
    "文件": [
      { "label": "新建记录", "action": "new-entry", "shortcut": "CmdOrCtrl+N" },
      { "type": "separator" },
      { "label": "导出 CSV", "action": "export-csv" }
    ]
  },
  "exposes": {
    "transactions": {
      "description": "用户的所有收支记录",
      "schema": "./schemas/transaction.json"
    }
  }
}
```

### DataStore

基于 IndexedDB 的结构化数据存储，是整个系统最具创新性的模块。详见 [§06 跨应用数据层](#06--跨应用数据层)。

### ShortcutManager

全局快捷键注册中心。App 通过 manifest 声明自己的快捷键，当 App 聚焦时，ShortcutManager 将键盘事件路由到 App 的 iframe 内。

### ThemeEngine

管理系统级 CSS 变量（颜色、圆角、字体、模糊量）。App 可通过 SDK 订阅主题变化，实现 Dark Mode 无缝切换。

---

## 05 — App SDK

SDK 本质上是一个轻量级的 postMessage 封装库，提供 Promise 化的 API。SDK 本身不超过 8KB gzip。

> SDK 是协议适配器，不是框架。用 React 的 App 可以用，用 Vue 的也可以用，甚至纯 HTML 脚本引入即可使用。

### 安装与初始化

```ts
import { createApp } from '@vidorra/sdk'

const app = createApp()
await app.ready()
```

### 窗口控制

```ts
app.window.setTitle('记账本 — 2024年6月')
app.window.resize({ width: 1200, height: 800 })
await app.window.requestFullscreen()

const childWin = await app.window.createChild({
  url: '/settings',
  title: '偏好设置',
  modal: true,
  size: { width: 560, height: 400 }
})
```

### 通知

```ts
await app.notifications.send({
  title: '月度账单已生成',
  body: '2024年6月支出 ¥3,240，点击查看明细',
  onClick: () => app.window.focus()
})
```

### 菜单栏响应

```ts
app.on('menu:action', ({ action }) => {
  switch (action) {
    case 'new-entry': openNewEntryModal(); break
    case 'export-csv': exportData(); break
  }
})
```

### 主题订阅

```ts
app.theme.subscribe(({ mode, tokens }) => {
  document.documentElement.dataset.theme = mode // 'light' | 'dark'
})
```

---

## 06 — 跨应用数据层

> 记账 App 的数据可以被图表 App 直接读取——这才是真正打通数据孤岛的"操作系统"。

DataStore 是一个结构化的、Schema 驱动的、具有权限控制的跨 App 数据总线。

### 命名空间设计

```
com.yourname.budget:transactions   // 私有，只有 budget App 可写
com.global:categories              // 全局，任何有权限的 App 可读
com.global:contacts
com.vidorra.system:theme           // 系统保留，只读
```

### DataStore API

```ts
// 查询
const transactions = await app.data
  .collection('com.yourname.budget:transactions')
  .query({
    where: { month: '2024-06', category: '餐饮' },
    orderBy: [{ field: 'date', dir: 'desc' }],
    limit: 50
  })

// 写入
await app.data
  .collection('com.yourname.budget:transactions')
  .insert({ id: uuid(), amount: -128.5, category: '餐饮', date: '2024-06-15' })

// 实时订阅
const unsub = app.data
  .collection('com.yourname.budget:transactions')
  .subscribe(records => renderList(records))
```

### 跨 App 数据流示例

```ts
// 图表 App 直接读取记账 App 的数据（无需 API 对接）
// 前提：图表 App 的 manifest 声明了 datastore.read 权限，用户已授权

const data = await app.data
  .collection('com.yourname.budget:transactions')
  .query({ where: { year: 2024 } })

const byMonth = groupBy(data, 'month')
// → 直接渲染为折线图
```

数据属于用户，存在 IndexedDB 中，App 只是视图。

---

## 07 — 应用商店

应用商店本身也是一个 App（`com.vidorra.appstore`），通过读取一个中央 Registry JSON 来展示可用的 App 列表。

### Registry 数据结构

```json
{
  "apps": [
    {
      "id": "com.example.blog",
      "name": "轻博客",
      "description": "Markdown 博客写作与发布",
      "author": "Jane Doe",
      "manifestUrl": "https://blog.example.com/manifest.json",
      "category": "productivity",
      "tags": ["blog", "writing", "markdown"],
      "featured": true
    }
  ]
}
```

### 私有部署支持

企业或个人可以指定自己的 Registry URL，建立私有应用商店，不依赖公共 Registry。

---

## 08 — 技术选型

### 内核与 Shell（宿主侧）

| 模块 | 选型 | 理由 |
|------|------|------|
| UI 框架 | React 18 + TypeScript | Concurrent Mode 对窗口管理有利 |
| 状态管理 | Zustand | 轻量、无样板代码 |
| 数据持久化 | Dexie.js (IndexedDB) | 支持 reactive query，离线优先 |
| IPC | 自研 KernelBus | postMessage 封装，双向 RPC |
| 动画 | Framer Motion | 窗口动画、Dock 弹簧效果 |
| 快捷键 | tinykeys | 650B，支持 Mac 符号 |
| 构建 | Vite + pnpm workspaces | Monorepo 支持 |

### SDK（App 侧）

| 模块 | 选型 |
|------|------|
| 核心通信 | 原生 postMessage（无依赖，8KB 以内） |
| 类型定义 | TypeScript Declaration |
| React 绑定 | `@vidorra/sdk-react`（可选） |

### Monorepo 结构

```
vidorra-os/
├── packages/
│   ├── kernel/       # 纯 TS，无 UI 依赖
│   ├── shell/        # React 组件，依赖 kernel
│   ├── sdk/          # 无框架依赖，<8KB gzip
│   └── sdk-react/    # React hooks 封装
├── apps/
│   ├── app-store/
│   ├── finder/
│   ├── settings/
│   └── notes/        # 示例 App
├── registry/
│   └── apps.json     # 公开 App 注册表
└── docs/
```

---

## 09 — 路线图

### P1 — 核心底座（0 → 8 周）

- WindowManager：拖拽、缩放、层级、最小化/最大化、动画
- iframe 沙箱容器（WindowFrame 组件）
- KernelBus：postMessage RPC 封装，双向通信
- AppRegistry：manifest 解析、本地安装/卸载
- Shell：Menubar（带时钟）、Dock（带 magnification）、桌面图标
- Spotlight：App 搜索、快速启动
- 右键菜单、通知系统
- SDK v0.1：window、notifications、menu:action
- 内置示例 App：Settings、Finder

### P2 — 数据层 + App Store（8 → 16 周）

- DataStore：IndexedDB + Dexie，命名空间隔离
- Permission Guard：安装时授权弹窗，运行时鉴权
- SDK 扩展：`data.collection()` API，实时订阅
- App Store App：读取 registry，安装/卸载流程
- 虚拟文件系统（VFS）
- ThemeEngine：CSS 变量系统，Dark Mode
- Self-Hosted Server（SQLite + WebSocket 同步）

### P3 — 生态建设（16 → 28 周）

- 开发者文档网站
- `@vidorra/create-app` 脚手架
- `@vidorra/sdk-react` hooks
- Spotlight 深度集成
- Mission Control（多窗口概览）
- 公开 Registry 仓库 + GitHub Actions 自动验证
- 公网分享 + `/app/xxx` 独立路由

### P4 — 高级特性（28 周之后）

- 分屏（Split View）
- Web Push 通知（Service Worker）
- PWA 支持
- Plugin API
- 端对端加密（E2EE）

---

## 10 — 风险与对策

### 技术风险

| 风险 | 影响 | 对策 |
|------|------|------|
| iframe CSP 限制（部分网站拒绝被 iframe 加载） | 中 | App 必须自己部署，不是嵌套外部网站；文档明确说明 |
| postMessage 性能（高频调用） | 低 | 数据层用批量读取；实时订阅做 debounce |
| IndexedDB 存储上限（Safari 约 1GB） | 中 | DataStore 做存储配额管理；大文件走 VFS + Blob 分片 |
| Safari 的 iframe Storage 限制 | 中 | App 的 Storage 需求通过 DataStore API 满足 |

### 产品风险

| 风险 | 影响 | 对策 |
|------|------|------|
| 开发者嫌 SDK 太复杂 | 高 | 最简 App 只需一个 URL + manifest.json，零 SDK 依赖也可运行 |
| 竞品（Puter）先发优势 | 中 | 差异化聚焦 macOS 审美 + 结构化数据层 |
| 维护者精力分散 | 高 | MVP 范围严格控制在 P1；设计文档开源，吸引贡献者 |

### 建议的第一步

从 WindowManager + KernelBus + iframe 沙箱开始，用一个最简的 "Hello World" App 验证通信机制。先跑通：

```
App → SDK → postMessage → KernelBus → WindowManager
```

这条链路，再展开其他模块。
