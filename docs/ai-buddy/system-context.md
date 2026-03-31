# 系统上下文注入

## 职责

SystemContext 模块负责在每次 AI 调用前，收集当前系统状态并注入到 system prompt 中，让 AI 具备桌面感知能力。

---

## 注入的上下文

```ts
interface SystemContext {
  // 时间
  datetime: string              // "2024-06-15 14:32 周六"

  // 窗口状态
  runningApps: AppSummary[]     // 所有运行中的 App
  focusedApp: AppSummary | null // 当前聚焦的 App

  // 数据层（Buddy 有权访问的命名空间）
  accessibleNamespaces: {
    namespace: string
    description: string         // 来自 manifest.exposes
    schema: object              // JSON Schema
  }[]

  // 用户偏好（可选）
  language: string              // "zh-CN"
  theme: 'light' | 'dark'
}
```

---

## 构建逻辑

```ts
function buildSystemContext(): SystemContext {
  return {
    datetime: formatDatetime(new Date()),
    runningApps: windowStore.getState().windows
      .map(w => appRegistry.getSummary(w.appId))
      .filter(Boolean),
    focusedApp: windowStore.getState().focusedId
      ? appRegistry.getSummary(getFocusedAppId())
      : null,
    accessibleNamespaces: authStore.getBuddyAccessibleNamespaces()
      .map(ns => ({
        namespace: ns,
        description: appRegistry.getNamespaceDescription(ns),
        schema: appRegistry.getNamespaceSchema(ns),
      })),
    language: navigator.language,
    theme: themeEngine.getMode(),
  }
}
```

---

## 上下文更新策略

- 每次用户发送消息时重新构建（不缓存，确保实时性）
- 上下文注入到 system prompt，不占用对话历史的 token
- schema 信息较大时，只注入 Buddy 实际需要的命名空间的 schema

---

## 隐私边界

SystemContext 只注入：
- App 的名称和 ID（不含 App 内部数据）
- 用户明确授权 Buddy 访问的命名空间的 schema（不含实际数据）

实际数据只在 AI 调用 `data_query` 工具时才读取，不预先注入。
