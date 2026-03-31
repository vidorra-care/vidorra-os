# ShortcutManager

## 职责

全局快捷键注册中心。当 App 聚焦时，将键盘事件路由到该 App 的 iframe 内。

---

## 快捷键来源

1. **系统快捷键**：硬编码在 Shell 中，始终生效
2. **App 快捷键**：来自 manifest.json 的 `menubar` 字段，App 聚焦时激活

---

## 系统快捷键

| 快捷键 | 动作 |
|--------|------|
| `⌘Space` | 打开 / 关闭 Spotlight |
| `⌃↑` | Mission Control |
| `⌘⌥Esc` | 强制退出当前 App |
| `⌘H` | 隐藏当前 App |
| `⌘M` | 最小化当前窗口 |
| `⌘W` | 关闭当前窗口 |
| `⌘,` | 打开当前 App 的偏好设置（如果有） |
| `⌘Tab` | 切换 App（App Switcher） |

---

## App 快捷键路由

iframe 内的键盘事件默认不会冒泡到宿主页面。ShortcutManager 通过以下方式处理：

```ts
// 方案：监听 iframe 的 focus，在宿主侧拦截快捷键
// App 聚焦时，宿主侧注册该 App 的快捷键
function activateAppShortcuts(appId: AppId) {
  const manifest = appRegistry.getManifest(appId)
  const shortcuts = extractShortcutsFromMenubar(manifest.menubar)

  currentAppShortcuts = tinykeys(window, shortcuts.reduce((acc, { shortcut, action }) => ({
    ...acc,
    [shortcut]: (e) => {
      e.preventDefault()
      kernelBus.emit(appId, { type: 'event', name: 'menu:action', payload: { action } })
    }
  }), {}))
}

// App 失焦时，注销快捷键
function deactivateAppShortcuts() {
  currentAppShortcuts?.()  // tinykeys 返回注销函数
  currentAppShortcuts = null
}
```

---

## 快捷键格式

使用 tinykeys 格式，支持 Mac 符号：

```
CmdOrCtrl+N    →  ⌘N（Mac）/ Ctrl+N（Windows/Linux）
CmdOrCtrl+,    →  ⌘,
Shift+CmdOrCtrl+Z  →  ⇧⌘Z
```
