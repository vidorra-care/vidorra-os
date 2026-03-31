# 快速开始

## 环境要求

- Node.js 20+
- pnpm 9+

## 安装

```bash
git clone https://github.com/yourname/vidorra-os
cd vidorra-os
pnpm install
```

## 启动开发服务器

```bash
# 启动 Shell（主系统）
pnpm --filter @vidorra/shell dev

# 启动示例 App（另一个终端）
pnpm --filter @vidorra/app-notes dev
```

Shell 默认运行在 `http://localhost:5173`。

## 项目结构

```
vidorra-os/
├── packages/
│   ├── kernel/          # 核心逻辑，无 UI
│   │   └── src/
│   │       ├── app-registry/
│   │       ├── data-store/
│   │       ├── kernel-bus/
│   │       ├── permission-guard/
│   │       ├── shortcut-manager/
│   │       └── theme-engine/
│   ├── shell/           # React UI
│   │   └── src/
│   │       ├── components/
│   │       │   ├── Desktop/
│   │       │   ├── Dock/
│   │       │   ├── Menubar/
│   │       │   ├── Spotlight/
│   │       │   ├── WindowFrame/
│   │       │   └── AiBuddy/
│   │       └── main.tsx
│   ├── sdk/             # App SDK
│   │   └── src/
│   │       ├── index.ts
│   │       └── modules/
│   └── sdk-react/       # React hooks
│       └── src/
│           └── hooks/
├── apps/
│   ├── app-store/
│   ├── finder/
│   ├── settings/
│   └── notes/           # 示例 App
└── docs/
```

## 常用命令

```bash
# 构建所有包
pnpm build

# 运行测试
pnpm test

# 类型检查
pnpm typecheck

# Lint
pnpm lint
```
