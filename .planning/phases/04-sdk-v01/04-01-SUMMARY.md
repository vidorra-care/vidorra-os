---
phase: 04-sdk-v01
plan: 01
subsystem: bus
tags: [typescript, vitest, pnpm-workspaces, kernel-bus, migration, package-extraction]

# Dependency graph
requires:
  - phase: 03-kernelbus-bridge
    provides: KernelBusClient + KernelBusHost implementations used as migration source
provides:
  - "@vidorra/bus package with KernelBusClient, KernelBusMessage, KernelBusResponse, KernelBusPush"
  - "Clean dependency boundary: @vidorra/bus has zero workspace deps"
  - "@vidorra/types backward-compat re-export for KernelBus types from @vidorra/bus"
affects: [04-02-sdk-implementation, any package importing @vidorra/bus]

# Tech tracking
tech-stack:
  added: ["@vidorra/bus package (new)", "happy-dom (in @vidorra/bus devDependencies)"]
  patterns: ["Package extraction: move implementation to leaf package, update dependents to import from new package, preserve backward compat via re-export"]

key-files:
  created:
    - packages/bus/package.json
    - packages/bus/tsconfig.json
    - packages/bus/vitest.config.ts
    - packages/bus/src/types.ts
    - packages/bus/src/client.ts
    - packages/bus/src/client.test.ts
    - packages/bus/src/index.ts
  modified:
    - packages/kernel/src/kernel-bus-host.ts
    - packages/kernel/src/index.ts
    - packages/kernel/package.json
    - packages/types/src/kernel-bus.ts
    - packages/types/package.json

key-decisions:
  - "@vidorra/bus is a leaf package (zero workspace deps) — sdk and kernel both depend on it, no circular paths"
  - "packages/types/src/kernel-bus.ts kept as backward-compat re-export file (not deleted) — preserves any code importing from @vidorra/types"
  - "Added build script (tsc --noEmit) to @vidorra/kernel package.json to enable pnpm --filter @vidorra/kernel build verification"

patterns-established:
  - "Package extraction pattern: copy source to new package, update imports, replace original with re-export"
  - "Leaf package dependency tree: @vidorra/bus (no workspace deps) <- @vidorra/kernel, @vidorra/types, @vidorra/sdk"

requirements-completed: [SDK-01]

# Metrics
duration: 5min
completed: 2026-04-03
---

# Phase 4 Plan 01: @vidorra/bus Package Extraction Summary

**KernelBusClient extracted from @vidorra/kernel into standalone @vidorra/bus leaf package; all 13 bus tests pass; @vidorra/kernel and @vidorra/types updated to import from @vidorra/bus with backward compat preserved.**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-04-03T10:29:07Z
- **Completed:** 2026-04-03T10:33:46Z
- **Tasks:** 2 completed
- **Files modified:** 12

## Accomplishments

- Created `packages/bus/` with full package scaffold (package.json, tsconfig.json, vitest.config.ts) and migrated KernelBusClient + bus types
- All 13 KernelBusClient unit tests pass under `@vidorra/bus` (happy-dom environment, fake timers, concurrent RPC, push notifications)
- `@vidorra/kernel` updated: removed KernelBusClient export, updated KernelBusHost import from `@vidorra/types` to `@vidorra/bus`, all 39 kernel tests still pass
- `@vidorra/types/src/kernel-bus.ts` replaced with backward-compat re-export from `@vidorra/bus`
- Zero circular dependencies: `@vidorra/bus` has no workspace:* dependencies

## Task Commits

Each task was committed atomically:

1. **Task 1: Create @vidorra/bus package scaffold and migrate sources** - `d0b743a` (feat)
2. **Task 2: Update @vidorra/kernel and @vidorra/types to depend on @vidorra/bus** - `09ecfc3` (feat)

## Files Created/Modified

- `packages/bus/package.json` - New package manifest, no workspace deps, type: module
- `packages/bus/tsconfig.json` - Extends root tsconfig, rootDir: src
- `packages/bus/vitest.config.ts` - happy-dom environment, globals: true
- `packages/bus/src/types.ts` - KernelBusMessage, KernelBusResponse, KernelBusPush interfaces (migrated verbatim from @vidorra/types)
- `packages/bus/src/client.ts` - KernelBusClient class (migrated from @vidorra/kernel, import updated to './types')
- `packages/bus/src/client.test.ts` - 13 unit tests (migrated from @vidorra/kernel, import updated to './client')
- `packages/bus/src/index.ts` - Package entry re-exporting KernelBusClient + all 3 type interfaces
- `packages/kernel/src/kernel-bus-host.ts` - Line 2 import updated to '@vidorra/bus' (was '@vidorra/types')
- `packages/kernel/src/index.ts` - Removed `export { KernelBusClient } from './kernel-bus-client'` line
- `packages/kernel/package.json` - Added @vidorra/bus workspace:* dependency + build script (tsc --noEmit)
- `packages/types/src/kernel-bus.ts` - Replaced with backward-compat re-export from '@vidorra/bus'
- `packages/types/package.json` - Added @vidorra/bus workspace:* dependency

**Deleted:**
- `packages/kernel/src/kernel-bus-client.ts` (moved to @vidorra/bus)
- `packages/kernel/src/kernel-bus-client.test.ts` (moved to @vidorra/bus)

## Decisions Made

1. **Zero workspace deps in @vidorra/bus**: The package is a leaf node with only devDependencies (vitest, typescript, happy-dom). This ensures `@vidorra/sdk` can depend on `@vidorra/bus` without pulling in kernel/shell code.
2. **Backward compat re-export in @vidorra/types**: Rather than deleting `kernel-bus.ts`, it was converted to a re-export file. Any existing imports from `@vidorra/types` continue to work without changes.
3. **Build script added to @vidorra/kernel**: Added `"build": "tsc --noEmit"` to enable `pnpm --filter @vidorra/kernel build` as a type-checking verification step.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing critical functionality] Added build script to @vidorra/kernel**
- **Found during:** Task 2 verification
- **Issue:** Plan's acceptance criteria requires `pnpm --filter @vidorra/kernel build` to exit 0, but @vidorra/kernel had no build script
- **Fix:** Added `"build": "tsc --noEmit"` to packages/kernel/package.json scripts
- **Files modified:** packages/kernel/package.json
- **Verification:** `pnpm --filter @vidorra/kernel build` exits 0 with no TypeScript errors
- **Committed in:** `09ecfc3`

## Known Stubs

None — all exports are fully implemented. No placeholder data flows to UI.

## Self-Check: PASSED

- packages/bus/package.json: FOUND
- packages/bus/src/types.ts: FOUND
- packages/bus/src/client.ts: FOUND
- packages/bus/src/client.test.ts: FOUND
- packages/bus/src/index.ts: FOUND
- packages/bus/vitest.config.ts: FOUND
- packages/bus/tsconfig.json: FOUND
- packages/kernel/src/kernel-bus-client.ts: DELETED OK
- packages/kernel/src/kernel-bus-client.test.ts: DELETED OK
- Commit d0b743a: FOUND
- Commit 09ecfc3: FOUND
