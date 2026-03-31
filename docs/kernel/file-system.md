# FileSystem (VFS)

## 职责

虚拟文件系统，提供 App 间共享文件的能力。大文件（图片、视频、文档）走 VFS，不走 DataStore。

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

超过 10MB 的文件使用 Blob 分片存储，避免 IndexedDB 单条记录过大：

- 分片大小：2MB
- 元数据（文件名、大小、分片数）存 DataStore
- 分片内容存 IndexedDB 的独立 object store

---

## 权限

| 权限 | 说明 |
|------|------|
| `filesystem.read` | 读取 `/shared/` 目录 |
| `filesystem.write` | 写入 `/shared/` 目录 |
| App 私有目录 | 无需声明权限，自动拥有 |
