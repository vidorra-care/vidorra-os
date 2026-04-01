# Phase 1 Kernel 层设计文档

> 阶段 1：AppRegistry + ThemeEngine 实现

---

## 背景

Phase 0 完成了 Monorepo 脚手架。`packages/kernel/src/index.ts` 目前只有占位符。本阶段实现 Kernel 层的两个核心模块，为 Shell 层（Phase 2）提供 App 注册和主题管理能力。

---

## 方案选择

选择**方案 A：两个独立类 + 单例导出**，理由：
- 与 MVP 计划接口设计完全对齐
- 测试时可直接 `new AppRegistry()` 创建隔离实例
- Shell 使用方便：`import { appRegistry, themeEngine } from '@vidorra/kernel'`
- 后续如需依赖注入也容易重构

排除方案：
- 统一 Kernel 类：过度抽象，MVP 不需要
- 函数式 API：测试隔离困难，与 MVP 接口设计不符

---

## AppRegistry

**文件：** `packages/kernel/src/app-registry.ts`

### 接口

```ts
export class AppRegistry {
  private apps = new Map<string, AppManifest>()
  private readonly STORAGE_KEY = 'vidorra:registry'

  constructor()                                         // 从 localStorage 恢复
  async install(manifestUrl: string): Promise<void>    // fetch → validate → save
  async uninstall(appId: string): Promise<void>
  getApp(appId: string): AppManifest | undefined
  getAllApps(): AppManifest[]

  private validate(data: unknown): AppManifest         // 校验必填字段，抛出错误
  private persist(): void                              // 写 localStorage
  private load(): void                                 // 读 localStorage
}

export const appRegistry = new AppRegistry()           // 单例
```

### 错误处理

| 情况 | 行为 |
|------|------|
| fetch 失败 | 抛出 `Error('Failed to fetch manifest: <url>')` |
| 字段缺失 | 抛出 `Error('Invalid manifest: missing <field>')` |
| 重复安装同 id | 静默覆盖（更新） |
| uninstall 不存在的 id | 静默忽略 |

### 测试要点

- `install`：fetch mock → manifest 存入 Map 且 localStorage 有数据
- `install`：无效 manifest → 抛出错误
- `uninstall`：已安装 → 从 Map 和 localStorage 移除
- `uninstall`：不存在 → 静默忽略
- 构造时：localStorage 有数据 → 自动恢复

---

## ThemeEngine

**文件：** `packages/kernel/src/theme-engine.ts`

### 接口

```ts
export type ThemeMode = 'light' | 'dark' | 'auto'

export class ThemeEngine {
  private mode: ThemeMode = 'light'
  private subscribers = new Set<(mode: ThemeMode) => void>()
  private mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
  private readonly STORAGE_KEY = 'vidorra:theme'

  constructor()                                                    // 从 localStorage 恢复，监听系统主题
  setMode(mode: ThemeMode): void                                   // 更新 + persist + applyTheme + notify
  getMode(): ThemeMode
  getResolvedMode(): 'light' | 'dark'                             // auto → 解析为实际模式
  subscribe(cb: (mode: ThemeMode) => void): () => void            // 返回 unsubscribe 函数
  destroy(): void                                                  // 移除 mediaQuery 监听（测试用）

  private applyTheme(): void                                       // 注入 CSS 变量到 document.documentElement
  private notify(): void
  private persist(): void
  private load(): void
  private onSystemChange: () => void
}

export const themeEngine = new ThemeEngine()                       // 单例
```

### CSS 变量

注入到 `document.documentElement`（`:root`）：

| 变量 | light | dark |
|------|-------|------|
| `--color-bg` | `#ffffff` | `#1e1e2e` |
| `--color-surface` | `#f5f5f5` | `#313244` |
| `--color-text` | `#1a1a1a` | `#cdd6f4` |
| `--color-accent` | `#0066cc` | `#89b4fa` |
| `--color-border` | `#e0e0e0` | `#45475a` |

### 测试要点

- `setMode('dark')` → CSS 变量更新 + 订阅者收到通知
- `setMode('auto')` + 系统深色 → `getResolvedMode()` 返回 `'dark'`
- `subscribe` → 返回 unsubscribe 函数，调用后不再收到通知
- 构造时从 localStorage 恢复 mode

---

## 测试配置

**环境：** `happy-dom`（支持 CSS variables 和 matchMedia mock，比 jsdom 轻量）

### packages/kernel/package.json 新增

```json
"devDependencies": {
  "vitest": "workspace:*",
  "happy-dom": "^14.0.0"
}
```

### packages/kernel/vitest.config.ts

```ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'happy-dom',
  },
})
```

### 文件结构

```
packages/kernel/src/
├── app-registry.ts
├── app-registry.test.ts
├── theme-engine.ts
├── theme-engine.test.ts
└── index.ts
```

### index.ts 导出

```ts
export { AppRegistry, appRegistry } from './app-registry'
export { ThemeEngine, themeEngine } from './theme-engine'
export type { ThemeMode } from './theme-engine'
```

---

## 验收标准

- [ ] `pnpm --filter @vidorra/kernel test` 全部通过（AppRegistry + ThemeEngine 各 5+ 测试）
- [ ] `appRegistry.install(url)` 可加载真实 manifest URL（集成验证）
- [ ] `themeEngine.setMode('dark')` 在 Shell 中切换后 CSS 变量更新
- [ ] TypeScript 编译无报错
- [ ] 无任何 `any` 类型
