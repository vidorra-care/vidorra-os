# 安全模型

## 核心原则

**永远用 `event.origin` 鉴权，不信任 `event.data` 中的任何身份声明。**

---

## iframe 沙箱边界

每个 App 的 iframe 按 manifest 声明的权限动态生成 `sandbox` 属性：

```ts
// 基础权限（所有 App 都有）
const BASE_FLAGS = ['allow-scripts', 'allow-forms']

// 按需追加（manifest.permissions 声明后才给）
const PERMISSION_TO_FLAG: Record<string, string> = {
  'filesystem.read':  'allow-downloads',
  'popups.open':      'allow-popups',
  'same-origin':      'allow-same-origin',  // 谨慎授予
}

function buildSandboxAttr(permissions: string[]): string {
  const flags = new Set(BASE_FLAGS)
  for (const perm of permissions) {
    const flag = PERMISSION_TO_FLAG[perm]
    if (flag) flags.add(flag)
  }
  return [...flags].join(' ')
}
```

**不给 `allow-same-origin`** 除非 App 明确声明且用户确认——否则 App 可以访问宿主页面的 DOM。

---

## origin → AppId 映射

KernelBus 在 App 安装时建立映射，运行时只信任此映射：

```ts
// 安装时注册
kernelBus.registerApp({
  appId: 'com.example.budget',
  origin: new URL(manifest.entry).origin,  // 从 manifest 提取，不信任 App 自报
  permissions: manifest.permissions,
})

// 收到消息时
window.addEventListener('message', (event) => {
  const ctx = originMap.get(event.origin)
  if (!ctx) return  // 未知 origin，静默丢弃

  permissionGuard.check(ctx, request)
})
```

---

## 三级权限规则

```
alwaysAllow  →  无需弹窗，直接执行
alwaysAsk    →  安装时弹窗，用户确认后写入 AuthStore
alwaysDeny   →  永远拒绝，无论用户是否同意
```

| 权限 | 级别 | 说明 |
|------|------|------|
| `window.*` | alwaysAllow | 窗口控制，无风险 |
| `notifications.send` | alwaysAllow | 发通知 |
| `theme.get` | alwaysAllow | 读主题 |
| `datastore.read:自己的命名空间` | alwaysAllow | 读自己的数据 |
| `datastore.write:自己的命名空间` | alwaysAllow | 写自己的数据 |
| `datastore.read:其他 App 数据` | alwaysAsk | 跨 App 读取，需用户授权 |
| `datastore.write:com.global:*` | alwaysDeny | 全局数据只读，防止污染 |
| `filesystem.read` | alwaysAsk | 读文件系统 |
| `filesystem.write` | alwaysAsk | 写文件系统 |

---

## DataStore 写入校验

App 写入数据时，KernelBus 在宿主侧用 Zod 校验 schema，不信任 App 传来的数据结构：

```ts
// manifest.exposes 中声明的 schema 在安装时预编译
const validator = z.object({ ...schemaFromManifest })

async function handleDataInsert(ctx: AppPermissionContext, payload: unknown) {
  const result = validator.safeParse(payload)
  if (!result.success) {
    return { error: 'schema 校验失败', details: result.error.flatten() }
  }
  await dataStore.insert(ctx.appId, result.data)
}
```

---

## AI Buddy 的安全边界

AI Buddy 的工具调用同样经过 Permission Guard，不绕过权限系统：

- AI 以系统身份（`com.vidorra.buddy`）运行，有自己的权限集
- AI 调用工具前，ToolExecutor 向用户展示确认弹窗（类似 Claude Code 的工具确认）
- 敏感操作（写入 DataStore、安装 App）需要用户明确确认
- AI 无法访问其他 App 的私有数据，除非用户授权
