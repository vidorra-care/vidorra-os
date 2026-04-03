---
phase: 04-sdk-v01
plan: 02
subsystem: sdk
tags: [typescript, vitest, vite, pnpm-workspaces, sdk, createApp, KernelBusClient, tdd]

# Dependency graph
requires:
  - phase: 04-sdk-v01
    plan: 01
    provides: "@vidorra/bus package with KernelBusClient — the communication layer createApp() wraps"
provides:
  - "createApp() factory function returning VidorraApp object with app.ready(), app.window.*, app.theme.*"
  - "VidorraApp, VidorraWindow, VidorraTheme TypeScript interfaces exported from @vidorra/sdk"
  - "packages/sdk/dist/vidorra-sdk.js (ESM bundle, 1.02 kB gzip — well under 8 KB limit)"
  - "packages/sdk/dist/index.d.ts (TypeScript declaration file via vite-plugin-dts)"
  - "Root test script updated to run kernel + bus + sdk (65 total tests)"
affects: [05-apps, any-app-using-vidorra-sdk]

# Tech tracking
tech-stack:
  added: ["vite-plugin-dts@^4.0.0 (TypeScript declaration generation)", "happy-dom@^14.0.0 (SDK test environment)"]
  patterns: ["createApp() factory pattern (not singleton) — one KernelBusClient instance per app context", "TDD: RED commit (test) → GREEN commit (feat) for SDK implementation", "Vite lib mode with external:[] to inline @vidorra/bus into self-contained bundle"]

key-files:
  created:
    - packages/sdk/src/index.ts
    - packages/sdk/src/index.test.ts
    - packages/sdk/vitest.config.ts
    - packages/sdk/vite.config.ts
    - packages/sdk/dist/vidorra-sdk.js
    - packages/sdk/dist/index.d.ts
  modified:
    - packages/sdk/package.json
    - package.json
    - .gitignore

key-decisions:
  - "createApp() is a factory (not singleton) — each call creates a new KernelBusClient and calls client.init()"
  - "Vite lib build with external:[] inlines @vidorra/bus into the SDK bundle, making it self-contained (no peer dep)"
  - "app.ready() returns Promise.resolve() immediately after sendReady() — no Shell acknowledgment needed (single-direction signal)"
  - "app.theme.onChange handler filters push.method === 'theme.changed' before calling cb — other push types ignored"
  - "vite-plugin-dts with insertTypesEntry:true generates both dist/index.d.ts and correct exports entry"

patterns-established:
  - "SDK wraps bus client: VidorraApp/VidorraWindow/VidorraTheme delegate to KernelBusClient methods via type-safe wrappers"
  - "TDD pattern for SDK: vi.mock('@vidorra/bus') before import, assert client.send() / client.sendReady() calls"
  - "Bundle validation: gzip -c dist/vidorra-sdk.js | wc -c must be <= 8192"

requirements-completed: [SDK-01, SDK-02, SDK-03, SDK-04]

# Metrics
duration: 10min
completed: 2026-04-03
---

# Phase 4 Plan 02: @vidorra/sdk Implementation Summary

**`createApp()` factory delivering VidorraApp/VidorraWindow/VidorraTheme via KernelBusClient; ESM bundle at 1.02 kB gzip with full TypeScript declarations; all 13 SDK unit tests pass via vi.mock('@vidorra/bus') strategy**

## Performance

- **Duration:** ~10 min
- **Started:** 2026-04-03T02:38:51Z
- **Completed:** 2026-04-03T02:49:00Z
- **Tasks:** 2 completed (Task 1 = TDD with 3 commits: RED + GREEN; Task 2 = build + config)
- **Files modified:** 9

## Accomplishments

- Implemented `createApp()` factory with full `VidorraApp`, `VidorraWindow`, `VidorraTheme` interfaces — all method mappings verified by unit tests
- 13 unit tests pass using `vi.mock('@vidorra/bus')` — each SDK method verified to call the correct KernelBusClient method with correct arguments
- Vite lib build produces `dist/vidorra-sdk.js` at 1.02 kB gzip (8x under the 8 KB limit) with `dist/index.d.ts` TypeScript declarations
- Root test script updated: `pnpm test` now runs 65 tests across kernel (39) + bus (13) + sdk (13)

## Task Commits

Each task was committed atomically:

1. **Task 1 RED: Add failing tests for createApp()** - `1572022` (test) — 13 failing tests covering all VidorraApp methods
2. **Task 1 GREEN: Implement createApp()** - `01f7c5d` (feat) — full SDK implementation, all 13 tests pass
3. **Task 2: Add Vite build config, update root test script, finalize .gitignore** - `70a9627` (feat)
4. **Chore: Update pnpm-lock.yaml** - `10b2368` (chore)

## Files Created/Modified

- `packages/sdk/src/index.ts` — Full createApp() implementation + VidorraApp/VidorraWindow/VidorraTheme interfaces with JSDoc
- `packages/sdk/src/index.test.ts` — 13 unit tests mocking @vidorra/bus, verifying all method mappings
- `packages/sdk/vitest.config.ts` — Vitest config with happy-dom environment
- `packages/sdk/vite.config.ts` — Vite lib build config: ESM format, vidorra-sdk fileName, vite-plugin-dts, external:[]
- `packages/sdk/package.json` — Updated with build/test scripts, @vidorra/bus dep, vite-plugin-dts/happy-dom devDeps
- `package.json` (root) — Test script updated to run kernel + bus + sdk
- `.gitignore` — Added packages/sdk/dist/

## Decisions Made

1. **createApp() is a factory (not singleton)**: Each call creates a new `KernelBusClient` instance and calls `init()`. This is the correct pattern for apps — one app context = one client instance.
2. **Vite lib with external:[]**: `@vidorra/bus` is inlined into the SDK bundle. This makes the SDK a single self-contained file that any web app can import without needing to install `@vidorra/bus` separately.
3. **app.ready() resolves immediately**: After calling `client.sendReady()`, returns `Promise.resolve()` without waiting for Shell acknowledgment. The `app.ready` signal is unidirectional by design (Phase 3 KernelBusHost trust model).
4. **vite-plugin-dts with insertTypesEntry:true**: Generates `dist/index.d.ts` and adds the correct `types` entry so TypeScript consumers get full type safety.

## Deviations from Plan

### Minor Observation (Not a Bug)

**Bundle starts with `var` helpers, not `export`**
- **Found during:** Task 2 verification
- **Issue:** The plan's `head -1` check expected `export` as the first line. Vite's ESM lib output emits helper variable declarations first (for class field decorators), then `export { ... }` at the end.
- **Impact:** None — the file IS valid ESM (contains `export { w as createApp }`). The `head -1` criterion was a proxy that doesn't account for Vite's minified helper preamble.
- **Verification:** `gzip -c dist/vidorra-sdk.js | wc -c` = 1035 (passes ≤ 8192); the file imports correctly as an ES module.
- **No fix needed**: The file is valid ESM per spec. The acceptance criterion proxy (head -1) was overly specific.

---

**Total deviations:** 0 functional deviations — plan executed as specified. One criterion observation documented above.
**Impact on plan:** None — all SDK requirements (SDK-01 through SDK-04) fulfilled.

## Issues Encountered

- Worktree was behind main (missing `packages/bus` from Plan 01). Resolved by merging `main` into the worktree branch before execution. This is expected parallel-execution behavior.

## Known Stubs

None — all exports are fully implemented. `createApp()` wires directly to KernelBusClient methods. No placeholder data flows to UI.

## Next Phase Readiness

- `@vidorra/sdk` is ready for use by Phase 5 apps (App Store, Settings, Calculator, Welcome)
- Any web app can `import { createApp } from '@vidorra/sdk'` and get full shell integration
- TypeScript declarations ensure full IDE support for app developers

---
*Phase: 04-sdk-v01*
*Completed: 2026-04-03*
