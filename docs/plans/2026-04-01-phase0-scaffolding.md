# Phase 0 脚手架实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 搭建 Vidorra OS Monorepo 基础结构，使 `pnpm install` 成功、`@vidorra/shell dev` 可启动空白页、lint/test 无报错。

**Architecture:** 手动搭建 pnpm workspace，根目录统一管理 TypeScript/ESLint/Prettier/Vitest 配置，各包/应用继承根配置并覆盖本地选项。Shell 是唯一 Vite 入口应用，其余 React 应用（app-store、settings）结构相同。

**Tech Stack:** Node 20 LTS, pnpm 9, TypeScript 5 (strict), Vite 6, React 18, ESLint 9 (flat config), Prettier 3, Vitest 2, CSS Modules

---

## Task 1: 根目录配置文件

**Files:**
- Modify: `package.json` (已存在，覆盖为 monorepo 根包)
- Create: `pnpm-workspace.yaml`
- Modify: `tsconfig.json` (已存在，覆盖为基础配置)
- Create: `.prettierrc`
- Create: `.prettierignore`
- Modify: `.gitignore`

**Step 1: 写入 pnpm-workspace.yaml**

```yaml
# pnpm-workspace.yaml
packages:
  - 'packages/*'
  - 'apps/*'
```

**Step 2: 覆盖根 package.json**

```json
{
  "name": "vidorra-os",
  "version": "0.0.0",
  "private": true,
  "scripts": {
    "dev": "pnpm --filter @vidorra/shell dev",
    "build": "pnpm -r --filter './packages/**' --filter './apps/**' build",
    "lint": "eslint .",
    "test": "vitest run",
    "format": "prettier --write ."
  },
  "devDependencies": {
    "@eslint/js": "^9.0.0",
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.0",
    "eslint": "^9.0.0",
    "eslint-plugin-react-hooks": "^5.0.0",
    "eslint-plugin-react-refresh": "^0.4.0",
    "globals": "^15.0.0",
    "prettier": "^3.3.0",
    "typescript": "^5.5.0",
    "typescript-eslint": "^8.0.0",
    "vite": "^6.0.0",
    "vitest": "^2.1.0"
  }
}
```

**Step 3: 覆盖根 tsconfig.json**

```json
{
  "compilerOptions": {
    "strict": true,
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "skipLibCheck": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "exclude": ["node_modules", "**/dist/**"]
}
```

**Step 4: 创建 eslint.config.js**

```js
// eslint.config.js
import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  { ignores: ['**/dist/**', '**/node_modules/**'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },
)
```

**Step 5: 创建 .prettierrc**

```json
{
  "semi": false,
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2
}
```

**Step 6: 创建 .prettierignore**

```
dist
node_modules
pnpm-lock.yaml
```

**Step 7: 更新 .gitignore，确保包含以下内容**

```
node_modules
dist
.env
*.local
```

**Step 8: 创建 vitest.config.ts（根目录）**

```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
  },
})
```

**Step 9: 验证 — pnpm install**

```bash
pnpm install
```

Expected: 无报错，生成 `node_modules/` 和 `pnpm-lock.yaml`

**Step 10: Commit**

```bash
git add pnpm-workspace.yaml package.json tsconfig.json eslint.config.js .prettierrc .prettierignore .gitignore vitest.config.ts pnpm-lock.yaml
git commit -m "chore: initialize monorepo root config (pnpm workspace, TS, ESLint, Prettier, Vitest)"
```

---

## Task 2: packages/types

**Files:**
- Create: `packages/types/package.json`
- Create: `packages/types/tsconfig.json`
- Create: `packages/types/src/manifest.ts`
- Create: `packages/types/src/window.ts`
- Create: `packages/types/src/kernel-bus.ts`
- Create: `packages/types/src/index.ts`

**Step 1: 创建 packages/types/package.json**

```json
{
  "name": "@vidorra/types",
  "version": "0.0.1",
  "private": true,
  "type": "module",
  "exports": {
    ".": {
      "types": "./src/index.ts",
      "default": "./src/index.ts"
    }
  },
  "files": ["src"]
}
```

**Step 2: 创建 packages/types/tsconfig.json**

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src"]
}
```

**Step 3: 创建 packages/types/src/manifest.ts**

```ts
export interface AppManifest {
  id: string
  name: string
  version: string
  entry: string
  icon: string
  category: string
  defaultSize: { width: number; height: number }
  minSize?: { width: number; height: number }
  permissions?: string[]
  menubar?: Record<string, MenuItem[]>
  spotlightActions?: SpotlightAction[]
}

export interface MenuItem {
  label: string
  action: string
  shortcut?: string
  disabled?: boolean
  separator?: boolean
}

export interface SpotlightAction {
  title: string
  action: string
  icon?: string
}
```

**Step 4: 创建 packages/types/src/window.ts**

```ts
export type WindowState = 'normal' | 'minimized' | 'maximized'

export interface WindowRect {
  x: number
  y: number
  width: number
  height: number
}

export interface WindowDescriptor {
  id: string
  appId: string
  title: string
  url: string
  icon: string
  rect: WindowRect
  state: WindowState
  focused: boolean
  zIndex: number
}
```

**Step 5: 创建 packages/types/src/kernel-bus.ts**

```ts
export interface KernelBusMessage {
  requestId: string
  method: string
  params?: unknown
}

export interface KernelBusResponse {
  requestId: string
  result?: unknown
  error?: string
}
```

**Step 6: 创建 packages/types/src/index.ts**

```ts
export * from './manifest'
export * from './window'
export * from './kernel-bus'
```

**Step 7: Commit**

```bash
git add packages/types/
git commit -m "chore: add @vidorra/types package with shared type definitions"
```

---

## Task 3: packages/kernel（空骨架）

**Files:**
- Create: `packages/kernel/package.json`
- Create: `packages/kernel/tsconfig.json`
- Create: `packages/kernel/src/index.ts`

**Step 1: 创建 packages/kernel/package.json**

```json
{
  "name": "@vidorra/kernel",
  "version": "0.0.1",
  "private": true,
  "type": "module",
  "exports": {
    ".": {
      "types": "./src/index.ts",
      "default": "./src/index.ts"
    }
  },
  "dependencies": {
    "@vidorra/types": "workspace:*"
  }
}
```

**Step 2: 创建 packages/kernel/tsconfig.json**

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src"]
}
```

**Step 3: 创建 packages/kernel/src/index.ts（占位）**

```ts
// @vidorra/kernel — 阶段 1 实现 AppRegistry 和 ThemeEngine
export {}
```

**Step 4: Commit**

```bash
git add packages/kernel/
git commit -m "chore: add @vidorra/kernel package scaffold"
```

---

## Task 4: packages/sdk（空骨架）

**Files:**
- Create: `packages/sdk/package.json`
- Create: `packages/sdk/tsconfig.json`
- Create: `packages/sdk/src/index.ts`

**Step 1: 创建 packages/sdk/package.json**

```json
{
  "name": "@vidorra/sdk",
  "version": "0.0.1",
  "type": "module",
  "exports": {
    ".": {
      "types": "./src/index.ts",
      "default": "./src/index.ts"
    }
  },
  "dependencies": {
    "@vidorra/types": "workspace:*"
  }
}
```

**Step 2: 创建 packages/sdk/tsconfig.json**

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src"]
}
```

**Step 3: 创建 packages/sdk/src/index.ts（占位）**

```ts
// @vidorra/sdk — 阶段 4 实现 createApp / KernelBusClient
export {}
```

**Step 4: Commit**

```bash
git add packages/sdk/
git commit -m "chore: add @vidorra/sdk package scaffold"
```

---

## Task 5: packages/shell（Vite + React 入口）

**Files:**
- Create: `packages/shell/package.json`
- Create: `packages/shell/tsconfig.json`
- Create: `packages/shell/vite.config.ts`
- Create: `packages/shell/index.html`
- Create: `packages/shell/src/main.tsx`
- Create: `packages/shell/src/App.tsx`
- Create: `packages/shell/src/App.module.css`

**Step 1: 创建 packages/shell/package.json**

```json
{
  "name": "@vidorra/shell",
  "version": "0.0.1",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "@vidorra/kernel": "workspace:*",
    "@vidorra/types": "workspace:*",
    "react": "^18.3.0",
    "react-dom": "^18.3.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.0",
    "vite": "^6.0.0",
    "typescript": "^5.5.0"
  }
}
```

**Step 2: 创建 packages/shell/tsconfig.json**

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "composite": true
  },
  "include": ["src"]
}
```

**Step 3: 创建 packages/shell/vite.config.ts**

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
  },
})
```

**Step 4: 创建 packages/shell/index.html**

```html
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Vidorra OS</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

**Step 5: 创建 packages/shell/src/main.tsx**

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

**Step 6: 创建 packages/shell/src/App.tsx**

```tsx
import styles from './App.module.css'

export default function App() {
  return (
    <div className={styles.desktop}>
      <p>Vidorra OS — Shell Placeholder</p>
    </div>
  )
}
```

**Step 7: 创建 packages/shell/src/App.module.css**

```css
.desktop {
  width: 100vw;
  height: 100vh;
  background: #1e1e2e;
  color: #cdd6f4;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: system-ui, sans-serif;
}
```

**Step 8: 验证 — dev server 启动**

```bash
pnpm install
pnpm --filter @vidorra/shell dev
```

Expected: 浏览器打开 `http://localhost:3000`，显示深色背景 + "Vidorra OS — Shell Placeholder" 文字

**Step 9: Commit**

```bash
git add packages/shell/
git commit -m "chore: add @vidorra/shell Vite+React scaffold with placeholder UI"
```

---

## Task 6: apps/app-store 和 apps/settings（空骨架）

**Files:**
- Create: `apps/app-store/package.json`
- Create: `apps/app-store/tsconfig.json`
- Create: `apps/app-store/vite.config.ts`
- Create: `apps/app-store/index.html`
- Create: `apps/app-store/src/main.tsx`
- Create: `apps/settings/package.json`
- Create: `apps/settings/tsconfig.json`
- Create: `apps/settings/vite.config.ts`
- Create: `apps/settings/index.html`
- Create: `apps/settings/src/main.tsx`

**Step 1: 创建 apps/app-store/package.json**

```json
{
  "name": "@vidorra/app-store",
  "version": "0.0.1",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "@vidorra/sdk": "workspace:*",
    "@vidorra/types": "workspace:*",
    "react": "^18.3.0",
    "react-dom": "^18.3.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.0",
    "vite": "^6.0.0",
    "typescript": "^5.5.0"
  }
}
```

**Step 2: 创建 apps/app-store/tsconfig.json**

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": { "outDir": "./dist", "rootDir": "./src", "composite": true },
  "include": ["src"]
}
```

**Step 3: 创建 apps/app-store/vite.config.ts**

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: { port: 3010 },
})
```

**Step 4: 创建 apps/app-store/index.html**

```html
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <title>App Store</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

**Step 5: 创建 apps/app-store/src/main.tsx**

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <p>App Store — Placeholder</p>
  </StrictMode>,
)
```

**Step 6: 重复 Step 1-5，创建 apps/settings（端口 3011）**

`apps/settings/package.json`（与 app-store 相同结构，name 改为 `@vidorra/settings`，端口 3011）

`apps/settings/src/main.tsx`:
```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <p>Settings — Placeholder</p>
  </StrictMode>,
)
```

**Step 7: 创建 apps/calculator 占位目录**

```bash
mkdir -p apps/calculator
```

创建 `apps/calculator/.gitkeep`（空文件，确保目录被 git 追踪）

**Step 8: Commit**

```bash
git add apps/
git commit -m "chore: add app-store, settings, calculator scaffold"
```

---

## Task 7: registry/built-in-apps.json

**Files:**
- Create: `registry/built-in-apps.json`

**Step 1: 创建 registry/built-in-apps.json**

```json
{
  "version": "1.0.0",
  "apps": []
}
```

（内置 App 清单在阶段 5 填充，此处建立文件结构。）

**Step 2: Commit**

```bash
git add registry/
git commit -m "chore: add registry/built-in-apps.json placeholder"
```

---

## Task 8: 验收验证

**Step 1: 全量安装**

```bash
pnpm install
```

Expected: 无报错

**Step 2: lint 检查**

```bash
pnpm lint
```

Expected: 无 error（可能有 warning，可忽略）

**Step 3: test 运行**

```bash
pnpm test
```

Expected: `No test files found` 或 `0 tests passed`（kernel 无测试文件属正常）

**Step 4: shell dev 启动**

```bash
pnpm --filter @vidorra/shell dev
```

Expected: `http://localhost:3000` 显示深色背景占位页

**Step 5: shell build**

```bash
pnpm --filter @vidorra/shell build
```

Expected: `packages/shell/dist/` 目录生成，无 TS 报错

**Step 6: 最终 Commit（如有未提交文件）**

```bash
git status
# 确认无遗漏文件后
git add -A
git commit -m "chore: phase 0 scaffolding complete — all acceptance criteria passed"
```

---

## 验收清单

- [ ] `pnpm install` 无报错
- [ ] `pnpm --filter @vidorra/shell dev` 启动空白页（深色背景 + 占位文字）
- [ ] `pnpm lint` 无报错
- [ ] `pnpm test` 运行成功
- [ ] `pnpm --filter @vidorra/shell build` 生成 `dist/` 目录
