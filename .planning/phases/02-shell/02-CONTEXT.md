# Phase 2: Shell 层 - Context

**Gathered:** 2026-04-01
**Status:** Ready for planning

<domain>
## Phase Boundary

实现可视化桌面环境：WindowManager + WindowFrame（拖拽/缩放/动画）、Dock（放大效果/右键菜单）、Menubar（App 名称 + 菜单占位 + 时钟）、Desktop（壁纸）、以及配套 Zustand stores。

**不包含：** KernelBus 通信（Phase 3）、SDK（Phase 4）、App 内部功能（Phase 5）。
Phase 2 的 App 窗口内容是 iframe 占位符，菜单项展示但不触发真实 action（Phase 3 后接入）。

</domain>

<decisions>
## Implementation Decisions

### 窗口行为

- 标题栏双击触发最大化/还原（macOS 原生行为）
- 最大化区域：全屏减去 Menubar 高度，Dock 仍然可见
- 窗口拖到屏幕边界外自动回弹（标题栏始终可见，拖动时边界检测后弹回）
- 最小尺寸：优先读 `manifest.minSize`，无则默认 `200×150`
- 点击窗口任意位置提升 z-index（聚焦）
- 新窗口打开位置：阶梯居中（每次 +20px/+20px 偏移，基于上一个窗口位置）
- 最小化动画：Phase 2 使用 Framer Motion 缩放+滑向 Dock 图标位置；Genie 效果作为后续独立增强阶段（WebGPU 方案，参见 canonical refs）
- 窗口控制按钮：红（关闭）/ 黄（最小化）/ 绿（最大化），位于标题栏左侧，macOS 风格

### Dock

- 图标基础大小 48px，hover 放大至 80px，影响范围 3-5 个相邻图标，弹簧过渡动画（Framer Motion spring）
- 固定在屏幕底部居中，毛玻璃背景（`backdrop-filter: blur`）
- 运行中 App 显示白色小圆点指示器（图标下方）
- 右键菜单（3 项）：
  - 未运行时：`打开`
  - 运行时：`打开` / `在 Dock 中隐藏` / `关闭`
- MVP 阶段 Dock 图标顺序固定，不支持拖拽排序
- Dock 图标来源：`appRegistry.getAllApps()`，显示所有已安装 App

### 初始状态

- Shell 首次启动自动弹出 Welcome 窗口（`localStorage` 记录 `vidorra:welcomed`，再次启动不再弹出）
- Dock 默认只显示 App Store（写入 `built-in-apps.json`），其他 App 安装后才出现
- Welcome App 本身不在 Dock 中（仅首次自动弹出）

### 主题集成

- Shell 使用 CSS 变量（ThemeEngine 已注入到 `document.documentElement`），组件直接引用 `var(--color-bg)` 等变量，无需订阅 ThemeEngine
- 主题切换无需 React 重新渲染，CSS 变量更新自动生效
- 毛玻璃效果（Menubar、Dock、窗口标题栏）使用 `backdrop-filter: blur(20px) saturate(180%)`

### 壁纸

- 默认壁纸：macOS 风格山脉图片（从 Unsplash 选取或本地预置）
- 预置 2-3 张壁纸（放入 `packages/shell/public/wallpapers/`）
- 支持用户在 Settings 中自定义上传（Settings App 实现，Phase 5）
- 壁纸 URL 存储在 `localStorage` 的 `vidorra:wallpaper`，Shell 启动时读取

### Menubar

- 高度 24px，固定在屏幕顶部，毛玻璃背景
- 左侧：Apple 图标（系统菜单占位）/ 当前聚焦 App 名称 / App 菜单项（从 `manifest.menubar` 读取，Phase 2 展示但点击不触发 action）
- 右侧：`HH:mm` 格式时钟，每分钟整点更新
- 无聚焦 App 时显示 `Vidorra OS` + 系统默认菜单
- Apple 图标点击弹出简单菜单：关于 Vidorra OS / 系统设置...（打开 Settings App）

### 桌面右键菜单

- 右键点击空白桌面弹出上下文菜单
- 菜单项：`关于 Vidorra OS` / `更改壁纸...`（打开 Settings App）/ `---` 分隔线 / `强制刷新`
- 位置跟随鼠标，超出屏幕边界自动调整方向

### Claude's Discretion

- 窗口阴影、圆角具体参数（参考 macos-web 项目风格）
- Framer Motion 动画曲线和持续时间参数
- Dock 弹簧动画的 stiffness / damping 数值
- CSS 变量命名（已由 ThemeEngine 定义，沿用）
- Menubar Apple 图标的具体 SVG

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### 整体设计参考

- `docs/plans/mvp-plan.md` — MVP 整体规划，Shell 层功能清单（阶段 2 节），包 结构，技术栈选型
- `docs/plans/2026-04-01-phase0-scaffolding-design.md` — 脚手架设计，目录结构，工具链版本
- `docs/plans/2026-04-01-phase1-kernel-design.md` — Kernel 层设计，ThemeEngine / AppRegistry 接口，单例导出方式

### 视觉参考

- `.reference/macos-web-main/` — macOS Web 模拟项目（Svelte 实现），用于对齐视觉语言：Dock 放大参数、窗口圆角、毛玻璃、整体色彩基调
  - `.reference/macos-web-main/src/components/Dock/` — Dock 放大动画实现
  - `.reference/macos-web-main/src/components/TopBar/` — Menubar 实现
  - `.reference/macos-web-main/src/components/Desktop/` — Desktop 布局

### Genie 效果（后续增强，Phase 2 不实现）

- `.reference/Macos-Genie-Effect-With-WebGPU-main/llms.md` — WebGPU + WGSL 着色器方案完整原理，正弦曲线变形 + 垂直移动两阶段动画
- `.reference/Macos-Genie-Effect-With-WebGPU-main/src/` — 完整实现代码
- Phase 2 先用 Framer Motion scale+translate 替代，Genie 作为独立后续 Phase 增强

### 类型定义

- `packages/types/src/window.ts` — `WindowDescriptor`, `WindowState`, `WindowRect` 类型
- `packages/types/src/manifest.ts` — `AppManifest` 类型，含 `defaultSize`, `minSize`, `menubar`
- `packages/kernel/src/app-registry.ts` — `AppRegistry` 类，`appRegistry` 单例
- `packages/kernel/src/theme-engine.ts` — `ThemeEngine` 类，CSS 变量注入逻辑

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- `packages/types/src/window.ts`：`WindowDescriptor` 已定义窗口完整状态结构，直接用于 `useWindowStore`
- `packages/types/src/manifest.ts`：`AppManifest.menubar` 定义了菜单结构，Menubar 组件直接消费
- `packages/kernel/src/app-registry.ts`：`appRegistry.getAllApps()` 供 Dock 和 App Store 消费
- `packages/kernel/src/theme-engine.ts`：CSS 变量已注入到 `:root`，组件无需额外操作

### Established Patterns

- 纯 TypeScript strict 模式，无 `any`
- 类 + 单例导出模式（kernel 层）
- ESM 模块（`"type": "module"`）
- 不使用 CSS-in-JS，使用 CSS Modules（`App.module.css` 已有示例）

### Integration Points

- `packages/shell/src/App.tsx`：当前占位符，Shell 根组件从这里展开
- `packages/shell/src/main.tsx`：React 入口
- `packages/shell/package.json`：已依赖 `@vidorra/kernel`、`@vidorra/types`，需补充 `zustand`、`framer-motion`、`react-rnd`

</code_context>

<specifics>
## Specific Ideas

- UI 对齐 `.reference/macos-web-main/` 项目的视觉语言，不是像素级复制，但风格基调一致
- 最小化动画：Phase 2 用 Framer Motion，后续独立 Phase 用 `.reference/Macos-Genie-Effect-With-WebGPU-main/` 的 WebGPU 方案增强
- 壁纸：默认山脉风格（macOS Sequoia 感），支持 Unsplash 来源或本地预置，Settings 支持用户上传
- 「只在首次启动显示 Welcome」逻辑：读 `localStorage['vidorra:welcomed']`，写入后不再自动弹出

</specifics>

<deferred>
## Deferred Ideas

- Genie 最小化效果 — 独立后续 Phase（WebGPU + WGSL 方案，参见 canonical refs）
- Dock 图标拖拽排序 — P2 特性，MVP 不实现
- Settings App 壁纸上传功能 — Phase 5
- Spotlight 全局搜索 — P2 特性
- Mission Control 多窗口概览 — P3 特性
- 窗口贴边自动排列（Snap）— 未提及，记录备用

</deferred>

---

*Phase: 02-shell*
*Context gathered: 2026-04-01*
