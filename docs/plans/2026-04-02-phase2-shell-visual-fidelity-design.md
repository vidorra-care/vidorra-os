# Phase 2 Shell 视觉还原设计文档

**日期：** 2026-04-02  
**背景：** Phase 2 基础 Shell 已完成（02-00 ~ 02-08，9 plans），但与 macOS 参考项目（`.reference/macos-preact-main`）在视觉和交互上存在明显差距。本文档描述 Phase 2 延伸方案（02-09 ~ 02-15），目标是完全对齐参考项目的外观和交互质量。

---

## 参考项目分析

参考项目：`.reference/macos-preact-main`（Preact + Jotai + SCSS Modules）

### 与当前 shell 的主要差距

| 方面 | 参考项目 | 当前 shell |
|------|---------|-----------|
| CSS 变量系统 | HSL 变量 + `body.dark` 类切换 | 简单 `--color-*`，无暗色模式 |
| Menubar | 完整下拉菜单 + ActionCenter 面板 | 仅显示 app 名 + 静态菜单项，无下拉 |
| TrafficLights | 精确颜色 + hover SVG 图标 + 失焦变灰 | 功能在但缺失 hover SVG 效果 |
| Dock running dot | 跟随主题色 (`--app-color-dark`) | 硬编码白色 |
| ContextMenu | 暗色模式双边框，文字跟主题 | 文字硬编码白色 |
| ActionCenter | 完整控制中心面板 | 缺失 |

---

## 实施策略

**方案：按组件逐块替换（方案 C）**

将工作拆成 7 个独立 plan，每个 plan 聚焦一个层次，可独立验证。作为 Phase 2 延伸，编号 02-09 ~ 02-15。

---

## Plan 02-09：CSS 基础层重构

**目标：** 完全复刻参考项目的 HSL CSS 变量体系，为后续所有组件提供设计令牌基础。

### 变更内容

**`packages/shell/src/global.css`**

- 引入所有 `--app-color-*-hsl` 变量（primary / dark / light / grey 50~900 系列）
- `body, body[data-theme='light']` 作为浅色模式默认
- `body.dark` 作为暗色模式覆盖
- 字体栈：`-apple-system, BlinkMacSystemFont, 'Inter', 'Helvetica Neue', 'Helvetica', 'Arial', sans-serif`
- 自定义光标变量（`--app-cursor-default` 等，指向 `/assets/cursors/`，暂用系统光标）
- 保留现有 `--color-*` 变量作为兼容层，不立即删除

### 关键变量

```css
/* Light (default) */
--app-color-primary: hsl(211, 100%, 50%);
--app-color-primary-hsl: 211, 100%, 50%;
--app-color-dark: hsl(240, 3%, 11%);
--app-color-dark-hsl: 240, 3%, 11%;
--app-color-light: hsl(240, 24%, 100%);
--app-color-light-hsl: 240, 24%, 100%;
--app-color-light-contrast: hsl(0, 0%, 11%);
--app-color-light-contrast-hsl: 0, 0%, 11%;
/* Dark override */
body.dark: dark/light 互换
```

**成功标准：** `body.dark` 类添加/移除时，所有使用 `--app-color-*` 的组件颜色自动反转。

---

## Plan 02-10：TrafficLights 视觉精确还原

**目标：** 红黄绿灯完全匹配 macOS 规格。

### 变更内容

**`packages/shell/src/components/WindowFrame/TrafficLights.tsx`**

- 三灯精确颜色：
  - 红：`#ff5f56` / border `#e0443e`
  - 黄：`#ffbd2e` / border `#dea123`
  - 绿：`#27c93f` / border `#1aab29`
- `data-focused={String(win.focused)}` 驱动：失焦时三灯颜色变 `hsla(var(--app-color-dark-hsl), 0.3)`
- hover 时显示 SVG 图标（× / − / ⤢），通过 CSS `.container:hover svg { visibility: visible }` 控制
- 绿灯图标 `transform: rotate(90deg)`
- 新增三个 SVG 常量文件：`CloseIcon.tsx` / `MinimizeIcon.tsx` / `MaximizeIcon.tsx`

**`packages/shell/src/components/WindowFrame/TrafficLights.module.css`**

完全按参考项目 CSS 重写，使用 `--app-color-*` 变量。

**成功标准：**
1. 三灯颜色与 macOS 截图目视一致
2. 失焦窗口三灯变灰
3. hover 时图标可见

---

## Plan 02-11：WindowFrame 视觉还原

**目标：** 窗口外观（标题栏、阴影、暗色边框）匹配参考项目。

### 变更内容

**`packages/shell/src/components/WindowFrame/WindowFrame.module.css`**

- 标题栏高度 `2.5rem`（当前 28px = 1.75rem）
- 标题栏背景：`hsla(var(--app-color-light-hsl), 0.3)` + `backdrop-filter: blur(12px) saturate(180%)`
- 窗口阴影（聚焦）：`0 33px 81px rgba(0,0,0,0.31)`
- 窗口阴影（失焦）：减半
- 暗色模式窗口内边框：`inset 0 0 0 0.9px hsla(var(--app-color-dark-hsl), 0.3), 0 0 0 1px hsla(var(--app-color-light-hsl), 0.5)`
- `border-radius: 0.75rem`（参考值，当前 12px 相近）

**成功标准：** 窗口在浅色/暗色模式下视觉均与参考一致。

---

## Plan 02-12：Dock 视觉还原

**目标：** Dock 样式完全匹配参考项目，running dot 响应主题。

### 变更内容

**`packages/shell/src/components/Dock/Dock.module.css`**

- `dockEl` 背景：`hsla(var(--app-color-light-hsl), 0.4)`
- `box-shadow` 三层：
  ```
  inset 0 0 0 0.2px hsla(var(--app-color-grey-100-hsl), 0.7),
  0 0 0 0.2px hsla(var(--app-color-grey-900-hsl), 0.7),
  hsla(0, 0%, 0%, 0.3) 2px 5px 19px 7px
  ```
- Running dot：`background-color: var(--app-color-dark)` 替代硬编码白色
- Tooltip 暗色模式双边框（`:global(body.dark) &` 选择器）
- Divider 样式（宽 0.2px，颜色 `hsla(var(--app-color-dark-hsl), 0.3)`）

**`packages/shell/src/components/Dock/Dock.tsx`**

- 支持 `dockBreaksBefore` 属性渲染 divider（从 app manifest 读取）

**`packages/types/src/index.ts`**（AppManifest）

- 新增可选字段 `dockBreaksBefore?: boolean`

**成功标准：**
1. Dock 玻璃效果在浅色/暗色模式下均正确
2. Running dot 在暗色模式下可见（黑底上的深色 dot 需验证对比度）

---

## Plan 02-13：Menubar + 下拉菜单系统

**目标：** 完整菜单系统，动态菜单项，键盘可访问。

### 架构

**新增 store：`packages/shell/src/stores/useMenubarStore.ts`**

```typescript
interface MenubarStore {
  activeMenu: string        // 当前展开的菜单 ID，'' 表示无
  setActiveMenu: (id: string) => void
}
```

**新增类型（`@vidorra/types`）：**

```typescript
interface MenuItem {
  title: string
  disabled?: boolean
  breakAfter?: boolean   // 分隔线
}

interface MenuConfig {
  [menuId: string]: {
    title: string
    menu: Record<string, MenuItem>
  }
}
```

**`AppManifest`** 新增可选字段：`menubar?: MenuConfig`

**新增文件：`packages/shell/src/data/finder.menu.config.ts`**

默认 Finder 菜单（苹果图标 + Finder + 文件/编辑/显示/前往/窗口/帮助），硬编码，作为无聚焦 app 时的默认菜单。

**重构 `packages/shell/src/components/Menubar/Menubar.tsx`**

- 拆分为：`MenuBar`（菜单按钮列表）+ `Menu`（下拉面板）
- `MenuBar`：
  - 苹果图标按钮（SVG，`mdi-apple` 替代或内联 path）
  - 当前聚焦 app 名称（加粗）
  - 动态菜单按钮列表
  - hover 时如已有菜单打开则切换（slidethrough）
  - 点击外部 / focus 离开时关闭
- `Menu` 面板：
  - `backdrop-filter: blur(25px)`，`min-width: 16rem`
  - 每个 item 可 hover 高亮（primary 蓝），disabled 项 50% 透明
  - `breakAfter` 渲染分隔线
  - 键盘导航：↑↓ 切换，Enter 触发，Escape 关闭（手动实现，不引入 react-roving-tabindex）

**`packages/shell/src/components/Menubar/Menubar.module.css`**

完全按参考项目 `Topbar.module.scss` + `MenuBar.module.scss` + `Menu.module.scss` 移植，转换为标准 CSS。

**成功标准：**
1. 点击菜单按钮弹出下拉面板
2. hover 切换菜单（已有菜单打开时）
3. 点击外部关闭
4. 键盘 ↑↓ 导航
5. 无聚焦 app 时显示 Finder 默认菜单

---

## Plan 02-14：ContextMenu 暗色模式完善

**目标：** ContextMenu 视觉对齐参考项目，响应主题。

### 变更内容

**`packages/shell/src/components/ContextMenu/ContextMenu.module.css`**

- 背景改为 `hsla(var(--app-color-light-hsl), 0.3)`
- 文字颜色：`hsla(var(--app-color-dark-hsl), 1)`（不再硬编码白色）
- 暗色模式双边框：`inset 0 0 0 0.9px` + `0 0 0 1.2px`
- hover 高亮：`var(--app-color-primary)` 蓝色
- separator：`hsla(var(--app-color-dark-hsl), 0.2)`

**成功标准：** ContextMenu 在浅色模式下文字为深色，暗色模式下文字为浅色，均清晰可读。

---

## Plan 02-15：ActionCenter 面板

**目标：** Menubar 右侧完整控制中心，深色模式切换功能完整。

### 架构

**新增 store：`packages/shell/src/stores/useThemeStore.ts`**

```typescript
interface ThemeStore {
  theme: 'light' | 'dark'
  setTheme: (t: 'light' | 'dark') => void
  toggleTheme: () => void
}
```

setTheme 副作用：
1. 调用 `themeEngine.setMode(t)`
2. 同步 `document.body.classList.toggle('dark', t === 'dark')`
3. 持久化到 `localStorage['vidorra:theme']`

**新增组件：**

- `packages/shell/src/components/ActionCenter/ActionCenter.tsx`
- `packages/shell/src/components/ActionCenter/ActionCenter.module.css`
- `packages/shell/src/components/ActionCenter/ActionCenterToggle.tsx`

**ActionCenter 面板布局（对齐参考）：**

- 宽度 19.5rem，圆角 1rem，磨玻璃背景
- 12 列 grid 布局
- Tile 1（Wi-Fi）：装饰性，显示 on 状态
- Tile 2（蓝牙）：装饰性，显示 on 状态
- Tile 3（AirDrop）：装饰性，显示 off 状态
- Tile 4（深色模式）：**实际功能**，调用 `useThemeStore.toggleTheme()`

**`packages/shell/src/components/Menubar/Menubar.tsx`**

- 右侧添加 ActionCenterToggle 按钮（开关图标 SVG）
- 时钟移到 ActionCenterToggle 右侧

**ThemeEngine 打通：**

- `packages/shell/src/main.tsx`：启动时读取 `localStorage['vidorra:theme']`，初始化 `body.dark` 类

**成功标准：**
1. 点击 toggle 按钮弹出面板
2. 点击深色模式 tile 切换主题，`body.dark` 类变化，所有组件颜色响应
3. 点击面板外部关闭
4. 刷新后主题持久

---

## 关键架构决策

1. **ThemeEngine ↔ body.dark 打通**：`useThemeStore.setTheme()` 同时调用 `themeEngine.setMode()` 和操作 `body.classList`，两个系统保持同步。

2. **菜单数据动态化**：`AppManifest` 增加可选 `menubar: MenuConfig` 字段。Phase 2 提供 Finder 默认配置。Phase 4 SDK 后 app 可注入自定义菜单。

3. **不引入新依赖**：保持 Zustand，手动实现键盘导航（不引入 react-roving-tabindex），避免增加 bundle size。

4. **CSS 系统不破坏现有**：先添加新变量，后续各 plan 逐步迁移各组件，不一次性删除旧变量。

---

## 文件变更清单

| 文件 | 操作 | Plan |
|------|------|------|
| `packages/shell/src/global.css` | 重写 | 02-09 |
| `packages/shell/src/components/WindowFrame/TrafficLights.tsx` | 重写 | 02-10 |
| `packages/shell/src/components/WindowFrame/TrafficLights.module.css` | 重写 | 02-10 |
| `packages/shell/src/components/WindowFrame/TrafficLightIcons.tsx` | 新增 | 02-10 |
| `packages/shell/src/components/WindowFrame/WindowFrame.module.css` | 更新 | 02-11 |
| `packages/shell/src/components/Dock/Dock.module.css` | 重写 | 02-12 |
| `packages/shell/src/components/Dock/Dock.tsx` | 更新 | 02-12 |
| `packages/types/src/index.ts` | 更新（添加字段） | 02-12 |
| `packages/shell/src/stores/useMenubarStore.ts` | 新增 | 02-13 |
| `packages/shell/src/data/finder.menu.config.ts` | 新增 | 02-13 |
| `packages/shell/src/components/Menubar/Menubar.tsx` | 重写 | 02-13 |
| `packages/shell/src/components/Menubar/Menubar.module.css` | 重写 | 02-13 |
| `packages/shell/src/components/Menubar/Menu.tsx` | 新增 | 02-13 |
| `packages/shell/src/components/Menubar/Menu.module.css` | 新增 | 02-13 |
| `packages/shell/src/components/ContextMenu/ContextMenu.module.css` | 更新 | 02-14 |
| `packages/shell/src/stores/useThemeStore.ts` | 新增 | 02-15 |
| `packages/shell/src/components/ActionCenter/ActionCenter.tsx` | 新增 | 02-15 |
| `packages/shell/src/components/ActionCenter/ActionCenter.module.css` | 新增 | 02-15 |
| `packages/shell/src/components/ActionCenter/ActionCenterToggle.tsx` | 新增 | 02-15 |
| `packages/shell/src/main.tsx` | 更新（主题初始化） | 02-15 |
