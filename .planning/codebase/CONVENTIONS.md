# Coding Conventions

**Analysis Date:** 2026-04-01

## Naming Patterns

**Files:**
- Component files: PascalCase (e.g., `App.tsx`)
- Source files: camelCase (e.g., `app-registry.ts`, `theme-engine.ts`)
- Test files: `.test.ts` suffix colocated with source (e.g., `app-registry.test.ts`)
- Config files: kebab-case or camelCase (e.g., `vitest.config.ts`, `vite.config.ts`)

**Functions:**
- Private methods: camelCase with underscore prefix (e.g., `private validate()`, `private load()`)
- Public methods: camelCase (e.g., `install()`, `getApp()`, `setMode()`)
- Event handlers: `onEventName` pattern (e.g., `onSystemChange`)
- Callbacks: descriptive camelCase (e.g., `cb`, `callback`)

**Variables:**
- Constants: UPPER_SNAKE_CASE for module-level immutable collections (e.g., `REQUIRED_FIELDS`, `STORAGE_KEY`)
- Instance variables: camelCase (e.g., `mode`, `apps`, `subscribers`)
- Event handlers/callbacks: Prefix with `on` (e.g., `onSystemChange`)

**Types:**
- Interfaces: PascalCase with prefix `I` rarely used, direct PascalCase preferred (e.g., `AppManifest`, `WindowDescriptor`)
- Type unions: camelCase or literal values (e.g., `ThemeMode = 'light' | 'dark' | 'auto'`)
- Enums: Not used; union types preferred

## Code Style

**Formatting:**
- Tool: Prettier v3.3.0
- Semi: false (no semicolons)
- Single quotes: true
- Trailing comma: all
- Print width: 100
- Tab width: 2 spaces

**Linting:**
- Tool: ESLint v9.0.0 with TypeScript ESLint v8.0.0
- Config: `eslint.config.js` at project root
- Extends: `@eslint/js` recommended + `typescript-eslint` recommended
- Plugins: `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`

**Key Rules:**
- React hooks: enforced via `react-hooks` plugin
- React refresh: warn on non-component exports via `react-refresh/only-export-components`
- TypeScript strict mode: enabled in `tsconfig.json`

## Import Organization

**Order:**
1. External dependencies from node_modules (e.g., `import { defineConfig } from 'vitest/config'`)
2. Package aliases with `@vidorra/` prefix (e.g., `import type { AppManifest } from '@vidorra/types'`)
3. Relative imports from same package or monorepo (e.g., `import { AppRegistry } from './app-registry'`)
4. Style imports (e.g., `import styles from './App.module.css'`)

**Path Aliases:**
- `@vidorra/types` → resolves to `packages/types`
- `@vidorra/kernel` → resolves to `packages/kernel`
- `@vidorra/shell` → resolves to `packages/shell`
- `@vidorra/sdk` → resolves to `packages/sdk`

**Type imports:**
- Prefer explicit `import type` for type-only imports (e.g., `import type { AppManifest } from '@vidorra/types'`)
- Used consistently throughout codebase

## Error Handling

**Patterns:**
- Synchronous validation errors thrown directly: `throw new Error('message')`
- Error messages are descriptive and include context (e.g., `Invalid manifest: missing ${field}`)
- Async operations reject with Error instances
- Silent failures with fallback behavior: catch blocks with comments explaining intent (e.g., `catch { /* corrupted storage — start fresh */ }`)
- No global error handlers; responsibility delegated to consumers

**Example:**
```typescript
// packages/kernel/src/app-registry.ts
try {
  const record = JSON.parse(stored) as Record<string, AppManifest>
  // process...
} catch {
  // corrupted storage — start fresh
  localStorage.removeItem(this.STORAGE_KEY)
}
```

## Logging

**Framework:** None; `console` methods not used in production code.

**Patterns:**
- No console logs in source code
- Error messages delivered via thrown Errors, not logged
- Testing uses mocks for browser APIs (localStorage, fetch, matchMedia)

## Comments

**When to Comment:**
- Explain intent or non-obvious behavior (e.g., `// corrupted storage — start fresh`)
- Mark handlers and lifecycle: `private onSystemChange = (): void => {...}`
- No docblocks observed; types serve as primary documentation

**JSDoc/TSDoc:**
- Not used in codebase
- Type signatures provide sufficient documentation

## Function Design

**Size:**
- Functions generally 10–30 lines
- Longer functions (50+ lines) not observed in source code
- Example: `AppRegistry.validate()` is 20 lines, handles single concern (validation)

**Parameters:**
- Minimal parameters (typically 0–1)
- Async operations use single URL or config object
- Callbacks receive single argument (mode, manifest, etc.)

**Return Values:**
- Public methods: return `void`, `Promise<void>`, or data types (`AppManifest | undefined`, `ThemeMode`)
- Unsubscribe functions return `() => void`
- Methods consistently return single type per method

## Module Design

**Exports:**
- Named exports for classes: `export class AppRegistry { ... }`
- Named exports for types: `export type ThemeMode = ...`
- Singleton instances exported: `export const appRegistry = new AppRegistry()`
- Barrel files used: `packages/kernel/src/index.ts` re-exports from modules

**Barrel Files:**
- Located at `index.ts` in packages
- Export both classes and instances
- Export types separately with `export type`
- Example: `packages/kernel/src/index.ts` exports both `AppRegistry` class and `appRegistry` instance

**Interfaces & Types:**
- Interfaces define contracts for data (e.g., `AppManifest`, `WindowDescriptor`)
- Kept in separate type files: `packages/types/src/`
- Imported via path alias: `import type { AppManifest } from '@vidorra/types'`

---

*Convention analysis: 2026-04-01*
