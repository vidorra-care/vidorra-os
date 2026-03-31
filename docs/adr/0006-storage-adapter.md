# ADR-0006 StorageAdapter 抽象

**状态**：已采纳
**日期**：2026-03

## 背景

DataStore 初期用 IndexedDB（纯本地），后期需要支持 Self-Hosted Server 同步和云服务。需要在不改动上层代码的前提下切换存储后端。

## 决策

在 DataStore 和具体存储实现之间引入 `StorageAdapter` 接口，DataStore 只依赖接口，不依赖具体实现。

## 三种适配器

**IndexedDBAdapter**：纯本地，无网络依赖，P1 实现。

**RemoteAdapter**：所有读写直接走 Server API，无本地缓存。适合对数据一致性要求极高的场景，但离线不可用。

**HybridAdapter（推荐）**：本地 IndexedDB 作为缓存和离线存储，后台与 Server 同步。
- 读：优先读本地缓存，后台刷新
- 写：先写本地，标记 pending，后台同步到 Server
- 离线：继续工作，联网后自动同步

## 配置切换

```ts
// packages/kernel/src/data-store/index.ts
const adapter = config.serverUrl
  ? new HybridAdapter({ serverUrl: config.serverUrl, token: config.token })
  : new IndexedDBAdapter()

const dataStore = new DataStore(adapter)
```

用户在 Settings > 账户 中配置 Server URL 后，自动切换到 HybridAdapter。

## 权衡

引入适配器层增加了一层抽象，但这是必要的——存储后端的切换是核心需求，不是可选的。
HybridAdapter 的冲突处理逻辑是最复杂的部分，P2 阶段先用 last-write-wins，P3 再考虑更精细的冲突解决。
