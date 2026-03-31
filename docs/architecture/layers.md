# 分层详解

## Kernel 层

纯 TypeScript，无任何 UI 依赖。可独立于 React 运行，便于单元测试。

| 模块 | 职责 |
|------|------|
| AppRegistry | 读取/校验 manifest.json，管理已安装 App 列表，提供安装/卸载/启动/停止接口 |
| DataStore | 基于 IndexedDB 的结构化跨 App 数据存储，命名空间隔离，权限控制 |
| AuthStore | 用户身份、权限授权记录持久化 |
| ThemeEngine | 系统级 CSS 变量管理，Dark Mode，accent 颜色 |
| ShortcutManager | 全局快捷键注册中心，将键盘事件路由到聚焦 App 的 iframe |
| FileSystem (VFS) | 虚拟文件系统，App 间共享文件，Blob 分片存储 |

---

## Shell 层

React 组件，依赖 Kernel 层。负责所有可见 UI。

| 模块 | 职责 |
|------|------|
| WindowManager | 窗口生命周期、z-index、拖拽、缩放、最小化/最大化、动画 |
| Dock | 应用启动栏，magnification 动画，运行指示器 |
| Menubar | 顶部菜单栏，显示聚焦 App 的菜单项，系统时钟 |
| Spotlight | 全局搜索，App 快速启动，支持 App 深度集成 |
| Wallpaper | 桌面壁纸管理 |
| Notifications | 系统通知中心，Toast 弹出 |
| ContextMenu | 右键菜单，支持 App 自定义菜单项 |
| WindowFrame | 包裹 iframe 的容器组件，提供标题栏、控制按钮 |

---

## Bridge 层

连接 Shell 与 App 的消息总线。所有跨 iframe 通信必须经过此层。

| 模块 | 职责 |
|------|------|
| KernelBus | postMessage RPC 封装，双向通信，request/response 模型，超时处理 |
| Permission Guard | 拦截所有 App 请求，校验 origin 和权限，通过则转发，拒绝则返回 403 |
| DataStore API | 将 DataStore 的 IndexedDB 操作暴露为 postMessage 接口 |
| EventEmitter | 内核主动向 App 推送事件（主题变化、快捷键触发、菜单 action 等） |

---

## App 层

完全沙箱化的第三方应用。每个 App 是独立的浏览器上下文。

- 运行在 `<iframe sandbox="...">` 中
- 通过 `postMessage` 与 KernelBus 通信
- 可使用任意技术栈（React、Vue、Svelte、Angular、纯 HTML）
- 通过 `manifest.json` 声明权限、菜单、快捷键、数据 schema

---

## AI Buddy 层

系统内置的 AI 助手，类似 Claude Code / OpenClaw 的体验。

| 模块 | 职责 |
|------|------|
| BuddyCore | 与 AI 模型通信，管理对话上下文，流式输出 |
| BuddyShell | 浮动面板 UI，可最小化到 Dock，支持全屏模式 |
| SystemContext | 向 AI 注入系统上下文（当前聚焦 App、打开的窗口、DataStore schema） |
| ToolExecutor | AI 可调用的系统工具（打开 App、读写 DataStore、执行 Spotlight 搜索） |
| PermissionBridge | AI 操作同样经过 Permission Guard，不绕过权限系统 |

详见 [AI Buddy 设计文档](../ai-buddy/overview.md)
