# Phase 5: Built-in Apps - Context

**Gathered:** 2026-04-03
**Status:** Ready for planning

<domain>
## Phase Boundary

实现 4 个内置应用（App Store、Settings、Calculator、Welcome），所有 app 以 React+Vite 项目形式开发，通过 Shell Vite proxy 在 iframe 中加载。

**包含：**
- App Store：卡片网格展示已安装应用 + 详情页 + URL 安装（模态弹窗）+ 卸载（拖拽垃圾桶 / 右键 / 详情页按钮）
- Settings：主题切换（Light/Dark/Auto）+ 壁纸预设缩略图 + 未来 app 设置的占位区域；两栏布局
- Calculator：零 SDK 依赖，macOS 风格 UI，基本四则运算（`12 + 34 * 5` 正确）
- Welcome：首次启动引导，"Get Started" 调用 `app.window.close()` 关闭窗口并设 `vidorra:welcomed`

**不包含：**
- JSON 驱动的前端应用生成器（延期想法）
- E2E 测试 / 动画调优（Phase 6）
- 任何新的 Shell 基础设施（WindowManager、Dock 核心逻辑已完成）

</domain>

<decisions>
## Implementation Decisions

### 交付架构
- **D-01:** 每个内置 app 是独立的 Vite+React 项目，开发时独立端口：
  - `apps/app-store` → :3010
  - `apps/settings` → :3011
  - `apps/calculator` → :3012（新建）
  - Welcome → 直接放在 `packages/shell/public/apps/welcome/`（已存在，改造为 React build 产物或保留为静态 HTML）
- **D-02:** Shell `vite.config.ts` 增加 proxy 规则：
  ```
  /apps/app-store/** → http://localhost:3010
  /apps/settings/**  → http://localhost:3011
  /apps/calculator/** → http://localhost:3012
  ```
- **D-03:** 构建时各 app Vite build 输出到 `packages/shell/public/apps/xxx/`；`built-in-apps.json` 的 entry URL 使用相对路径（如 `/apps/settings/index.html`），开发和生产复用同一 entry
- **D-04:** `built-in-apps.json` 需补充 Settings、Calculator、Welcome 的条目（含 entry、icon、defaultSize、minSize）

### SDK 使用
- **D-05:** App Store 使用 `@vidorra/sdk`：`app.ready()` + `app.theme.onChange()`（主题同步）+ `app.window.setTitle()`（可选）
- **D-06:** Settings 使用 `@vidorra/sdk`：`app.ready()` + `app.theme.onChange()`；主题切换通过 `themeEngine.setMode()` 直接调用（Settings 与 Kernel 同域，可直接 import）或通过 KernelBus 通知全局
- **D-07:** Welcome 使用 `@vidorra/sdk`：`app.ready()` + 点击"Get Started"后调用 `app.window.close()`；不需要主题同步（页面简单）
- **D-08:** Calculator 零 SDK 依赖——纯 React 或纯 HTML，不 import `@vidorra/sdk`

### App Store UI
- **D-09:** 整体布局：顶部工具栏（含"从 URL 安装"入口）+ 卡片网格；点击卡片进入详情页（页面内跳转，非新窗口）
- **D-10:** 详情页包含：app 图标、名称、版本、描述、卸载按钮
- **D-11:** 卸载方式三选：① 详情页"Uninstall"按钮 ② 右键卡片菜单中有"卸载"选项 ③ 拖拽卡片到垃圾桶（垃圾桶图标显示在 App Store 窗口内底部，拖拽悬停时高亮）
- **D-12:** 拖拽卸载的垃圾桶限定在 App Store 窗口内部，不修改 Shell Dock 区域（避免 Phase 5 扩大 Shell 范围）
- **D-13:** "从 URL 安装"：顶部或工具栏按钮触发模态弹窗，输入 manifest URL，点击 Install 后调用 `appRegistry.install(url)`，manifest 验证失败时弹窗内显示错误信息
- **D-14:** 安装成功后列表刷新（`appRegistry.getAllApps()` 重新拉取）

### Settings App
- **D-15:** 布局：两栏（左侧导航列表 + 右侧内容区），macOS 系统偏好设置风格
- **D-16:** 导航项（v1）：General（主题切换）、Wallpaper（壁纸选择）、（占位区域，预留未来各 app 设置）
- **D-17:** 壁纸选择：展示 `public/wallpapers/` 目录下的预设图片缩略图卡片（2-3 张），点击后写入 `localStorage['vidorra:wallpaper']` 并触发 Shell 壁纸更新
- **D-18:** 主题切换通过 Settings 直接调用 `themeEngine.setMode()`（Settings 与 Shell 同域），KernelBus push 会自动通知所有 iframe 同步

### Calculator
- **D-19:** macOS 风格 UI（数字键盘 + 运算符布局），暗色/亮色主题随 Shell 主题同步（通过 CSS 媒体查询 `prefers-color-scheme` 或读取 KernelBus push，但因零 SDK 依赖，使用 `prefers-color-scheme` 即可）
- **D-20:** 基本四则运算：加减乘除，支持小数；运算优先级正确（`12 + 34 * 5 = 182`）
- **D-21:** 零 SDK 依赖——不 import `@vidorra/sdk`，不调用 KernelBus

### Welcome App
- **D-22:** 全屏居中布局，欢迎文案 + Vidorra OS 品牌，底部"Get Started"按钮
- **D-23:** 点击"Get Started"：① 设置 `localStorage['vidorra:welcomed']` ② 调用 `app.window.close()` 关闭窗口
- **D-24:** 主题跟随（`app.theme.onChange()` 监听，切换 body class 或 CSS 变量）

### Claude's Discretion
- 各 app 内部组件拆分方式（是否用 Context、独立 hook 等）
- Calculator 的运算引擎实现（eval 安全包装 vs 手写 parser）
- App Store 卡片右键菜单实现方式（自定义 ContextMenu vs 原生 contextmenu 事件）
- Welcome app 是继续用静态 HTML 改造，还是重建为 React 项目（取决于 `app.window.close()` 的调用方式）

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Shell 集成点
- `packages/shell/src/App.tsx` — 内置 app 注册入口（`appRegistry.registerLocal()`）、Welcome 自动打开逻辑
- `packages/shell/vite.config.ts` — 需增加 proxy 规则
- `registry/built-in-apps.json` — 需补充 Settings、Calculator、Welcome 条目
- `packages/shell/src/components/WindowFrame/WindowFrame.tsx` — iframe 加载方式和 sandbox 属性

### Kernel API
- `packages/kernel/src/index.ts` — `appRegistry`、`themeEngine` 导出
- `packages/kernel/src/app-registry.ts` — `install(url)`、`uninstall(id)`、`getAllApps()`、`registerLocal()` 方法签名
- `packages/kernel/src/theme-engine.ts` — `setMode()`、`subscribe()` 方法

### SDK API
- `packages/sdk/src/index.ts` — `createApp()` 导出，`VidorraApp` 接口
- `packages/bus/src/index.ts` — KernelBusClient（SDK 内部使用）

### 现有 App 存根
- `apps/app-store/src/main.tsx` — 当前占位，Phase 5 从这里展开
- `apps/settings/src/main.tsx` — 当前占位
- `apps/app-store/vite.config.ts` — 端口 3010
- `apps/settings/vite.config.ts` — 端口 3011

### 资源目录
- `packages/shell/public/wallpapers/` — 壁纸预设图片
- `packages/shell/public/app-icons/` — 已有 app-store.svg、appstore-256.png
- `packages/shell/public/apps/welcome/index.html` — 当前 Welcome 占位 HTML

### 类型定义
- `packages/types/src/manifest.ts` — `AppManifest` 类型（含 entry、icon、defaultSize、minSize、menubar）

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `appRegistry.registerLocal(app)` — App.tsx 已用于启动时注册内置 app，Phase 5 继续扩充 built-in-apps.json
- `appRegistry.getAllApps()` — App Store 用于列出已安装 app
- `appRegistry.install(url)` / `appRegistry.uninstall(id)` — App Store 核心操作
- `themeEngine.setMode()` — Settings 直接调用，无需 KernelBus
- `WindowFrame`（`sandbox="allow-scripts allow-same-origin"`）— 所有 app 运行环境已就绪

### Established Patterns
- Framer Motion 动画（已在 Shell 广泛使用）
- CSS Module + CSS 变量主题系统（`var(--color-bg)` 等，已有 HSL 变量系统）
- 各 app 通过 `@vidorra/sdk` 的 `createApp()` 初始化，无需直接接触 KernelBus

### Integration Points
- `built-in-apps.json` — 新增 Settings、Calculator、Welcome 条目
- `Shell vite.config.ts` — 增加 proxy 规则
- `packages/shell/public/apps/` — Calculator、Settings build 产物输出目标

</code_context>

<specifics>
## Specific Ideas

- **卸载体验**：模仿 macOS Launchpad，垃圾桶限定在 App Store 窗口内（不改 Dock）
- **统一 app 设置入口**：所有 app 个性化设置未来汇聚到 Settings app（当前 Phase 5 仅预留导航占位）
- **App 类型**：所有内置 app 用 React 实现（除 Calculator 无 SDK 依赖外，其余均接入 @vidorra/sdk）

</specifics>

<deferred>
## Deferred Ideas

- **JSON 驱动前端生成**（用户提到"走 JSON 直接生成前端应用"）— 有趣的低代码方向，属于新能力，建议作为独立的 v2 阶段
- **各 app 细粒度设置**（如 Calculator 精度设置、App Store 分类过滤）— 预留 Settings 占位，实际内容留给后续
- **Shell 层垃圾桶**（Dock 旁显示垃圾桶，全局拖拽卸载）— Phase 5 垃圾桶仅在 App Store 窗口内；全局版属于 Shell 增强

</deferred>

---

*Phase: 05-built-in-apps*
*Context gathered: 2026-04-03*
