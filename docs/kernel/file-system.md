# FileSystem (VFS)

## 职责

虚拟文件系统，提供 App 间共享文件的能力。App 开发者无需关心文件路由——SDK 会自动将 record 中的 `Blob/File/ArrayBuffer` 类型字段路由到 VFS，DataStore 只存元数据和 `_vfsPath` 引用。读取时 SDK 自动取回原始 Blob，开发者全程无感知。

**注意（P1）**：VFS 在 P2 实现。P1 阶段 record 中若包含 Blob 字段，SDK 返回 `VFS_NOT_AVAILABLE` 错误。

---

## 存储结构

```
/
├── apps/
│   ├── com.example.notes/     # 每个 App 的私有目录
│   │   ├── documents/
│   │   └── attachments/
│   └── com.example.photos/
│       └── library/
├── shared/                    # 用户授权后可跨 App 访问
│   ├── documents/
│   ├── downloads/
│   └── desktop/
└── system/                    # 系统保留，App 只读
    └── fonts/
```

---

## API（P2 实现）

```ts
// 读文件
const blob = await app.fs.read('/apps/com.example.notes/documents/note.md')

// 写文件
await app.fs.write('/apps/com.example.notes/documents/note.md', content)

// 列目录
const entries = await app.fs.list('/apps/com.example.notes/documents/')

// 删除
await app.fs.delete('/apps/com.example.notes/documents/old.md')
```

---

## 大文件处理

所有 Blob/File/ArrayBuffer 类型字段均使用分片存储，避免 IndexedDB 单条记录过大：

- 分片大小：2MB
- 元数据（文件名、大小、分片数、`_vfsPath`）存 DataStore
- 分片内容存 IndexedDB 的独立 object store

---

## 权限

| 权限 | 说明 |
|------|------|
| `filesystem.read` | 读取 `/shared/` 目录 |
| `filesystem.write` | 写入 `/shared/` 目录 |
| App 私有目录 | 无需声明权限，自动拥有 |
