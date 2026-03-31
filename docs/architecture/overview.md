# 架构总览

## 一句话定义

Vidorra OS 是一个**运行在浏览器中的操作系统底座**。它不是一个应用，而是让其他应用存在的世界。

---

## 四层架构

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

---

## 核心设计原则

### 1. 底座即平台
内核只提供系统能力，不预设应用形态。所有具体功能由第三方 App 实现。

### 2. 沙箱优先
每个 App 运行在独立 iframe 中，有自己的 JS 运行时、CSS 作用域、localStorage。
通过受控 postMessage 协议与内核通信，互不污染。

### 3. 框架无关
App 可以用任何技术栈构建。SDK 是协议适配器，不是框架。

### 4. 数据互通
DataStore 打通应用间的数据孤岛。数据属于用户，存在 IndexedDB 中，App 只是视图。

### 5. macOS 审美
玻璃质感、精确阴影、流畅动画。用户不需要知道它是 Web 的。

### 6. 渐进增强
最简 App 只需一个 URL + manifest.json，零 SDK 依赖也可运行。SDK 是增强，不是必须。

---

## Monorepo 结构

```
vidorra-os/
├── packages/
│   ├── kernel/          # 纯 TS，无 UI 依赖
│   ├── shell/           # React 组件，依赖 kernel
│   ├── sdk/             # 无框架依赖，<8KB gzip
│   └── sdk-react/       # React hooks 封装（可选）
├── apps/
│   ├── app-store/       # 内置应用商店
│   ├── finder/          # 文件管理器
│   ├── settings/        # 系统设置
│   └── notes/           # 示例 App
├── registry/
│   └── apps.json        # 公开 App 注册表
└── docs/                # 本文档
```

---

## 关键技术选型

| 模块 | 选型 | 理由 |
|------|------|------|
| UI 框架 | React 18 + TypeScript | Concurrent Mode 对窗口管理有利 |
| 状态管理 | Zustand | 轻量、无样板代码 |
| 数据持久化 | Dexie.js (IndexedDB) | 支持 reactive query，离线优先 |
| IPC | 自研 KernelBus | postMessage 封装，双向 RPC |
| 动画 | Framer Motion | 窗口动画、Dock 弹簧效果 |
| 快捷键 | tinykeys | 650B，支持 Mac 符号 |
| 构建 | Vite + pnpm workspaces | Monorepo 支持 |

---

## 相关文档

- [分层详解](./layers.md)
- [安全模型](./security-model.md)
- [数据流](./data-flow.md)
