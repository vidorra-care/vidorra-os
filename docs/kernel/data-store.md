# DataStore

## 职责

DataStore 是 Vidorra OS 最核心的差异化模块。它是一个结构化的、Schema 驱动的、具有权限控制的跨 App 数据总线。

**核心价值**：记账 App 的数据可以被图表 App 直接读取，无需任何 API 对接。数据属于用户，存在 IndexedDB 中，App 只是视图。

---

## 命名空间设计

所有数据按命名空间组织，格式为 `appId:collection`：

```
com.yourname.budget:transactions   # 私有数据，只有 budget App 可写
com.yourname.budget:categories     # 私有数据
com.global:categories              # 全局数据，任何有权限的 App 可读
com.global:contacts                # 全局联系人
com.global:events                  # 全局日历事件
com.vidorra.system:theme           # 系统数据（只读）
```

**规则**：
- `com.global:*` — 任何 App 可读（需声明权限），只有创建者可写
- `com.vidorra.system:*` — 系统保留，App 只读
- 其他命名空间 — 只有 appId 匹配的 App 可写，其他 App 需声明 `datastore.read` 权限才可读

---

## API

### 查询

```ts
const records = await app.data
  .collection('com.yourname.budget:transactions')
  .query({
    where: { month: '2024-06', category: '餐饮' },
    orderBy: [{ field: 'date', dir: 'desc' }],
    limit: 50,
    offset: 0,
  })
```

### 写入

```ts
await app.data
  .collection('com.yourname.budget:transactions')
  .insert({
    id: crypto.randomUUID(),
    amount: -128.5,
    category: '餐饮',
    note: '午饭',
    date: '2024-06-15',
  })
```

### 更新

```ts
await app.data
  .collection('com.yourname.budget:transactions')
  .update(id, { note: '午饭（已报销）' })
```

### 删除

```ts
await app.data
  .collection('com.yourname.budget:transactions')
  .delete(id)
```

### 实时订阅

```ts
const unsub = app.data
  .collection('com.yourname.budget:transactions')
  .subscribe(records => {
    console.log('数据更新', records)
  })

// 组件卸载时取消
onUnmount(() => unsub())
```

---

## Schema 声明

App 在 manifest.json 的 `exposes` 字段声明对外暴露的数据 schema：

```json
{
  "exposes": {
    "transactions": {
      "description": "用户的所有收支记录",
      "schema": "./schemas/transaction.json"
    }
  }
}
```

`transaction.json` 使用 JSON Schema 格式：

```json
{
  "type": "object",
  "required": ["id", "amount", "date"],
  "properties": {
    "id":       { "type": "string", "format": "uuid" },
    "amount":   { "type": "number" },
    "category": { "type": "string" },
    "note":     { "type": "string" },
    "date":     { "type": "string", "format": "date" }
  }
}
```

DataStore 在写入时用此 schema 校验数据，拒绝不合规的写入。

---

## 缓存策略

DataStore 在内存中维护 LRU 缓存，减少 IndexedDB 读取：

- 最多缓存 500 条查询结果
- 最大 25MB 内存占用
- TTL 5 分钟
- 写入时精确失效对应命名空间的缓存
- 实时订阅采用 stale-while-revalidate：先返回缓存，后台刷新

---

## 存储配额管理

IndexedDB 在 Safari 约 1GB 上限，DataStore 主动管理配额：

- 每个 App 默认配额 50MB
- 超出配额时写入失败，返回 `QuotaExceededError`
- 用户可在 Settings App 中查看和调整各 App 的配额
- 大文件走 VFS + Blob 分片存储，不走 DataStore

---

## 相关文档

- [DataStore API 参考](../api/data-store-api.md)
- [ADR-0004 IndexedDB via Dexie](../adr/0004-indexeddb-via-dexie.md)
- [安全模型 — 权限校验](../architecture/security-model.md)
