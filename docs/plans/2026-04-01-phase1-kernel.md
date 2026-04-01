# Phase 1 Kernel Layer Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement `@vidorra/kernel` with `AppRegistry` (fetch/validate/persist manifests) and `ThemeEngine` (CSS variables, auto mode, subscriber pattern), both TDD with happy-dom.

**Architecture:** Two independent classes with singleton exports. `AppRegistry` persists installed app manifests to `localStorage`. `ThemeEngine` injects CSS variables into `document.documentElement` and notifies subscribers on mode changes. Both classes are independently instantiable for test isolation.

**Tech Stack:** TypeScript 5 strict, Vitest 3, happy-dom, localStorage (browser API)

---

## Task 1: Test environment setup

**Files:**
- Modify: `packages/kernel/package.json`
- Create: `packages/kernel/vitest.config.ts`

**Step 1: Add devDependencies to packages/kernel/package.json**

Read the current file, then add `devDependencies`:

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
  },
  "devDependencies": {
    "happy-dom": "^14.0.0",
    "vitest": "workspace:*"
  }
}
```

**Step 2: Create packages/kernel/vitest.config.ts**

```ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'happy-dom',
    passWithNoTests: true,
  },
})
```

**Step 3: Run pnpm install from repo root**

```bash
cd d:/Code/Study/vidorra-os && pnpm install
```

Expected: installs happy-dom in packages/kernel, no errors

**Step 4: Verify test environment works**

```bash
pnpm --filter @vidorra/kernel test
```

Expected: `No test files found, passWithNoTests is set to true` — exits 0

**Step 5: Commit**

```bash
git add packages/kernel/package.json packages/kernel/vitest.config.ts pnpm-lock.yaml
git commit -m "chore: add happy-dom test environment to @vidorra/kernel"
```

---

## Task 2: AppRegistry — failing tests first

**Files:**
- Create: `packages/kernel/src/app-registry.test.ts`

**Step 1: Write all AppRegistry tests (they will fail — AppRegistry doesn't exist yet)**

```ts
// packages/kernel/src/app-registry.test.ts
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
      const manifest = {
        id: 'com.test.app',
        name: 'Test App',
        version: '1.0.0',
        entry: 'http://localhost:3001',
        icon: './icon.svg',
        category: 'utility',
        defaultSize: { width: 400, height: 300 },
      }

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => manifest,
      } as Response)

      await registry.install('http://localhost:3001/manifest.json')

      expect(registry.getApp('com.test.app')).toEqual(manifest)
    })

    it('persists manifest to localStorage', async () => {
      const manifest = {
        id: 'com.test.app',
        name: 'Test App',
        version: '1.0.0',
        entry: 'http://localhost:3001',
        icon: './icon.svg',
        category: 'utility',
        defaultSize: { width: 400, height: 300 },
      }

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => manifest,
      } as Response)

      await registry.install('http://localhost:3001/manifest.json')

      const stored = localStorage.getItem('vidorra:registry')
      expect(stored).not.toBeNull()
      const parsed = JSON.parse(stored!)
      expect(parsed['com.test.app']).toEqual(manifest)
    })

    it('overwrites existing app with same id (silent update)', async () => {
      const manifest = {
        id: 'com.test.app',
        name: 'Test App',
        version: '1.0.0',
        entry: 'http://localhost:3001',
        icon: './icon.svg',
        category: 'utility',
        defaultSize: { width: 400, height: 300 },
      }
      const updated = { ...manifest, version: '2.0.0' }

      global.fetch = vi.fn()
        .mockResolvedValueOnce({ ok: true, json: async () => manifest } as Response)
        .mockResolvedValueOnce({ ok: true, json: async () => updated } as Response)

      await registry.install('http://localhost:3001/manifest.json')
      await registry.install('http://localhost:3001/manifest.json')

      expect(registry.getApp('com.test.app')?.version).toBe('2.0.0')
      expect(registry.getAllApps()).toHaveLength(1)
    })

    it('throws when fetch fails', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
      } as Response)

      await expect(
        registry.install('http://localhost:3001/manifest.json'),
      ).rejects.toThrow('Failed to fetch manifest: http://localhost:3001/manifest.json')
    })

    it('throws when manifest is missing required field', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ id: 'com.test.app' }), // missing name, version, etc.
      } as Response)

      await expect(
        registry.install('http://localhost:3001/manifest.json'),
      ).rejects.toThrow('Invalid manifest: missing name')
    })
  })

  describe('uninstall', () => {
    it('removes an installed app', async () => {
      const manifest = {
        id: 'com.test.app',
        name: 'Test App',
        version: '1.0.0',
        entry: 'http://localhost:3001',
        icon: './icon.svg',
        category: 'utility',
        defaultSize: { width: 400, height: 300 },
      }

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => manifest,
      } as Response)

      await registry.install('http://localhost:3001/manifest.json')
      await registry.uninstall('com.test.app')

      expect(registry.getApp('com.test.app')).toBeUndefined()
      expect(registry.getAllApps()).toHaveLength(0)
    })

    it('removes app from localStorage on uninstall', async () => {
      const manifest = {
        id: 'com.test.app',
        name: 'Test App',
        version: '1.0.0',
        entry: 'http://localhost:3001',
        icon: './icon.svg',
        category: 'utility',
        defaultSize: { width: 400, height: 300 },
      }

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => manifest,
      } as Response)

      await registry.install('http://localhost:3001/manifest.json')
      await registry.uninstall('com.test.app')

      const stored = localStorage.getItem('vidorra:registry')
      const parsed = JSON.parse(stored!)
      expect(parsed['com.test.app']).toBeUndefined()
    })

    it('silently ignores uninstalling non-existent app', async () => {
      await expect(registry.uninstall('com.nonexistent')).resolves.toBeUndefined()
    })
  })

  describe('persistence', () => {
    it('restores apps from localStorage on construction', async () => {
      const manifest = {
        id: 'com.test.app',
        name: 'Test App',
        version: '1.0.0',
        entry: 'http://localhost:3001',
        icon: './icon.svg',
        category: 'utility',
        defaultSize: { width: 400, height: 300 },
      }

      localStorage.setItem(
        'vidorra:registry',
        JSON.stringify({ 'com.test.app': manifest }),
      )

      const freshRegistry = new AppRegistry()
      expect(freshRegistry.getApp('com.test.app')).toEqual(manifest)
    })
  })

  describe('getAllApps', () => {
    it('returns empty array when no apps installed', () => {
      expect(registry.getAllApps()).toEqual([])
    })
  })
})
```

**Step 2: Run tests to confirm they fail**

```bash
pnpm --filter @vidorra/kernel test
```

Expected: FAIL — `Cannot find module './app-registry'`

**Step 3: Commit the failing tests**

```bash
git add packages/kernel/src/app-registry.test.ts
git commit -m "test: add AppRegistry failing tests (TDD)"
```

---

## Task 3: AppRegistry — implementation

**Files:**
- Create: `packages/kernel/src/app-registry.ts`

**Step 1: Write the implementation**

```ts
// packages/kernel/src/app-registry.ts
import type { AppManifest } from '@vidorra/types'

const REQUIRED_FIELDS: (keyof AppManifest)[] = [
  'id',
  'name',
  'version',
  'entry',
  'icon',
  'category',
  'defaultSize',
]

export class AppRegistry {
  private apps = new Map<string, AppManifest>()
  private readonly STORAGE_KEY = 'vidorra:registry'

  constructor() {
    this.load()
  }

  async install(manifestUrl: string): Promise<void> {
    const response = await fetch(manifestUrl)
    if (!response.ok) {
      throw new Error(`Failed to fetch manifest: ${manifestUrl}`)
    }
    const data: unknown = await response.json()
    const manifest = this.validate(data)
    this.apps.set(manifest.id, manifest)
    this.persist()
  }

  async uninstall(appId: string): Promise<void> {
    this.apps.delete(appId)
    this.persist()
  }

  getApp(appId: string): AppManifest | undefined {
    return this.apps.get(appId)
  }

  getAllApps(): AppManifest[] {
    return Array.from(this.apps.values())
  }

  private validate(data: unknown): AppManifest {
    if (typeof data !== 'object' || data === null) {
      throw new Error('Invalid manifest: not an object')
    }
    const obj = data as Record<string, unknown>
    for (const field of REQUIRED_FIELDS) {
      if (obj[field] === undefined || obj[field] === null) {
        throw new Error(`Invalid manifest: missing ${field}`)
      }
    }
    return obj as unknown as AppManifest
  }

  private persist(): void {
    const record: Record<string, AppManifest> = {}
    for (const [id, manifest] of this.apps) {
      record[id] = manifest
    }
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(record))
  }

  private load(): void {
    const stored = localStorage.getItem(this.STORAGE_KEY)
    if (!stored) return
    try {
      const record = JSON.parse(stored) as Record<string, AppManifest>
      for (const [id, manifest] of Object.entries(record)) {
        this.apps.set(id, manifest)
      }
    } catch {
      // corrupted storage — start fresh
      localStorage.removeItem(this.STORAGE_KEY)
    }
  }
}

export const appRegistry = new AppRegistry()
```

**Step 2: Run tests**

```bash
pnpm --filter @vidorra/kernel test
```

Expected: All AppRegistry tests PASS (9 tests)

**Step 3: Commit**

```bash
git add packages/kernel/src/app-registry.ts
git commit -m "feat: implement AppRegistry with localStorage persistence"
```

---

## Task 4: ThemeEngine — failing tests first

**Files:**
- Create: `packages/kernel/src/theme-engine.test.ts`

**Step 1: Write all ThemeEngine tests**

```ts
// packages/kernel/src/theme-engine.test.ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ThemeEngine } from './theme-engine'

describe('ThemeEngine', () => {
  let engine: ThemeEngine

  beforeEach(() => {
    localStorage.clear()
    // Reset CSS variables
    document.documentElement.removeAttribute('style')
    engine = new ThemeEngine()
  })

  afterEach(() => {
    engine.destroy()
  })

  describe('setMode', () => {
    it('sets mode to dark and applies dark CSS variables', () => {
      engine.setMode('dark')

      expect(engine.getMode()).toBe('dark')
      expect(
        document.documentElement.style.getPropertyValue('--color-bg'),
      ).toBe('#1e1e2e')
      expect(
        document.documentElement.style.getPropertyValue('--color-text'),
      ).toBe('#cdd6f4')
    })

    it('sets mode to light and applies light CSS variables', () => {
      engine.setMode('dark')
      engine.setMode('light')

      expect(engine.getMode()).toBe('light')
      expect(
        document.documentElement.style.getPropertyValue('--color-bg'),
      ).toBe('#ffffff')
      expect(
        document.documentElement.style.getPropertyValue('--color-text'),
      ).toBe('#1a1a1a')
    })

    it('notifies subscribers when mode changes', () => {
      const callback = vi.fn()
      engine.subscribe(callback)
      engine.setMode('dark')

      expect(callback).toHaveBeenCalledWith('dark')
      expect(callback).toHaveBeenCalledTimes(1)
    })

    it('persists mode to localStorage', () => {
      engine.setMode('dark')

      expect(localStorage.getItem('vidorra:theme')).toBe('dark')
    })
  })

  describe('getResolvedMode', () => {
    it('returns light when mode is light', () => {
      engine.setMode('light')
      expect(engine.getResolvedMode()).toBe('light')
    })

    it('returns dark when mode is dark', () => {
      engine.setMode('dark')
      expect(engine.getResolvedMode()).toBe('dark')
    })

    it('returns dark when mode is auto and system prefers dark', () => {
      // happy-dom supports matchMedia — mock it to prefer dark
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation((query: string) => ({
          matches: query === '(prefers-color-scheme: dark)',
          media: query,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        })),
      })

      const darkEngine = new ThemeEngine()
      darkEngine.setMode('auto')
      expect(darkEngine.getResolvedMode()).toBe('dark')
      darkEngine.destroy()
    })

    it('returns light when mode is auto and system prefers light', () => {
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation((query: string) => ({
          matches: false, // system prefers light
          media: query,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        })),
      })

      const lightEngine = new ThemeEngine()
      lightEngine.setMode('auto')
      expect(lightEngine.getResolvedMode()).toBe('light')
      lightEngine.destroy()
    })
  })

  describe('subscribe', () => {
    it('returns an unsubscribe function that stops notifications', () => {
      const callback = vi.fn()
      const unsubscribe = engine.subscribe(callback)

      engine.setMode('dark')
      expect(callback).toHaveBeenCalledTimes(1)

      unsubscribe()
      engine.setMode('light')
      expect(callback).toHaveBeenCalledTimes(1) // no additional calls
    })

    it('supports multiple subscribers', () => {
      const cb1 = vi.fn()
      const cb2 = vi.fn()
      engine.subscribe(cb1)
      engine.subscribe(cb2)

      engine.setMode('dark')
      expect(cb1).toHaveBeenCalledWith('dark')
      expect(cb2).toHaveBeenCalledWith('dark')
    })
  })

  describe('persistence', () => {
    it('restores mode from localStorage on construction', () => {
      localStorage.setItem('vidorra:theme', 'dark')
      const freshEngine = new ThemeEngine()

      expect(freshEngine.getMode()).toBe('dark')
      expect(
        document.documentElement.style.getPropertyValue('--color-bg'),
      ).toBe('#1e1e2e')
      freshEngine.destroy()
    })

    it('defaults to light mode when localStorage is empty', () => {
      expect(engine.getMode()).toBe('light')
    })
  })
})
```

**Step 2: Run tests to confirm they fail**

```bash
pnpm --filter @vidorra/kernel test
```

Expected: ThemeEngine tests FAIL — `Cannot find module './theme-engine'`

**Step 3: Commit the failing tests**

```bash
git add packages/kernel/src/theme-engine.test.ts
git commit -m "test: add ThemeEngine failing tests (TDD)"
```

---

## Task 5: ThemeEngine — implementation

**Files:**
- Create: `packages/kernel/src/theme-engine.ts`

**Step 1: Write the implementation**

```ts
// packages/kernel/src/theme-engine.ts

export type ThemeMode = 'light' | 'dark' | 'auto'

const THEMES = {
  light: {
    '--color-bg': '#ffffff',
    '--color-surface': '#f5f5f5',
    '--color-text': '#1a1a1a',
    '--color-accent': '#0066cc',
    '--color-border': '#e0e0e0',
  },
  dark: {
    '--color-bg': '#1e1e2e',
    '--color-surface': '#313244',
    '--color-text': '#cdd6f4',
    '--color-accent': '#89b4fa',
    '--color-border': '#45475a',
  },
} as const

export class ThemeEngine {
  private mode: ThemeMode = 'light'
  private subscribers = new Set<(mode: ThemeMode) => void>()
  private mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
  private readonly STORAGE_KEY = 'vidorra:theme'

  constructor() {
    this.load()
    this.mediaQuery.addEventListener('change', this.onSystemChange)
    this.applyTheme()
  }

  setMode(mode: ThemeMode): void {
    this.mode = mode
    this.persist()
    this.applyTheme()
    this.notify()
  }

  getMode(): ThemeMode {
    return this.mode
  }

  getResolvedMode(): 'light' | 'dark' {
    if (this.mode !== 'auto') return this.mode
    return this.mediaQuery.matches ? 'dark' : 'light'
  }

  subscribe(cb: (mode: ThemeMode) => void): () => void {
    this.subscribers.add(cb)
    return () => this.subscribers.delete(cb)
  }

  destroy(): void {
    this.mediaQuery.removeEventListener('change', this.onSystemChange)
    this.subscribers.clear()
  }

  private applyTheme(): void {
    const resolved = this.getResolvedMode()
    const vars = THEMES[resolved]
    const root = document.documentElement
    for (const [key, value] of Object.entries(vars)) {
      root.style.setProperty(key, value)
    }
  }

  private notify(): void {
    for (const cb of this.subscribers) {
      cb(this.mode)
    }
  }

  private persist(): void {
    localStorage.setItem(this.STORAGE_KEY, this.mode)
  }

  private load(): void {
    const stored = localStorage.getItem(this.STORAGE_KEY)
    if (stored === 'light' || stored === 'dark' || stored === 'auto') {
      this.mode = stored
    }
  }

  private onSystemChange = (): void => {
    if (this.mode === 'auto') {
      this.applyTheme()
      this.notify()
    }
  }
}

export const themeEngine = new ThemeEngine()
```

**Step 2: Run tests**

```bash
pnpm --filter @vidorra/kernel test
```

Expected: All ThemeEngine tests PASS (11 tests). All AppRegistry tests still PASS. Total: 20 tests passing.

**Step 3: Commit**

```bash
git add packages/kernel/src/theme-engine.ts
git commit -m "feat: implement ThemeEngine with CSS variables and subscriber pattern"
```

---

## Task 6: Wire up index.ts and final verification

**Files:**
- Modify: `packages/kernel/src/index.ts`

**Step 1: Update index.ts to export everything**

Read `packages/kernel/src/index.ts` (currently just `export {}`), then replace with:

```ts
export { AppRegistry, appRegistry } from './app-registry'
export { ThemeEngine, themeEngine } from './theme-engine'
export type { ThemeMode } from './theme-engine'
```

**Step 2: Run full test suite**

```bash
pnpm --filter @vidorra/kernel test
```

Expected: All tests pass (20+)

**Step 3: Check TypeScript compiles with no errors and no `any`**

```bash
cd packages/kernel && npx tsc --noEmit
```

Expected: no output (clean compile)

**Step 4: Run lint**

```bash
pnpm lint
```

Expected: no errors

**Step 5: Commit**

```bash
git add packages/kernel/src/index.ts
git commit -m "feat: export AppRegistry and ThemeEngine from @vidorra/kernel"
```

---

## Acceptance Checklist

- [ ] `pnpm --filter @vidorra/kernel test` — all tests pass (20+ tests)
- [ ] AppRegistry: install/uninstall/getApp/getAllApps all tested
- [ ] ThemeEngine: setMode/getResolvedMode/subscribe all tested
- [ ] localStorage persistence tested for both classes
- [ ] `tsc --noEmit` in packages/kernel — no errors
- [ ] No `any` types in implementation files
- [ ] `pnpm lint` — no errors
