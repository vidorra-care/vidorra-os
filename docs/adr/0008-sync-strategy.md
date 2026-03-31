# ADR-0008 多设备同步策略

**状态**：已采纳
**日期**：2026-03

## 背景

多设备同步的核心难题是冲突处理：设备 A 和设备 B 同时修改同一条记录，以哪个为准？

## 决策

P2 阶段使用 **last-write-wins（LWW）**，基于 `updatedAt` 时间戳。
P3 阶段视需求决定是否引入更精细的冲突解决机制。

## 理由

**为什么不用 CRDT**：
- 完整 CRDT（如 Yjs、Automerge）适合协同编辑（多人同时编辑同一文档）
- Vidorra OS 的主要场景是个人数据（账单、笔记、设置），多设备冲突概率极低
- CRDT 引入显著的复杂度和包体积，不值得

**LWW 的局限**：
- 时钟漂移：不同设备的系统时间可能不一致（通常 < 1 秒，可接受）
- 真实冲突：两台设备在离线状态下同时修改同一条记录，后同步的会覆盖先同步的
- 对于个人使用场景，这种情况极少发生，发生时用户通常也能接受

## 同步记录格式

每条记录携带同步元数据：

```ts
interface SyncRecord {
  id: string
  namespace: string
  data: unknown
  updatedAt: number   // 客户端时间戳（毫秒）
  deviceId: string    // 最后修改设备
  version: number     // Server 分配的单调递增版本号
  deleted: boolean    // 软删除（不物理删除，便于同步）
}
```

Server 的 `version` 字段是权威的，客户端用它判断是否需要拉取更新。

## 同步协议

```
客户端连接 WebSocket
  → 发送 { lastSyncVersion: 1234 }
  → Server 返回 version > 1234 的所有变更
  → 客户端应用变更到本地 IndexedDB
  → 后续变更通过 WebSocket 实时推送
```

离线重连时，客户端发送本地 pending 记录，Server 合并后广播给其他设备。

## P3 升级路径

如果未来某些命名空间需要更精细的冲突处理（如富文本内容的离线编辑），可以对特定命名空间引入 Yjs 处理正文字段，其他命名空间继续用 LWW。不需要全局替换，按命名空间选择同步策略。

注意：Vidorra OS 是单用户系统，不存在多人协作编辑同一内容的场景。LWW 对个人多设备使用完全够用。
