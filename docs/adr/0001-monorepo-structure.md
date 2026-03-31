# ADR-0001 Monorepo 结构

**状态**：已采纳
**日期**：2026-03

## 背景

项目包含多个相互依赖的包：kernel、shell、sdk、sdk-react，以及多个内置 App。需要决定代码组织方式。

## 决策

使用 pnpm workspaces 的 Monorepo 结构。

## 理由

- kernel 和 shell 需要频繁联调，Monorepo 避免了 `npm link` 的麻烦
- sdk 需要与 kernel 的类型定义保持同步，同一仓库可以直接引用类型
- pnpm 的 workspace 协议（`workspace:*`）让包间依赖清晰
- 单一 CI/CD 流水线，统一版本管理

## 备选方案

- **多仓库**：包间依赖需要发布到 npm，联调成本高，放弃
- **Turborepo**：可以叠加使用，但不是必须，先用 pnpm workspaces 足够

## 目录结构

```
vidorra-os/
├── packages/
│   ├── kernel/       # @vidorra/kernel
│   ├── shell/        # @vidorra/shell
│   ├── sdk/          # @vidorra/sdk
│   └── sdk-react/    # @vidorra/sdk-react
├── apps/
│   ├── app-store/
│   ├── finder/
│   ├── settings/
│   └── notes/
└── pnpm-workspace.yaml
```
