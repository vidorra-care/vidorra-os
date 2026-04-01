# Testing Patterns

**Analysis Date:** 2026-04-01

## Test Framework

**Runner:**
- Vitest v3.0.0
- Config: Root config at `vitest.config.ts`; package-specific overrides at `packages/kernel/vitest.config.ts`

**Assertion Library:**
- Vitest built-in expect API
- Methods: `expect().toBe()`, `expect().toEqual()`, `expect().toHaveBeenCalled()`, `expect().rejects.toThrow()`

**Run Commands:**
```bash
pnpm test              # Run all tests (Vitest run mode)
pnpm test --watch      # Watch mode (inferred; can add --watch flag)
pnpm test --coverage   # Generate coverage report (Vitest built-in)
```

## Test File Organization

**Location:**
- Co-located with source: test files live in same directory as implementation
- Pattern: `*.test.ts` alongside `*.ts`
- Example: `packages/kernel/src/app-registry.test.ts` colocates with `packages/kernel/src/app-registry.ts`

**Naming:**
- Suffix: `.test.ts` (not `.spec.ts`)
- Filename matches source module: `app-registry.ts` → `app-registry.test.ts`

**Structure:**
```
packages/kernel/src/
├── app-registry.ts
├── app-registry.test.ts
├── theme-engine.ts
├── theme-engine.test.ts
└── index.ts
```

## Test Structure

**Suite Organization:**
```typescript
// From packages/kernel/src/app-registry.test.ts
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AppRegistry } from './app-registry'

describe('AppRegistry', () => {
  let registry: AppRegistry

  beforeEach(() => {
    localStorage.clear()
    registry = new AppRegistry()
  })

  describe('install', () => {
    it('fetches manifest and stores it', async () => {
      // test body
    })
  })

  describe('uninstall', () => {
    // nested describe for related tests
  })
})
```

**Patterns:**
- Top-level `describe()` per class/module
- Nested `describe()` blocks group tests by method or feature
- `beforeEach()` setup: clear state, instantiate objects being tested
- `afterEach()` cleanup: destroy resources, remove listeners
- Descriptive `it()` messages (e.g., `'fetches manifest and stores it'`)
- One assertion per test preferred; multiple assertions allowed when testing state transition

**Setup Pattern:**
```typescript
beforeEach(() => {
  localStorage.clear()
  document.documentElement.removeAttribute('style')
  engine = new ThemeEngine()
})
```

**Teardown Pattern:**
```typescript
afterEach(() => {
  engine.destroy()
})
```

**Assertion Pattern:**
- Explicit assertions: `expect(value).toBe(expected)`
- State verification: `expect(registry.getApp('id')).toEqual(manifest)`
- Side effect verification: `expect(localStorage.getItem(key)).toBe(value)`
- Multiple subscribers: test each callback with `expect(cb).toHaveBeenCalledWith(value)`

## Mocking

**Framework:** Vitest's `vi` object (compatible with Jest API)

**Patterns:**
```typescript
// Mock fetch for async operations
global.fetch = vi.fn().mockResolvedValue({
  ok: true,
  json: async () => manifest,
} as Response)

// Mock localStorage directly (cleared in beforeEach)
localStorage.setItem('key', JSON.stringify(data))
expect(localStorage.getItem('key')).toBe(...)

// Mock window.matchMedia for theme engine
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: query === '(prefers-color-scheme: dark)',
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })),
})
```

**What to Mock:**
- Global `fetch()` for network requests
- Browser APIs: `localStorage`, `window.matchMedia`, `document.documentElement`
- Event listeners: use `vi.fn()` for callbacks

**What NOT to Mock:**
- Classes being tested (instantiate real instances)
- Private methods (test through public API)
- Type definitions and interfaces
- Helper functions in same module

## Fixtures and Factories

**Test Data:**
```typescript
// From app-registry.test.ts — inline fixture
const manifest = {
  id: 'com.test.app',
  name: 'Test App',
  version: '1.0.0',
  entry: 'http://localhost:3001',
  icon: './icon.svg',
  category: 'utility',
  defaultSize: { width: 400, height: 300 },
}
```

**Location:**
- Defined inline within test suites
- No separate fixture files
- Reused within `describe()` block or duplicated for clarity

**Pattern:**
- Create fresh fixture objects for each test to avoid shared state
- Example: `app-registry.test.ts` recreates `manifest` object in each test rather than sharing

## Coverage

**Requirements:** Not enforced via configuration

**View Coverage:**
```bash
pnpm test --coverage
```

**Current State:**
- 2 test files covering core kernel modules
- `app-registry.test.ts`: 204 lines covering installation, persistence, validation
- `theme-engine.test.ts`: 149 lines covering theme switching, subscriptions, auto mode
- Shell and SDK packages have no tests

## Test Types

**Unit Tests:**
- Scope: Individual classes and methods
- Approach: Instantiate class, call methods, verify state and side effects
- Example: `AppRegistry.install()` test verifies fetch, validation, persistence in sequence
- Isolation: Use Vitest mocks to isolate from browser APIs

**Integration Tests:**
- Scope: Cross-module interactions (not present in current codebase)
- Approach: Would test AppRegistry + Theme engine interactions
- Status: Not implemented

**E2E Tests:**
- Framework: Not used
- Status: No end-to-end tests in codebase

## Common Patterns

**Async Testing:**
```typescript
// From app-registry.test.ts
it('fetches manifest and stores it', async () => {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => manifest,
  } as Response)

  await registry.install('http://localhost:3001/manifest.json')

  expect(registry.getApp('com.test.app')).toEqual(manifest)
})
```

**Error Testing:**
```typescript
// From app-registry.test.ts
it('throws when fetch fails', async () => {
  global.fetch = vi.fn().mockResolvedValue({
    ok: false,
    status: 404,
  } as Response)

  await expect(
    registry.install('http://localhost:3001/manifest.json'),
  ).rejects.toThrow('Failed to fetch manifest: http://localhost:3001/manifest.json')
})
```

**Callback/Subscription Testing:**
```typescript
// From theme-engine.test.ts
it('notifies subscribers when mode changes', () => {
  const callback = vi.fn()
  engine.subscribe(callback)
  engine.setMode('dark')

  expect(callback).toHaveBeenCalledWith('dark')
  expect(callback).toHaveBeenCalledTimes(1)
})
```

**DOM State Testing:**
```typescript
// From theme-engine.test.ts
it('sets mode to dark and applies dark CSS variables', () => {
  engine.setMode('dark')

  expect(engine.getMode()).toBe('dark')
  expect(
    document.documentElement.style.getPropertyValue('--color-bg'),
  ).toBe('#1e1e2e')
})
```

## Test Environment

**Config:**
- Root: `vitest.config.ts` sets `environment: 'node'`
- Packages with DOM: `packages/kernel/vitest.config.ts` sets `environment: 'happy-dom'`
- `globals: true` enabled for `describe`, `it`, `expect` imports (no explicit import needed in tests)
- `passWithNoTests: true` allows packages with no tests to pass CI

---

*Testing analysis: 2026-04-01*
