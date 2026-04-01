# Vidorra OS

一个以 macOS 为美学基准的可扩展 Web 桌面操作系统底座。

任何技术栈的 Web App 都可以运行在其中——通过 iframe 沙箱隔离，通过 SDK 与系统通信，通过 DataStore 打通应用间的数据孤岛。

---

## 为什么是 Vidorra OS

现有的 Web Desktop 项目（Puter、OS.js、ProzillaOS）都在某个关键维度上妥协了。Vidorra OS 同时做到三件事：

- **macOS 级视觉审美** — 玻璃质感、精确阴影、弹簧动画，用户感知不到它是 Web 的
- **真正框架无关** — App 可以是 React、Vue、Svelte、Next.js，甚至纯 HTML，通过 iframe 沙箱完全隔离
- **结构化跨应用数据层** — 记账 App 的数据可以被图表 App 直接读取，数据属于用户，不属于 App

---

## 架构概览

```
┌─────────────────────────────────────────────┐
│  APP 层  博客  记账  天气  笔记  ...任意 App  │
└──────────────────┬──────────────────────────┘
                   │  iframe sandbox + postMessage
┌──────────────────▼──────────────────────────┐
│  BRIDGE 层  KernelBus · Permission Guard    │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│  SHELL 层   WindowManager · Dock · Menubar  │
│             Spotlight · Notifications        │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│  KERNEL 层  AppRegistry · DataStore         │
│             ThemeEngine · ShortcutManager   │
└─────────────────────────────────────────────┘
```

---

## 快速开始

```bash
git clone https://github.com/yourname/vidorra-os
cd vidorra-os
pnpm install
pnpm --filter @vidorra/shell dev
```

打开 `http://localhost:5173`。

---

## 构建你的第一个 App

最简 App 只需一个 URL 和一个 `manifest.json`，零 SDK 依赖：

```json
{
  "id": "com.yourname.hello",
  "name": "Hello World",
  "version": "1.0.0",
  "entry": "https://your-app.dev",
  "icon": "./icon.svg",
  "category": "utility",
  "defaultSize": { "width": 600, "height": 400 },
  "minSize": { "width": 300, "height": 200 }
}
```

需要与系统交互时，安装 SDK：

```bash
pnpm add @vidorra/sdk
```

```ts
import { createApp } from '@vidorra/sdk'

const app = createApp()
await app.ready()

app.window.setTitle('Hello Vidorra')

// 读写数据（需在 manifest 声明权限）
const notes = app.data.collection('com.yourname.app:notes')
await notes.insert({ id: crypto.randomUUID(), content: 'Hello' })
notes.subscribe(records => render(records))
```

完整教程：[构建你的第一个 App](./docs/guides/build-your-first-app.md)

---

## Self-Hosted

Vidorra OS 可以完全自托管，数据存在你自己的服务器：

```bash
docker run -p 3000:3000 -v ./data:/data ghcr.io/vidorra/server:latest
```

数据存在 `./data/vidorra.db`（SQLite），多设备通过 WebSocket 实时同步。

详见：[Self-Hosted & 多端同步](./docs/architecture/self-hosted.md)

---

## AI Buddy

系统内置 AI 助手，类似 Claude Code 的体验，但运行在 Web 桌面环境中：

- 感知当前桌面状态（哪些 App 在运行、聚焦的是什么）
- 自然语言操作系统（「帮我打开记账本，新建一条今天的午饭记录」）
- 工具调用透明，写入操作需用户逐次确认
- 流式输出，响应实时呈现

详见：[AI Buddy 文档](./docs/ai-buddy/overview.md)

---

## 文档

| | |
|--|--|
| [产品设计文档（PRD）](./docs/product/prd.md) | 市场定位、架构设计、路线图、风险分析 |
| [架构总览](./docs/architecture/overview.md) | 四层架构、核心设计决策 |
| [安全模型](./docs/architecture/security-model.md) | iframe 沙箱、权限系统、origin 鉴权 |
| [Self-Hosted & 多端同步](./docs/architecture/self-hosted.md) | 部署模式、同步策略、公网分享 |
| [SDK 概览](./docs/sdk/overview.md) | 安装、初始化、运行环境检测 |
| [manifest.json 规范](./docs/sdk/manifest.md) | 字段定义、权限声明、完整示例 |
| [DataStore 设计](./docs/kernel/data-store.md) | 命名空间、API、缓存策略 |
| [AI Buddy Prompt Engineering](./docs/ai-buddy/prompt-engineering.md) | 从 Claude Code 源码学到的 prompt 设计模式 |
| [完整文档索引](./docs/README.md) | 所有文档 |

---

## 技术栈

| 层 | 技术 |
|----|------|
| UI | React 18 + TypeScript |
| 状态 | Zustand |
| 数据持久化 | Dexie.js (IndexedDB) |
| IPC | 自研 KernelBus (postMessage) |
| 动画 | Framer Motion |
| 快捷键 | tinykeys |
| 服务端 | Bun + Hono + SQLite (Drizzle ORM) |
| 构建 | Vite + pnpm workspaces |

---

## 路线图

- **P1**（0–8 周）：WindowManager、iframe 沙箱、KernelBus、AppRegistry、Shell UI、Spotlight、SDK v0.1
- **P2**（8–16 周）：DataStore、Permission Guard、App Store、Self-Hosted Server
- **P3**（16–28 周）：开发者文档、脚手架 CLI、Mission Control、公网分享
- **P4**（28 周+）：PWA、Plugin API、E2EE

---

## 致谢

- [puruvj/macos-web](https://github.com/puruvj/macos-web) — macOS Web 桌面模拟项目，视觉语言参考
- [AnNingUI/Macos-Genie-Effect-With-WebGPU](https://github.com/AnNingUI/Macos-Genie-Effect-With-WebGPU) — WebGPU Genie 最小化动画方案
- [chenglou/pretext](https://github.com/chenglou/pretext) — 启发来源
- [Claude](https://claude.ai) — AI 编程助手，参与架构设计与实现

---

## License

MIT
