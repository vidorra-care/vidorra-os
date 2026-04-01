# Phase 0 脚手架设计文档

> 阶段 0：Monorepo 基础结构搭建

---

## 背景

Vidorra OS 是一个 Web Desktop OS，目前处于纯文档阶段。本文档记录阶段 0 的脚手架设计决策，为后续实现提供依据。

---

## 方案选择

选择**手动搭建**（方案 A），理由：
- MVP 计划已明确所有包边界，直接对齐，无需后续迁移
- 没有多余模板文件
- 完全掌控结构

排除方案：
- `create-turbo`：过度工程，带来不必要的 Turborepo 模板
- 单包先跑：与计划结构不符，后续拆包有迁移成本

---

## 目录结构

```
vidorra-os/
├── packages/
│   ├── kernel/        # 纯 TS，AppRegistry + ThemeEngine
│   ├── shell/         # React + Vite，主入口
│   ├── sdk/           # 纯 TS，KernelBusClient + API
│   └── types/         # 共享类型定义
├── apps/
│   ├── app-store/     # React + Vite
│   ├── settings/      # React + Vite
│   └── calculator/    # 纯 HTML（阶段 5 实现，阶段 0 建空目录）
├── registry/
│   └── built-in-apps.json
├── pnpm-workspace.yaml
├── package.json
└── tsconfig.json
```

> `apps/notes-demo` 为 P2 特性，**阶段 0 不创建目录**。

---

## 工具链

| 工具 | 版本 | 用途 |
|------|------|------|
| Node.js | 20 LTS | 运行时 |
| pnpm | 9.x | workspace 包管理 |
| TypeScript | 5.x | 全量 strict 模式 |
| Vite | 6.x | shell / app-store / settings 构建 |
| React | 18.x | shell / app-store / settings UI |
| ESLint | 9.x (flat config) | 根目录 `eslint.config.js` |
| Prettier | 3.x | 根目录 `.prettierrc` |
| Vitest | 2.x | workspace 模式，`packages/kernel` 优先覆盖 |

---

## 包名与依赖关系

### 包名约定

| 目录 | 包名 |
|------|------|
| `packages/kernel` | `@vidorra/kernel` |
| `packages/shell` | `@vidorra/shell` |
| `packages/sdk` | `@vidorra/sdk` |
| `packages/types` | `@vidorra/types` |
| `apps/app-store` | `@vidorra/app-store` |
| `apps/settings` | `@vidorra/settings` |
| `apps/calculator` | `@vidorra/calculator` |

### 依赖图

```
shell       → @vidorra/kernel, @vidorra/types
sdk         → @vidorra/types
app-store   → @vidorra/sdk, @vidorra/types
settings    → @vidorra/sdk
calculator  → (无依赖，纯 HTML)
```

---

## TypeScript 配置策略

根 `tsconfig.json` 设置基础选项：

```json
{
  "compilerOptions": {
    "strict": true,
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "skipLibCheck": true
  }
}
```

各包 `tsconfig.json` 通过 `extends: "../../tsconfig.json"` 继承，再覆盖 `include` / `outDir` 等本地选项。

---

## 根 package.json scripts

```json
{
  "scripts": {
    "dev": "pnpm --filter @vidorra/shell dev",
    "build": "pnpm -r build",
    "lint": "eslint .",
    "test": "vitest run",
    "format": "prettier --write ."
  }
}
```

---

## 验收标准

- [ ] `pnpm install` 无报错
- [ ] `pnpm --filter @vidorra/shell dev` 启动空白页（白屏即可）
- [ ] `pnpm lint` 无报错
- [ ] `pnpm test` 运行成功（kernel 暂无测试，输出 0 passed 即可）
- [ ] `pnpm build` 对 shell 完成构建，输出 `dist/` 目录
