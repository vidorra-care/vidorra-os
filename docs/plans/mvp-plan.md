# Vidorra OS — MVP 实施计划

> 聚焦基础底座 + App Store + 内置应用
> 
> 目标：构建一个可运行的 Web Desktop OS，能够加载和管理第三方 App

---

## 目录

- [MVP 目标](#mvp-目标)
- [范围界定](#范围界定)
- [技术栈确认](#技术栈确认)
- [Monorepo 包结构](#monorepo-包结构)
- [阶段划分](#阶段划分)
- [内置应用列表](#内置应用列表)
- [不在 MVP 范围](#不在-mvp-范围)
- [交付检查清单](#交付检查清单)

---

## MVP 目标

交付一个**可运行的 Web Desktop OS**，具备以下能力：

1. ✅ 完整的 Shell 体验（Dock / Menubar / 桌面交互）
2. ✅ 窗口系统（拖拽 / 缩放 / 最小化 / 最大化 / 多窗口管理）
3. ✅ iframe 沙箱 + postMessage 通信机制（KernelBus）
4. ✅ App 注册表和安装/卸载机制
5. ✅ App Store（内置应用，支持从 manifest URL 安装）
6. ✅ 3-5 个内置示例 App（展示各类典型场景）
7. ✅ SDK v0.1（支持窗口控制、主题订阅、菜单响应）

**不追求完美，但必须可用。** 具体 App（如博客、记账本）另起项目开发，不在此项目中实现。

---

## 范围界定

### 包含在 MVP

| 模块 | 功能 | 优先级 |
|------|------|--------|
| **packages/kernel** | AppRegistry（读取 manifest）、ThemeEngine（CSS 变量系统）| P0 |
| **packages/shell** | WindowManager、Dock、Menubar、桌面壁纸 | P0 |
| **packages/sdk** | 核心通信层（postMessage 封装）、window API、theme API | P0 |
| **apps/app-store** | 展示已安装 App、从 URL 安装、卸载功能 | P0 |
| **apps/settings** | 系统设置：主题切换、壁纸选择 | P1 |
| **apps/welcome** | 首次启动欢迎屏 | P1 |
| **apps/calculator** | 简单计算器（无 SDK 依赖演示） | P1 |
| **apps/notes-demo** | 简单备忘录（演示 DataStore 基础用法）| P1 |

### 不包含在 MVP

- ❌ DataStore（P2 特性，MVP 先用 App 自带 localStorage）
- ❌ Permission Guard（P2，MVP 所有 App 默认授予所有权限）
- ❌ Spotlight（P2，MVP 通过 Dock 启动）
- ❌ Notifications（P2）
- ❌ FileSystem / VFS（P2）
- ❌ Self-Hosted Server（P2）
- ❌ AI Buddy（P3）
- ❌ 复杂业务应用（博客、记账本等，另起项目）

---

## 技术栈确认

| 层级 | 技术选型 | 理由 |
|------|----------|------|
| **Shell UI** | React 18 + TypeScript | 组件化窗口管理 |
| **状态管理** | Zustand | 轻量无样板，适合窗口状态 |
| **动画** | Framer Motion | 窗口缩放、Dock magnification |
| **IPC** | 原生 postMessage | 轻量，无外部依赖 |
| **构建** | Vite | 开发体验优秀，Monorepo 友好 |
| **包管理** | pnpm | workspace 支持 |
| **快捷键** | tinykeys | 650B，支持 Mac 符号 |
| **窗口拖拽/缩放** | react-rnd | 拖拽+8方向缩放开箱即用，避免自行实现导致的冲突 |

---

## Monorepo 包结构

```
vidorra-os/
├── packages/
│   ├── kernel/                  # 核心逻辑（纯 TS）
│   │   ├── src/
│   │   │   ├── app-registry.ts  # App 注册/安装/卸载
│   │   │   ├── theme-engine.ts  # CSS 变量管理
│   │   │   └── types.ts         # 全局类型定义
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── shell/                   # Shell UI（React）
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── Dock/
│   │   │   │   ├── Menubar/
│   │   │   │   ├── WindowManager/
│   │   │   │   ├── WindowFrame/
│   │   │   │   └── Desktop/
│   │   │   ├── stores/
│   │   │   │   ├── useWindowStore.ts
│   │   │   │   └── useAppStore.ts
│   │   │   ├── App.tsx
│   │   │   └── main.tsx
│   │   ├── index.html
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── vite.config.ts
│   │
│   ├── sdk/                     # App SDK（纯 JS）
│   │   ├── src/
│   │   │   ├── kernel-bus.ts    # postMessage 封装
│   │   │   ├── window-api.ts    # 窗口控制 API
│   │   │   ├── theme-api.ts     # 主题订阅 API
│   │   │   ├── create-app.ts    # 统一入口
│   │   │   └── types.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── types/                   # 共享类型定义
│       ├── src/
│       │   ├── manifest.ts
│       │   ├── window.ts
│       │   └── kernel-bus.ts
│       └── package.json
│
├── apps/
│   ├── app-store/               # 内置应用商店
│   │   ├── public/
│   │   │   ├── manifest.json
│   │   │   └── icon.svg
│   │   ├── src/
│   │   │   ├── App.tsx
│   │   │   └── main.tsx
│   │   ├── package.json
│   │   └── vite.config.ts
│   │
│   ├── settings/                # 系统设置
│   ├── welcome/                 # 欢迎屏
│   ├── calculator/              # 计算器（零依赖示例）
│   └── notes-demo/              # 备忘录（P2，DataStore 引入后再创建，MVP 阶段不建目录）
│
├── registry/
│   └── built-in-apps.json       # 内置 App 清单
│
├── docs/
│   ├── plans/
│   │   └── mvp-plan.md          # 本文档
│   └── ...
│
├── pnpm-workspace.yaml
├── package.json
├── tsconfig.json
└── README.md
```

---

## 阶段划分

### 阶段 0：脚手架搭建（1-2 天）

**目标**：搭建 Monorepo 基础结构，配置构建工具

- [ ] 初始化 pnpm workspace
- [ ] 配置 TypeScript 全局选项
- [ ] 配置 ESLint + Prettier（根目录共享配置，所有包继承）
- [ ] 配置 Vitest（根目录 workspace 模式，`packages/kernel` 优先覆盖）
- [ ] 创建 `packages/kernel`、`packages/shell`、`packages/sdk`、`packages/types` 空包
- [ ] 创建 `apps/app-store`、`apps/settings`、`apps/calculator` 空项目
- [ ] 配置 Vite（shell + 各 apps）
- [ ] 验证：`pnpm install` 成功，`pnpm --filter @vidorra/shell dev` 可启动空白页面

---

### 阶段 1：Kernel 层（2-3 天）

**目标**：实现核心系统逻辑（无 UI）

#### 1.1 AppRegistry

```ts
// packages/kernel/src/app-registry.ts

export interface AppManifest {
  id: string
  name: string
  version: string
  entry: string
  icon: string
  category: string
  defaultSize: { width: number; height: number }
  minSize?: { width: number; height: number }
  permissions?: string[]
  menubar?: Record<string, MenuItem[]>
  spotlightActions?: SpotlightAction[]
}

export class AppRegistry {
  private apps = new Map<string, AppManifest>()

  async install(manifestUrl: string): Promise<void>
  async uninstall(appId: string): Promise<void>
  getApp(appId: string): AppManifest | undefined
  getAllApps(): AppManifest[]
}
```

**交付标准**：可通过 URL 加载 manifest.json，校验必填字段，持久化到 localStorage。

#### 1.2 ThemeEngine

```ts
// packages/kernel/src/theme-engine.ts

export type ThemeMode = 'light' | 'dark' | 'auto'

export class ThemeEngine {
  private mode: ThemeMode = 'light'
  private mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
  
  setMode(mode: ThemeMode): void
  getMode(): ThemeMode
  
  // 返回当前实际生效的模式（auto 时根据 prefers-color-scheme 解析为 light/dark）
  getResolvedMode(): 'light' | 'dark'
  
  subscribe(callback: (mode: ThemeMode) => void): () => void
  
  // 注入 CSS 变量到 :root；auto 模式监听 mediaQuery.addEventListener('change', ...)
  private injectCSSVariables(): void
}
```

**交付标准**：切换 light/dark 时，CSS 变量自动更新，订阅者收到通知。

---

### 阶段 2：Shell 层（5-7 天）

**目标**：可视化桌面环境

#### 2.1 WindowManager + WindowFrame

```tsx
// packages/shell/src/components/WindowManager/WindowManager.tsx

interface WindowDescriptor {
  id: string
  appId: string
  title: string
  url: string
  icon: string
  rect: { x: number; y: number; width: number; height: number }
  state: 'normal' | 'minimized' | 'maximized'
  focused: boolean
  zIndex: number
}

export function WindowManager() {
  const windows = useWindowStore(s => s.windows)
  
  return (
    <>
      {windows.map(win => (
        <WindowFrame key={win.id} descriptor={win} />
      ))}
    </>
  )
}
```

**功能清单**：
- [ ] 窗口拖拽（标题栏拖动）
- [ ] 窗口缩放（8 个锚点）
- [ ] 最小化（收到 Dock，展示动画）
- [ ] 最大化（全屏 - 菜单栏高度）
- [ ] 关闭（从状态中移除）
- [ ] 点击聚焦（提升 z-index）
- [ ] 窗口动画（Framer Motion：打开/关闭/最小化）

**交付标准**：可同时打开多个窗口，正确处理层级，拖拽缩放无冲突。

#### 2.2 Dock

```tsx
// packages/shell/src/components/Dock/Dock.tsx

export function Dock() {
  const installedApps = useAppStore(s => s.installedApps)
  const runningApps = useWindowStore(s => s.runningApps)
  
  return (
    <motion.div className="dock">
      {installedApps.map(app => (
        <DockIcon
          key={app.id}
          app={app}
          isRunning={runningApps.includes(app.id)}
          onClick={() => launchApp(app.id)}
        />
      ))}
    </motion.div>
  )
}
```

**功能清单**：
- [ ] 固定在屏幕底部，居中显示
- [ ] 鼠标悬停放大效果（magnification）
- [ ] 运行中的 App 显示指示器（小圆点）
- [ ] 点击启动/聚焦/显示已最小化窗口
- [ ] 右键菜单（打开、退出、固定/取消固定）

**交付标准**：Dock 交互流畅，图标放大效果自然，运行状态正确显示。

#### 2.3 Menubar

```tsx
// packages/shell/src/components/Menubar/Menubar.tsx

export function Menubar() {
  const focusedWindow = useWindowStore(s => s.focusedWindow)
  const app = useAppStore(s => s.getApp(focusedWindow?.appId))
  
  return (
    <div className="menubar">
      <div className="left">
        <AppleIcon />
        <span className="app-name">{app?.name ?? 'Vidorra OS'}</span>
        {app?.menubar && <MenuItems items={app.menubar} />}
      </div>
      <div className="right">
        <Clock />
      </div>
    </div>
  )
}
```

**功能清单**：
- [ ] 左侧显示聚焦 App 的名称和菜单
- [ ] 右侧显示时钟（HH:mm 格式）
- [ ] 点击菜单项触发对应 App 的 `menu:action` 事件
- [ ] 无聚焦 App 时显示系统菜单

**交付标准**：菜单正确对应当前聚焦 App，点击触发 postMessage 事件。

#### 2.4 Desktop

```tsx
// packages/shell/src/components/Desktop/Desktop.tsx

export function Desktop() {
  return (
    <div className="desktop" style={{ backgroundImage: 'url(...)' }}>
      {/* 可放置桌面图标，MVP 阶段留空 */}
    </div>
  )
}
```

**交付标准**：有壁纸背景（默认提供 2-3 张），支持更换（Settings App）。

---

### 阶段 3：Bridge 层 — KernelBus（3-4 天）

**目标**：实现 Shell ↔ App 通信机制

#### 3.1 宿主侧（Shell）

```ts
// packages/shell/src/kernel-bus.ts

class KernelBusHost {
  private handlers = new Map<string, Handler>()
  
  constructor() {
    window.addEventListener('message', this.handleMessage)
  }
  
  // 已注册 iframe 的 contentWindow 集合，App 打开时注入
  private trustedSources = new Set<Window>()

  registerSource(iframeWindow: Window): void {
    this.trustedSources.add(iframeWindow)
  }

  unregisterSource(iframeWindow: Window): void {
    this.trustedSources.delete(iframeWindow)
  }

  private handleMessage = (event: MessageEvent) => {
    // 来源校验：只处理已注册的 iframe，拒绝未知来源
    if (!event.source || !this.trustedSources.has(event.source as Window)) return

    const { requestId, method, params } = event.data

    // 结构校验：防止格式异常的消息触发处理逻辑
    if (typeof requestId !== 'string' || typeof method !== 'string') return

    const handler = this.handlers.get(method)

    if (!handler) {
      this.sendResponse(event.source as Window, requestId, { error: 'unknown method' })
      return
    }

    const result = await handler(params)
    this.sendResponse(event.source as Window, requestId, { result })
  }
  
  register(method: string, handler: Handler): void
  private sendResponse(target: Window, requestId: string, data: any): void
}
```

**注册的方法**：
- `app.ready()` — App 加载完成信号（Shell 将此 iframe 标记为已就绪）
- `window.setTitle(title: string)`
- `window.resize(size: Size)`
- `window.close()`
- `window.minimize()`
- `window.maximize()`
- `theme.get()`

**交付标准**：App 调用 SDK 方法后，Shell 正确响应并执行操作。

#### 3.2 SDK 侧（App）

```ts
// packages/sdk/src/kernel-bus.ts

class KernelBusClient {
  private pendingRequests = new Map<string, Resolver>()
  
  constructor() {
    window.addEventListener('message', this.handleResponse)
  }
  
  async request<T>(method: string, params?: any): Promise<T> {
    const requestId = crypto.randomUUID()
    
    return new Promise((resolve, reject) => {
      this.pendingRequests.set(requestId, { resolve, reject })
      
      // 使用父页面的 origin，避免消息被第三方页面截获
      const targetOrigin = window.location.ancestorOrigins?.[0] ?? document.referrer
        ? new URL(document.referrer).origin
        : '*'

      window.parent.postMessage({
        requestId,
        method,
        params
      }, targetOrigin)
      
      setTimeout(() => {
        this.pendingRequests.delete(requestId)
        reject(new Error('timeout'))
      }, 5000)
    })
  }
  
  private handleResponse = (event: MessageEvent) => {
    const { requestId, result, error } = event.data
    const resolver = this.pendingRequests.get(requestId)
    if (!resolver) return
    
    this.pendingRequests.delete(requestId)
    error ? resolver.reject(error) : resolver.resolve(result)
  }
}
```

**交付标准**：SDK 调用 `kernelBus.request('window.setTitle', { title: 'Test' })` 后：
1. postMessage 发送到 parent
2. Shell 收到请求并执行
3. 响应返回，Promise resolve

---

### 阶段 4：SDK v0.1（2-3 天）

**目标**：提供简洁的 API 给 App 开发者

```ts
// packages/sdk/src/create-app.ts

import { KernelBusClient } from './kernel-bus'
import { WindowAPI } from './window-api'
import { ThemeAPI } from './theme-api'

export interface VidorraApp {
  ready(): Promise<void>
  window: WindowAPI
  theme: ThemeAPI
}

export function createApp(): VidorraApp {
  const bus = new KernelBusClient()
  
  return {
    async ready() {
      // 向 Shell 发送 'app.ready' 信号
      await bus.request('app.ready')
    },
    
    window: {
      setTitle: (title: string) => bus.request('window.setTitle', { title }),
      resize: (size: Size) => bus.request('window.resize', { size }),
      close: () => bus.request('window.close'),
      minimize: () => bus.request('window.minimize'),
      maximize: () => bus.request('window.maximize'),
    },
    
    theme: {
      get: () => bus.request('theme.get'),
      subscribe: (callback) => {
        // 监听 'theme.changed' 事件
        const handler = (event: MessageEvent) => {
          if (event.data.event === 'theme.changed') {
            callback(event.data.payload)
          }
        }
        window.addEventListener('message', handler)
        return () => window.removeEventListener('message', handler)
      }
    }
  }
}
```

**交付标准**：
- `pnpm build` 生成独立 ESM 包，体积 < 8KB gzip
- 有 TypeScript 类型定义
- 可通过 `import { createApp } from '@vidorra/sdk'` 引入

---

### 阶段 5：内置 Apps（4-5 天）

#### 5.1 App Store

**功能**：
- [ ] 展示已安装 App 列表（卡片布局）
- [ ] 「从 URL 安装」按钮 → 输入 manifest URL → 验证 → 安装
- [ ] 每个 App 卡片有「打开」「卸载」按钮
- [ ] 连接到 `registry/built-in-apps.json` 展示内置 App

**技术栈**：React + `@vidorra/sdk`

**交付标准**：可通过 App Store 安装外部 App（使用测试 manifest URL）。

#### 5.2 Settings（系统设置）

**功能**：
- [ ] 主题切换（Light / Dark / Auto）
- [ ] 壁纸选择（从预设列表中选择）
- [ ] 关于本机（显示版本号、架构说明）

**技术栈**：React + `@vidorra/sdk`

**交付标准**：切换主题后全局 CSS 变量更新，App 无需重启。

#### 5.3 Calculator（计算器）

**功能**：
- [ ] 基础四则运算
- [ ] macOS 风格 UI
- [ ] **零 SDK 依赖**（演示最简 App）

**技术栈**：纯 HTML + CSS + Vanilla JS

**manifest.json**：
```json
{
  "id": "com.vidorra.calculator",
  "name": "计算器",
  "version": "1.0.0",
  "entry": "http://localhost:3001",
  "icon": "./icon.svg",
  "category": "utility",
  "defaultSize": { "width": 300, "height": 400 },
  "minSize": { "width": 300, "height": 400 }
}
```

**交付标准**：可计算 `12 + 34 * 5`，显示正确结果。

#### 5.4 Welcome（欢迎屏）

**功能**：
- [ ] 首次启动时自动弹出
- [ ] 介绍 Vidorra OS 核心概念
- [ ] 「开始使用」按钮关闭窗口

**技术栈**：React + `@vidorra/sdk`

**交付标准**：首次启动 Shell 时自动打开，关闭后不再弹出（localStorage 记录）。

#### 5.5 Notes Demo（备忘录 Demo，可选 P2）

**功能**：
- [ ] 新建/编辑/删除笔记
- [ ] 数据存储在 App 自己的 localStorage（MVP）
- [ ] 演示 DataStore 用法（P2 引入 DataStore 后改造）

**技术栈**：React + `@vidorra/sdk`

**交付标准**：可创建笔记，刷新后数据不丢失。

---

### 阶段 6：集成测试 + Polish（2-3 天）

**目标**：打磨体验，修复 Bug

**测试清单**：
- [ ] 同时打开 5 个窗口，拖拽、缩放、层级正确
- [ ] 最小化到 Dock，点击恢复
- [ ] 通过 App Store 安装外部 App（提供测试 URL）
- [ ] 切换主题，所有窗口实时更新
- [ ] 窗口动画流畅（60fps）
- [ ] Dock magnification 无卡顿
- [ ] Menubar 时钟每分钟更新
- [ ] 关闭窗口后 Dock 图标状态更新

**Bug 修复优先级**：
1. P0：核心功能不可用（窗口无法打开）
2. P1：体验严重受损（动画卡顿、状态不同步）
3. P2：边缘 Case（快速连续点击导致的闪烁）

**交付标准**：无 P0/P1 Bug，P2 Bug 记录在 GitHub Issues。

---

## 内置应用列表

| App | 优先级 | 说明 |
|-----|--------|------|
| **App Store** | P0 | 必须有，否则无法安装其他 App |
| **Settings** | P0 | 必须有，显示系统可配置 |
| **Calculator** | P1 | 演示零依赖 App |
| **Welcome** | P1 | 首次体验引导 |
| **Notes Demo** | P2 | DataStore 示例（P2 引入 DataStore 后开发）|

**外部 App 示例**（不在此项目中实现，另起项目）：
- 博客系统（Next.js + Markdown）
- 记账本（Vue 3 + Charts）
- Todo List（Svelte）
- 天气预报（纯 HTML + Fetch API）

---

## 不在 MVP 范围

以下功能延后到 P2/P3：

### P2 延后功能
- DataStore（跨 App 数据层）
- Permission Guard（权限系统）
- Spotlight（全局搜索）
- Notifications（通知系统）
- FileSystem / VFS（虚拟文件系统）
- Self-Hosted Server（多端同步）
- Mission Control（多窗口概览）

### P3 延后功能
- AI Buddy
- PWA 支持
- Plugin API
- 公网分享（`/app/xxx` 路由）
- 分屏（Split View）
- E2EE

---

## 交付检查清单

MVP 完成标准（全部勾选后可发布 v0.1）：

### 核心功能
- [ ] 可同时运行 3+ 个 App
- [ ] 窗口拖拽、缩放、最小化、最大化、关闭全部正常
- [ ] Dock 运行状态指示正确
- [ ] Menubar 显示聚焦 App 的菜单
- [ ] 通过 App Store 可从 URL 安装外部 App
- [ ] 主题切换（Light/Dark）即时生效
- [ ] 所有内置 App（App Store / Settings / Calculator / Welcome）可用

### 开发者体验
- [ ] SDK 可通过 `pnpm add @vidorra/sdk` 安装
- [ ] SDK TypeScript 类型完整
- [ ] 有完整的 manifest.json 示例
- [ ] 有「构建你的第一个 App」教程
- [ ] 可通过 `pnpm create @vidorra/app` 创建项目（P2）

### 文档
- [ ] README.md 有清晰的 Quick Start
- [ ] 架构文档更新（反映实际实现）
- [ ] API 文档生成（TypeDoc，P2）
- [ ] 有至少 1 个完整的第三方 App 示例（外部项目）

### 技术指标
- [ ] Shell 首屏加载 < 2s（本地开发模式）
- [ ] 窗口动画保持 60fps
- [ ] SDK 体积 < 8KB gzip
- [ ] 浏览器兼容性：Chrome 90+ / Safari 15+ / Firefox 90+

### 部署
- [ ] 可通过 `pnpm build` 构建生产版本
- [ ] 可部署到静态托管（Vercel / Netlify）
- [ ] 有 Docker 镜像（P2）

---

## 风险与应对

| 风险 | 影响 | 应对 |
|------|------|------|
| postMessage 性能（高频通信） | 中 | MVP 阶段只实现低频 API（setTitle / resize），避免高频调用 |
| iframe CSP 限制（外部 App 无法加载） | 中 | 文档明确要求 App 自己部署，不支持嵌套有 CSP 限制的网站 |
| 窗口拖拽缩放冲突 | 高 | 使用成熟的拖拽库（react-draggable / @dnd-kit），减少自己实现的复杂度 |
| 开发周期超预期 | 高 | 严格控制范围，DataStore / Permission 等高级特性延后到 P2 |
| 团队精力分散 | 高 | MVP 阶段只有 1 个核心开发者，专注 Shell + SDK，内置 App 简化实现 |

---

## 下一步

1. **阶段 0**：搭建 Monorepo 基础结构（1-2 天）
2. **阶段 1**：实现 Kernel 层（AppRegistry + ThemeEngine）（2-3 天）
3. **阶段 2**：实现 Shell 层（WindowManager + Dock + Menubar）（5-7 天）
4. **阶段 3**：实现 KernelBus 通信机制（3-4 天）
5. **阶段 4**：实现 SDK v0.1（2-3 天）
6. **阶段 5**：实现内置 Apps（4-5 天）
7. **阶段 6**：集成测试 + Polish（2-3 天）

**总时长预估**：20-30 天（单人全职开发）

---

## 参考资源

- [架构总览](../architecture/overview.md)
- [manifest.json 规范](../sdk/manifest.md)
- [构建你的第一个 App](../guides/build-your-first-app.md)
- [安全模型](../architecture/security-model.md)
