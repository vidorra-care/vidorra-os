# 系统上下文注入

## 职责

SystemContext 模块负责在每次 AI 调用前，收集当前系统状态并注入到 system prompt 中，让 AI 具备桌面感知能力。采用两阶段注入策略，控制 token 消耗。

---

## 两阶段注入策略

### 第一阶段（每次对话开头，自动注入）

注入轻量摘要，**上限 2000 token**：

```ts
interface SystemContext {
  // 时间
  datetime: string              // "2024-06-15 14:32 周六"

  // 窗口状态
  focusedApp: AppSummary | null // 当前聚焦的 App（含完整 schema）
  runningApps: AppSummary[]     // 运行中的 App（仅名称 + appId，无 schema）

  // 数据层（仅命名空间名称列表，无 schema）
  accessibleNamespaces: string[]

  // 用户偏好
  language: string              // "zh-CN"
  theme: 'light' | 'dark'
}
```

超出 2000 token 时截断 `runningApps`，聚焦 App 的 schema 优先保留。

### 第二阶段（AI 按需拉取）

AI 通过 `get_namespace_schema` 工具按需获取具体 schema，避免一次性注入全部 App 的 schema。

---

## 构建逻辑

```ts
function buildSystemContext(): SystemContext {
  const focusedAppId = getFocusedAppId()
  return {
    datetime: formatDatetime(new Date()),
    focusedApp: focusedAppId
      ? {
          ...appRegistry.getSummary(focusedAppId),
          schema: appRegistry.getFullSchema(focusedAppId),  // 聚焦 App 注入完整 schema
        }
      : null,
    runningApps: windowStore.getState().windows
      .filter(w => w.appId !== focusedAppId)
      .map(w => appRegistry.getSummary(w.appId))
      .filter(Boolean),
    accessibleNamespaces: authStore.getBuddyAccessibleNamespaces(),
    language: navigator.language,
    theme: themeEngine.getMode(),
  }
}
```

---

## 默认命名空间访问权

| 命名空间范围 | 默认权限 | 说明 |
|------------|---------|------|
| `com.vidorra.system:*` | 默认可读 | 主题、系统设置（只读） |
| `com.vidorra.buddy:*` | 默认可读写 | Buddy 自己的存储 |
| `com.global:*` | 默认不可访问 | 用户在 Settings > AI Buddy > 数据访问 中授权后可读 |
| 其他 App 命名空间 | 默认不可访问 | 用户逐个授权 |

每条授权记录存入 AuthStore，与普通 App 授权使用同一套机制。

---

## 上下文更新策略

- 每次用户发送消息时重新构建（不缓存，确保实时性）
- 上下文注入到 system prompt，不占用对话历史的 token

---

## 隐私边界

SystemContext 只注入：
- App 的名称和 ID（不含 App 内部数据）
- 聚焦 App 的 schema；其他 App 的 schema 仅在 AI 主动调用 `get_namespace_schema` 时返回
- 实际数据只在 AI 调用 `data_query` 工具时才读取，不预先注入
