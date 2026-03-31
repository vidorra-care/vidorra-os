# ADR-0007 Self-Hosted Server 选型

**状态**：已采纳
**日期**：2026-03

## 背景

需要一个用户可以自己部署的服务端，目标是「一行命令启动，零运维负担」。

## 决策

- 运行时：Bun（兼容 Node.js）
- 框架：Hono
- 数据库：SQLite（默认）/ PostgreSQL（可选）
- ORM：Drizzle ORM
- 实时：WebSocket（原生支持）
- 部署：Docker 单容器

## 理由

**为什么选 SQLite 而非 PostgreSQL 作为默认**：
- 零依赖，单文件数据库，`docker run` 一行启动
- 对个人用户（1-5 设备，数据量 < 1GB）性能完全够用
- 备份就是复制一个文件
- 需要更高性能时可以切换到 PostgreSQL（Drizzle 支持两者）

**为什么选 Hono**：
- 极轻量（14KB），启动快
- 同时支持 Bun、Node.js、Cloudflare Workers（未来可以部署到边缘）
- TypeScript 原生，与前端共享类型定义

**为什么不用 Supabase / PocketBase**：
- PocketBase 是好选择，但我们需要完全控制数据模型（DataStore 的命名空间设计）
- 自研让我们可以精确实现 KernelBus 的权限模型在服务端的对应

## 部署目标

```bash
docker run -p 3000:3000 -v ./data:/data ghcr.io/vidorra/server:latest
```

数据存在 `./data/vidorra.db`，用户完全掌控，随时迁移。

## 备选方案

**PocketBase**：开箱即用，但数据模型不够灵活，放弃。
**Supabase（自托管）**：太重，需要 Docker Compose 启动多个服务，放弃。
**Cloudflare D1 + Workers**：无需自己维护服务器，但数据在 Cloudflare，不符合完全自控的目标，作为 P4 可选方案。
