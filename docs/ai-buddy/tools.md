# AI Buddy 系统工具

AI Buddy 通过工具调用操作系统。所有工具经过 PermissionBridge 校验，以 `com.vidorra.buddy` 身份执行。

---

## 工具列表

### app_open
打开一个已安装的 App。

```json
{
  "name": "app_open",
  "description": "打开指定的 App。如果 App 已在运行，则将其窗口置于前台。",
  "input_schema": {
    "type": "object",
    "properties": {
      "app_id": { "type": "string", "description": "App 的 ID，如 com.example.budget" },
      "action": { "type": "string", "description": "可选的深度链接 action，如 open?modal=new-entry" }
    },
    "required": ["app_id"]
  }
}
```

**需要用户确认**：否（打开 App 是低风险操作）

---

### app_list
列出所有已安装的 App。

```json
{
  "name": "app_list",
  "description": "获取所有已安装 App 的列表，包含名称、ID、分类、运行状态。",
  "input_schema": {
    "type": "object",
    "properties": {
      "category": { "type": "string", "description": "按分类过滤，可选" },
      "running_only": { "type": "boolean", "description": "只返回运行中的 App" }
    }
  }
}
```

**需要用户确认**：否

---

### data_query
查询 DataStore 中的数据。

```json
{
  "name": "data_query",
  "description": "查询指定命名空间的数据记录。只能查询用户已授权 Buddy 访问的数据。",
  "input_schema": {
    "type": "object",
    "properties": {
      "namespace": { "type": "string", "description": "命名空间，如 com.example.budget:transactions" },
      "filter": { "type": "object", "description": "查询条件" },
      "limit": { "type": "number", "description": "最多返回条数，默认 20" }
    },
    "required": ["namespace"]
  }
}
```

**需要用户确认**：否（只读操作）

---

### data_insert
向 DataStore 写入数据。

```json
{
  "name": "data_insert",
  "description": "向指定命名空间插入一条数据记录。",
  "input_schema": {
    "type": "object",
    "properties": {
      "namespace": { "type": "string" },
      "record": { "type": "object", "description": "要插入的数据" }
    },
    "required": ["namespace", "record"]
  }
}
```

**需要用户确认**：**是** — 展示将要写入的数据，用户点击确认后执行

---

### spotlight_search
执行 Spotlight 搜索。

```json
{
  "name": "spotlight_search",
  "description": "在 Spotlight 中搜索 App、文件或数据。",
  "input_schema": {
    "type": "object",
    "properties": {
      "query": { "type": "string" }
    },
    "required": ["query"]
  }
}
```

**需要用户确认**：否

---

### notification_send
发送系统通知。

```json
{
  "name": "notification_send",
  "description": "发送一条系统通知。",
  "input_schema": {
    "type": "object",
    "properties": {
      "title": { "type": "string" },
      "body": { "type": "string" }
    },
    "required": ["title", "body"]
  }
}
```

**需要用户确认**：否

---

### window_arrange
排列窗口布局。

```json
{
  "name": "window_arrange",
  "description": "将当前打开的窗口排列为指定布局。",
  "input_schema": {
    "type": "object",
    "properties": {
      "layout": {
        "type": "string",
        "enum": ["cascade", "tile-horizontal", "tile-vertical", "focus"],
        "description": "cascade=层叠, tile-horizontal=左右分屏, tile-vertical=上下分屏, focus=只显示当前窗口"
      }
    },
    "required": ["layout"]
  }
}
```

**需要用户确认**：否

---

## 确认弹窗设计

需要确认的工具调用，展示如下弹窗（参考 Claude Code 的工具确认 UI）：

```
┌─────────────────────────────────┐
│  Buddy 想要执行以下操作          │
├─────────────────────────────────┤
│  写入数据                        │
│  com.example.budget:transactions │
│                                  │
│  {                               │
│    "amount": -45.5,              │
│    "category": "餐饮",           │
│    "note": "午饭",               │
│    "date": "2024-06-15"          │
│  }                               │
├─────────────────────────────────┤
│  [取消]              [确认执行]  │
└─────────────────────────────────┘
```

用户取消时，将 `{ cancelled: true, reason: "用户取消" }` 作为工具结果返回给 AI。

---

## 权限控制

Buddy 的数据访问权限由用户在 Settings > AI Buddy > 数据权限 中管理：

- 默认只能读取用户明确授权的命名空间
- 写入操作始终需要逐次确认（不支持「始终允许」）
- 用户可以随时撤销 Buddy 的数据访问权限
