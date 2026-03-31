# AppRegistry

## 职责

管理已安装的 App 列表。读取并校验每个 App 的 `manifest.json`，提供安装、卸载、启动、停止接口。

---

## manifest.json 规范

每个 App 必须在其部署根目录提供 `manifest.json`：

```json
{
  "id": "com.yourname.budget",
  "name": "记账本",
  "version": "1.2.0",
  "entry": "https://budget.yourapp.dev",
  "icon": "./icon.svg",
  "category": "finance",
  "defaultSize": { "width": 900, "height": 600 },
  "minSize": { "width": 400, "height": 300 },
  "permissions": [
    "datastore.read:com.yourname.budget:transactions",
    "datastore.write:com.yourname.budget:transactions",
    "datastore.read:com.global:categories",
    "notifications.send"
  ],
  "spotlightActions": [
    { "keyword": "新增收支", "action": "open?modal=new-entry" }
  ],
  "menubar": {
    "文件": [
      { "label": "新建记录", "action": "new-entry", "shortcut": "CmdOrCtrl+N" },
      { "type": "separator" },
      { "label": "导出 CSV", "action": "export-csv" }
    ]
  },
  "exposes": {
    "transactions": {
      "description": "用户的所有收支记录",
      "schema": "./schemas/transaction.json"
    }
  }
}
```

---

## 字段说明

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | string | ✓ | 反向域名格式，全局唯一 |
| `name` | string | ✓ | 显示名称，1-50 字符 |
| `version` | string | ✓ | semver 格式 |
| `entry` | string | ✓ | App 入口 URL |
| `icon` | string | ✓ | SVG 或图片 URL |
| `category` | enum | ✓ | productivity / finance / entertainment / developer / utility |
| `defaultSize` | object | ✓ | 默认窗口尺寸 |
| `minSize` | object | ✓ | 最小窗口尺寸 |
| `permissions` | string[] | — | 权限声明列表 |
| `spotlightActions` | object[] | — | Spotlight 搜索集成 |
| `menubar` | object | — | 菜单栏定义 |
| `exposes` | object | — | 对外暴露的数据 schema |

---

## 安装流程

```
用户点击安装
  │
  ▼
AppRegistry.install(manifestUrl)
  │
  ├─ 1. fetch(manifestUrl) 获取 manifest
  ├─ 2. Zod schema 校验
  ├─ 3. 检查 id 是否已安装
  ├─ 4. 解析 permissions，按三级规则分类
  ├─ 5. 展示权限确认弹窗（alwaysAsk 的权限）
  ├─ 6. 用户确认 → 写入 AuthStore
  ├─ 7. 写入 AppRegistry（IndexedDB）
  ├─ 8. 注册到 KernelBus（origin → appId 映射）
  └─ 9. 出现在 Dock / 桌面
```

---

## 懒加载策略

AppRegistry 启动时只加载轻量字段（id、name、icon、category），完整 manifest 在首次启动 App 时才加载：

```ts
// 启动时：只加载列表
type AppSummary = Pick<Manifest, 'id' | 'name' | 'icon' | 'category' | 'version'>

// 首次启动 App 时：加载完整 manifest（带缓存）
async function getFullManifest(appId: AppId): Promise<Manifest> {
  if (manifestCache.has(appId)) return manifestCache.get(appId)!
  const manifest = await loadAndValidateManifest(appId)
  manifestCache.set(appId, manifest)
  return manifest
}
```

---

## 相关文档

- [manifest.json 完整规范](../sdk/manifest.md)
- [ADR-0001 Monorepo 结构](../adr/0001-monorepo-structure.md)
