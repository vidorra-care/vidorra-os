# ADR-0004 IndexedDB via Dexie.js

**状态**：已采纳
**日期**：2026-03

## 背景

DataStore 需要在浏览器中持久化结构化数据，支持查询、实时订阅、离线访问。

## 决策

使用 Dexie.js 封装 IndexedDB。

## 理由

- **Reactive queries**：`useLiveQuery` 支持实时订阅，数据变化时自动触发更新
- **TypeScript 友好**：完整的类型定义
- **事务支持**：原生支持 IndexedDB 事务，保证写入原子性
- **成熟稳定**：10+ 年历史，广泛使用
- **体积合理**：~25KB gzip

## 备选方案

**原生 IndexedDB**：
- API 繁琐，回调地狱
- 无实时订阅支持
- 放弃原因：开发效率低

**localStorage**：
- 同步 API，阻塞主线程
- 5MB 限制
- 放弃原因：容量不足，性能差

**OPFS（Origin Private File System）**：
- 更大容量，更好性能
- 浏览器支持不够广泛（Safari 16.4+）
- 可作为 P3 的升级方向

**PGlite（浏览器内 PostgreSQL）**：
- SQL 查询能力强
- 体积较大（~3MB）
- 可作为高级查询的 P3 选项

## 存储限制

| 浏览器 | 限制 |
|--------|------|
| Chrome | 磁盘空间的 60% |
| Firefox | 磁盘空间的 50% |
| Safari | 约 1GB（需用户授权更多） |

DataStore 主动管理配额，每个 App 默认 50MB 上限。
