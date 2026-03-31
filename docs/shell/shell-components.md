# Shell 组件

## 概览

Shell 层是 Vidorra OS 的视觉外壳，所有组件基于 React 18 + Framer Motion，依赖 Kernel 层提供的数据和事件。

---

## Menubar

顶部菜单栏，始终显示在屏幕最顶部。

**内容**：
- 左侧：Apple Logo（系统菜单）+ 当前聚焦 App 的菜单项
- 右侧：系统状态栏（时钟、Wi-Fi、电量等）

**行为**：
- 监听 `app:focused` 事件，切换显示对应 App 的 menubar 定义
- 点击菜单项时，通过 KernelBus 向 App 发送 `menu:action` 事件
- 无 App 聚焦时显示 Finder 菜单

---

## Dock

底部应用启动栏。

**特性**：
- Magnification 动画（鼠标悬停时图标放大，Framer Motion spring）
- 运行指示器（App 运行时图标下方显示小圆点）
- 最小化窗口的 Genie 效果（P3）
- 支持拖拽排序

**数据来源**：AppRegistry 中标记为 `pinned: true` 的 App + 当前运行中的 App

---

## Spotlight

全局搜索面板，`⌘Space` 触发。

**搜索范围**：
- 已安装的 App（按名称）
- App 注册的 `spotlightActions`（按 keyword）
- DataStore 中的数据（App 选择性暴露）
- 系统设置项

**交互**：
- 输入时实时过滤
- 键盘导航（↑↓ 选择，Enter 执行，Esc 关闭）
- 执行 App 的 spotlightAction 时，通过 KernelBus 发送 `spotlight:action` 事件

**虚拟滚动（Pretext）**：

搜索结果是变高度列表（App 名称 + 描述长度不一）。使用 `@chenglou/pretext` 预计算每条结果的高度，支持精确虚拟滚动，结果数量多时不卡顿：

```ts
import { prepare, layout } from '@chenglou/pretext'

// 预计算所有搜索结果的高度
function measureResultHeights(results: SearchResult[], itemWidth: number) {
  return results.map(r => {
    const titleH = layout(preparedTitle, r.name, itemWidth).height
    const descH  = r.description ? layout(preparedDesc, r.description, itemWidth).height : 0
    return titleH + descH + 20 // padding
  })
}
```

---

## WindowFrame

包裹每个 App iframe 的容器组件。

**结构**：
```
WindowFrame
├── TitleBar（标题栏）
│   ├── TrafficLights（红黄绿按钮）
│   ├── Title（App 名称）
│   └── [可选] ToolbarArea（App 自定义工具栏区域）
├── ResizeHandles（8 个方向的缩放手柄）
└── IframeContainer
    └── <iframe sandbox="..." src={app.url} />
```

**拖拽**：TitleBar 作为拖拽手柄，使用 Framer Motion `drag`，限制在桌面可视区域内。

---

## Notifications

系统通知中心。

**Toast 通知**：
- 右上角弹出，3 秒后自动消失
- 支持点击回调（通过 KernelBus 转发给 App）
- 多条通知堆叠显示

**入场动画（Pretext）**：

Toast 的 body 文字长度不可控，直接做 `height: 0 → auto` 动画会闪烁。用 Pretext 预测量高度，动画从 `0 → 精确高度`：

```ts
const toastHeight = layout(preparedBody, notification.body, TOAST_WIDTH - 32).height + 64
animate(toastEl, { height: [0, toastHeight] }, { type: 'spring' })
```

**通知中心**：
- 点击右上角时钟区域展开
- 显示最近 50 条通知历史

---

## ContextMenu

右键菜单，支持两种来源：
1. **系统右键菜单**：桌面空白处右键
2. **App 自定义菜单**：App 通过 SDK 注册（P3）

---

## Desktop

桌面组件，负责：
- 渲染壁纸
- 管理桌面图标（已安装 App 的快捷方式）
- 接收右键菜单事件
- 作为所有 WindowFrame 的容器

---

## AI Buddy 面板

详见 [AI Buddy 文档](../ai-buddy/overview.md)。

在 Shell 层表现为：
- 浮动面板，默认停靠在右侧
- 可最小化为 Dock 中的图标
- 全屏模式（类似 Claude Code 的全屏终端）
- z-index 高于普通窗口，低于系统弹窗
