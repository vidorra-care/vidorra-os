# Phase 4: SDK v0.1 — Research

**Researched:** 2026-04-03

## Summary

Phase 4 delivers `@vidorra/sdk` — a developer-facing API that wraps `KernelBusClient` behind a clean `createApp()` factory. The primary complexity is a **prerequisite refactor**: extracting `KernelBusClient` and bus types into a new `@vidorra/bus` package so the SDK bundle remains self-contained (no kernel/shell code leaking in). Once `@vidorra/bus` exists, the SDK itself is thin wrapper code. Bundle size ≤ 8 KB gzip is achievable — `KernelBusClient` is ~90 lines, the SDK wrapper is ~60 lines, bus types are pure interfaces.

## Current State

### Existing assets (ready to migrate/use)

| File | Status | Notes |
|------|--------|-------|
| `packages/kernel/src/kernel-bus-client.ts` | Complete | 90 lines, no external deps beyond `@vidorra/types` |
| `packages/kernel/src/kernel-bus-client.test.ts` | Complete | Comprehensive: RPC, timeout, push, concurrent, lifecycle |
| `packages/types/src/kernel-bus.ts` | Complete | 3 interfaces: `KernelBusMessage`, `KernelBusResponse`, `KernelBusPush` |
| `packages/kernel/src/kernel-bus-host.ts` | Complete | Imports KernelBusClient by path — needs import update post-migration |
| `packages/kernel/src/index.ts` | Complete | Exports KernelBusClient — must be removed post-migration |
| `packages/sdk/src/index.ts` | Stub | `export {}` only |
| `packages/sdk/package.json` | Minimal | No build script, no `@vidorra/bus` dep, dev-only exports |

### pnpm workspace
`pnpm-workspace.yaml` uses glob `packages/*` — adding `packages/bus/` is automatically picked up. No workspace.yaml edit needed.

### Root `package.json` test script
Currently: `pnpm --filter @vidorra/kernel run test` — only runs kernel tests. After migration, kernel tests must still pass (import path changes), and new `@vidorra/bus` + `@vidorra/sdk` tests need to be added to root script.

## Implementation Approach

### Step 1: Create `packages/bus` package

New package `@vidorra/bus`:
```
packages/bus/
  package.json          # name: @vidorra/bus, type: module
  src/
    types.ts            # KernelBusMessage, KernelBusResponse, KernelBusPush (moved from @vidorra/types)
    client.ts           # KernelBusClient (moved from @vidorra/kernel)
    client.test.ts      # Moved test (update import path only)
    index.ts            # Re-exports: KernelBusClient + all types
  vitest.config.ts      # happy-dom environment (same as kernel)
  tsconfig.json         # extends root, strict
```

### Step 2: Update dependents

- `packages/kernel/src/kernel-bus-client.ts` → **delete** (moved to bus)
- `packages/kernel/src/kernel-bus-client.test.ts` → **delete** (moved to bus)
- `packages/kernel/src/kernel-bus-host.ts` → change import from `./kernel-bus-client` to `@vidorra/bus`
- `packages/kernel/src/index.ts` → remove `KernelBusClient` export
- `packages/kernel/package.json` → add `@vidorra/bus: workspace:*` dependency
- `packages/types/src/kernel-bus.ts` → either delete or re-export from `@vidorra/bus` (re-export is safer for backwards compat; no apps currently import from `@vidorra/types` directly for bus types)

### Step 3: Implement `@vidorra/sdk`

```typescript
// packages/sdk/src/index.ts
import { KernelBusClient } from '@vidorra/bus'

export interface VidorraWindow {
  setTitle(title: string): Promise<void>
  close(): Promise<void>
  minimize(): Promise<void>
  maximize(): Promise<void>
  resize(width: number, height: number): Promise<void>
}

export interface VidorraTheme {
  get(): Promise<'light' | 'dark'>
  onChange(cb: (mode: 'light' | 'dark') => void): () => void
}

export interface VidorraApp {
  ready(): Promise<void>
  window: VidorraWindow
  theme: VidorraTheme
}

export function createApp(): VidorraApp {
  const client = new KernelBusClient()
  client.init()

  const window_: VidorraWindow = {
    setTitle: (title) => client.send('window.setTitle', { title }) as Promise<void>,
    close: () => client.send('window.close') as Promise<void>,
    minimize: () => client.send('window.minimize') as Promise<void>,
    maximize: () => client.send('window.maximize') as Promise<void>,
    resize: (width, height) => client.send('window.resize', { width, height }) as Promise<void>,
  }

  const theme_: VidorraTheme = {
    get: () => client.send('theme.get') as Promise<'light' | 'dark'>,
    onChange: (cb) =>
      client.onPush((push) => {
        if (push.method === 'theme.changed') {
          cb(push.params as 'light' | 'dark')
        }
      }),
  }

  return {
    ready: () => { client.sendReady(); return Promise.resolve() },
    window: window_,
    theme: theme_,
  }
}
```

### Step 4: Vite lib build for SDK

```typescript
// packages/sdk/vite.config.ts
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

export default defineConfig({
  build: {
    lib: {
      entry: 'src/index.ts',
      formats: ['es'],
      fileName: 'vidorra-sdk',
    },
    rollupOptions: {
      external: [],  // inline @vidorra/bus for self-contained bundle
    },
  },
  plugins: [dts({ outDir: 'dist' })],
})
```

`packages/sdk/package.json` final form:
```json
{
  "name": "@vidorra/sdk",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "build": "vite build",
    "test": "vitest run"
  },
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "default": "./dist/vidorra-sdk.js"
    }
  },
  "dependencies": {
    "@vidorra/bus": "workspace:*"
  },
  "devDependencies": {
    "vite": "^6.0.0",
    "vite-plugin-dts": "^4.0.0",
    "vitest": "^3.0.0",
    "happy-dom": "^14.0.0",
    "typescript": "^5.5.0"
  }
}
```

### Step 5: SDK unit tests

Mock `@vidorra/bus` with `vi.mock`, verify that each SDK method calls the correct `client.send()` / `client.sendReady()` / `client.onPush()`:

```typescript
// packages/sdk/src/index.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@vidorra/bus', () => {
  const mockClient = {
    init: vi.fn(),
    sendReady: vi.fn(),
    send: vi.fn().mockResolvedValue(undefined),
    onPush: vi.fn().mockReturnValue(() => {}),
  }
  return {
    KernelBusClient: vi.fn(() => mockClient),
    mockClient, // expose for assertions
  }
})

// Then import createApp after mock is set up
import { createApp } from './index'
```

## Package Architecture (post-Phase 4)

```
packages/
  bus/           @vidorra/bus        ← NEW: KernelBusClient + bus types
  kernel/        @vidorra/kernel     ← depends on @vidorra/bus (for KernelBusHost import)
  sdk/           @vidorra/sdk        ← depends on @vidorra/bus (createApp wrapper)
  types/         @vidorra/types      ← retains non-bus types; kernel-bus.ts → re-export from @vidorra/bus
  shell/         @vidorra/shell      ← unchanged (uses @vidorra/kernel)
```

## Key Files to Create/Modify

### CREATE
- `packages/bus/package.json`
- `packages/bus/tsconfig.json`
- `packages/bus/vitest.config.ts`
- `packages/bus/src/types.ts`
- `packages/bus/src/client.ts`
- `packages/bus/src/client.test.ts`
- `packages/bus/src/index.ts`
- `packages/sdk/vite.config.ts`
- `packages/sdk/vitest.config.ts`
- `packages/sdk/tsconfig.json`
- `packages/sdk/src/index.test.ts`

### MODIFY
- `packages/kernel/src/kernel-bus-host.ts` — import path: `./kernel-bus-client` → `@vidorra/bus`
- `packages/kernel/src/index.ts` — remove KernelBusClient export
- `packages/kernel/package.json` — add `@vidorra/bus: workspace:*`
- `packages/types/src/kernel-bus.ts` — re-export from `@vidorra/bus`
- `packages/sdk/src/index.ts` — full implementation
- `packages/sdk/package.json` — add build/test scripts, exports, dependencies
- `package.json` (root) — update test script to include bus + sdk
- `.gitignore` — add `packages/sdk/dist/`

### DELETE
- `packages/kernel/src/kernel-bus-client.ts` (moved to bus)
- `packages/kernel/src/kernel-bus-client.test.ts` (moved to bus)

## Migration Risks

### Risk 1: `@vidorra/types` backward compat
Other code may `import { KernelBusMessage } from '@vidorra/types'`. The shell's `kernel-bus-host.ts` imports types from `@vidorra/types`. Safe approach: keep `packages/types/src/kernel-bus.ts` as a re-export file:
```typescript
// packages/types/src/kernel-bus.ts (after migration)
export type { KernelBusMessage, KernelBusResponse, KernelBusPush } from '@vidorra/bus'
```
This requires `packages/types/package.json` to add `@vidorra/bus: workspace:*`.

### Risk 2: Circular dependency potential
`@vidorra/bus` must NOT depend on `@vidorra/kernel` or `@vidorra/types` (would create a cycle). The bus types move INTO bus, so bus has zero external workspace deps.

### Risk 3: `vite-plugin-dts` version compatibility
Vite 6 requires `vite-plugin-dts` v4.x. Verify: `pnpm add -D vite-plugin-dts@^4` for the sdk package.

### Risk 4: Bundle size
`KernelBusClient` (~90 lines) + SDK wrapper (~60 lines) + 3 type interfaces + Vite ESM overhead ≈ 4-6 KB gzip. Well within 8 KB. No risk.

### Risk 5: Root test script only runs kernel tests
After migration, `packages/kernel/src/kernel-bus-client.test.ts` is deleted — the root `pnpm test` would run 0 kernel bus tests. Must update root test to include `@vidorra/bus` and `@vidorra/sdk`.

## Validation Architecture

### SDK-01: `import { createApp } from '@vidorra/sdk'` works in plain HTML app
- **Unit**: After `pnpm --filter @vidorra/sdk build`, verify `dist/vidorra-sdk.js` exists
- **Integration**: `packages/sdk/dist/vidorra-sdk.js` can be imported as ES module — verified by checking exports with `node --input-type=module` or the SDK test file importing from the built dist
- **Criterion**: `ls packages/sdk/dist/vidorra-sdk.js` exits 0; file is valid ESM (starts with `export`)

### SDK-02: `app.ready()` sends `app.ready` signal; `app.window.*` and `app.theme.*` map to KernelBus
- **Unit**: Mock `KernelBusClient`, call `createApp()`, assert `client.init()` called, `app.ready()` calls `client.sendReady()`, `app.window.setTitle('X')` calls `client.send('window.setTitle', { title: 'X' })`, etc.
- **Criterion**: All SDK unit tests pass: `pnpm --filter @vidorra/sdk test` exits 0

### SDK-03: Bundle ≤ 8 KB gzip
- **Criterion**: `gzip -c packages/sdk/dist/vidorra-sdk.js | wc -c` outputs a number ≤ 8192
- **Fallback check**: `ls -la packages/sdk/dist/vidorra-sdk.js` shows < 25 KB uncompressed (reasonable proxy)

### SDK-04: Full TypeScript type coverage (no implicit `any`)
- **Criterion**: `pnpm --filter @vidorra/sdk build` exits 0 with `strict: true` and `noImplicitAny: true` in tsconfig; no `@ts-ignore` in sdk source files
- **Grep check**: `grep -r "any" packages/sdk/src/` finds zero results (or only type-cast `as` with explicit types)

### Migration correctness
- **Criterion**: `pnpm --filter @vidorra/bus test` exits 0 (all moved KernelBusClient tests pass)
- **Criterion**: `pnpm --filter @vidorra/kernel build` exits 0 (no broken imports after migration)
- **Criterion**: `pnpm build` (root) exits 0 end-to-end

## RESEARCH COMPLETE
