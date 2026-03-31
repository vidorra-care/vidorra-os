# ThemeEngine

## 职责

管理系统级 CSS 变量（颜色、圆角、字体、模糊量）。支持浅色/深色模式，支持 accent 颜色自定义。App 可订阅主题变化，实现无缝切换。

---

## CSS 变量系统

所有视觉 token 通过 CSS 变量暴露，Shell 和 App 都可以使用：

```css
:root {
  /* 颜色 */
  --vos-bg:           #f5f5f7;
  --vos-bg-elevated:  rgba(255,255,255,0.72);
  --vos-bg-overlay:   rgba(255,255,255,0.85);
  --vos-text:         #1d1d1f;
  --vos-text-secondary: #6e6e73;
  --vos-accent:       #0071e3;
  --vos-accent-hover: #0077ed;
  --vos-border:       rgba(0,0,0,0.1);
  --vos-shadow:       0 2px 20px rgba(0,0,0,0.12);

  /* 玻璃质感 */
  --vos-blur:         20px;
  --vos-blur-heavy:   40px;

  /* 圆角 */
  --vos-radius-sm:    6px;
  --vos-radius-md:    10px;
  --vos-radius-lg:    14px;
  --vos-radius-xl:    20px;

  /* 字体 */
  --vos-font-sans:    -apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif;
  --vos-font-mono:    'SF Mono', 'Fira Code', monospace;

  /* 动画 */
  --vos-duration-fast:   150ms;
  --vos-duration-normal: 250ms;
  --vos-duration-slow:   400ms;
  --vos-ease:            cubic-bezier(0.4, 0, 0.2, 1);
  --vos-spring:          cubic-bezier(0.34, 1.56, 0.64, 1);
}

[data-theme="dark"] {
  --vos-bg:           #1c1c1e;
  --vos-bg-elevated:  rgba(44,44,46,0.72);
  --vos-bg-overlay:   rgba(44,44,46,0.85);
  --vos-text:         #f5f5f7;
  --vos-text-secondary: #98989d;
  --vos-border:       rgba(255,255,255,0.1);
  --vos-shadow:       0 2px 20px rgba(0,0,0,0.4);
}
```

---

## App 订阅主题

App 通过 SDK 订阅主题变化：

```ts
// 订阅
app.theme.subscribe(({ mode, tokens }) => {
  document.documentElement.dataset.theme = mode  // 'light' | 'dark'
  // tokens 包含所有 CSS 变量的当前值
})

// 一次性获取
const theme = await app.theme.get()
```

App 也可以直接使用 CSS 变量（推荐），无需 JS 订阅：

```css
.my-panel {
  background: var(--vos-bg-elevated);
  backdrop-filter: blur(var(--vos-blur));
  border-radius: var(--vos-radius-lg);
  box-shadow: var(--vos-shadow);
}
```

---

## 主题持久化

当前主题存储在 DataStore 的 `com.vidorra.system:theme` 命名空间，App 只读。
用户在 Settings App 修改主题后，ThemeEngine 更新 CSS 变量并推送给所有订阅的 App。
