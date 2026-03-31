# WindowManager

## 职责

管理所有窗口的完整生命周期：创建、聚焦、拖拽、缩放、最小化、最大化、关闭，以及窗口层级（z-index）。

---

## 窗口描述符

```ts
interface WindowDescriptor {
  id: WindowId
  appId: AppId
  title: string
  url: string              // 加载到 iframe.src 的 App URL
  icon: string             // SVG 或图片 URL
  rect: WindowRect
  state: 'normal' | 'minimized' | 'maximized' | 'fullscreen'
  focused: boolean
  zIndex: number
  sandboxFlags: string[]   // 按 manifest.permissions 动态生成
  parentId?: WindowId      // 子窗口（modal）的父窗口 ID
}

interface WindowRect {
  x: number
  y: number
  width: number
  height: number
  minWidth: number
  minHeight: number
}
```

---

## 状态管理

WindowManager 使用 Zustand store，所有窗口状态集中管理：

```ts
interface WindowStore {
  windows: WindowDescriptor[]
  focusedId: WindowId | null
  zIndexCounter: number
}
```

**关键原则**：
- 拖拽时只更新 `rect`，不重建整个 `windows` 数组
- 使用 `Object.is()` 相等检查，避免无效渲染
- z-index 单调递增，聚焦时取当前最大值 + 1

---

## 窗口操作

### 打开窗口

```ts
windowManager.open({
  appId: 'com.example.budget',
  url: 'https://budget.example.com',
  title: '记账本',
  icon: '...',
  rect: { x: 100, y: 80, width: 900, height: 600, minWidth: 400, minHeight: 300 },
  sandboxFlags: buildSandboxAttr(manifest.permissions),
})
```

### 聚焦

聚焦时：
1. 更新 `focusedId`
2. 将该窗口 `zIndex` 设为 `zIndexCounter + 1`
3. 触发 `app:focused` 事件，Menubar 和 ShortcutManager 响应

### 拖拽

拖拽使用 Framer Motion 的 `drag` 约束，限制在桌面可视区域内：

```ts
// 拖拽结束时更新 store（不在拖拽过程中频繁写 store）
onDragEnd: (_, info) => {
  windowManager.updateRect(windowId, {
    x: info.point.x,
    y: info.point.y,
  })
}
```

### 最小化 / 最大化

- 最小化：记录当前 `rect` 到 `_savedRect`，隐藏窗口（不销毁 iframe，保持 App 状态）
- 最大化：`rect` 设为桌面可用区域（减去 Menubar 和 Dock 高度）
- 还原：从 `_savedRect` 恢复

---

## 窗口层级规则

```
系统弹窗（权限确认、错误提示）  z-index: 9000+
AI Buddy 面板                   z-index: 8000+
Spotlight                       z-index: 7000+
通知 Toast                      z-index: 6000+
右键菜单                        z-index: 5000+
普通窗口                        z-index: 100 ~ 4999（动态分配）
桌面图标                        z-index: 10
壁纸                            z-index: 1
```

---

## Mission Control（P3）

Mission Control 展示所有窗口的缩略图快照：

- 窗口快照通过 CSS `scale` 变换实现，不截图
- 动画用 Framer Motion 的 `layoutId` 实现平滑过渡
- 快捷键：`⌃↑`（Control + 上箭头）

---

## 相关文档

- [Shell 组件](../shell/shell-components.md)
- [ADR-0002 iframe 沙箱](../adr/0002-iframe-sandboxing.md)
