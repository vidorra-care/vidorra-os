---
phase: 02-shell
plan: 03
subsystem: shell
tags: [dock, context-menu, framer-motion, zustand, magnification, testing]
dependency_graph:
  requires: [02-01]
  provides: [Dock, DockItem, ContextMenu, useWindowStore, useRaf]
  affects: [02-04, 02-05]
tech_stack:
  added: [framer-motion, zustand, @testing-library/react, @testing-library/jest-dom, happy-dom, vitest]
  patterns: [CSS Modules, Framer Motion spring magnification, useRaf RAF loop, Zustand store]
key_files:
  created:
    - packages/shell/src/components/ContextMenu/ContextMenu.tsx
    - packages/shell/src/components/ContextMenu/ContextMenu.module.css
    - packages/shell/src/components/Dock/Dock.tsx
    - packages/shell/src/components/Dock/DockItem.tsx
    - packages/shell/src/components/Dock/Dock.module.css
    - packages/shell/src/components/Dock/Dock.test.tsx
    - packages/shell/src/stores/useWindowStore.ts
    - packages/shell/src/hooks/useRaf.ts
    - packages/shell/src/test-setup.ts
    - packages/shell/vitest.config.ts
  modified:
    - packages/shell/package.json
    - packages/shell/tsconfig.json
    - pnpm-lock.yaml
decisions:
  - useRaf hook implemented locally (no @rooks/use-raf) per plan fallback spec
  - useWindowStore created here as plan 02-01 runs in parallel (dependency not yet merged)
  - happy-dom chosen over jsdom for test environment (lighter, faster)
  - vitest config added to shell package separate from root config for DOM environment
metrics:
  duration: 278s
  tasks_completed: 2
  files_created: 10
  files_modified: 3
  completed_date: 2026-04-01
---

# Phase 2 Plan 3: Dock + ContextMenu Summary

Implemented the Dock bottom-center glass launcher with Framer Motion spring magnification (stiffness:1300, damping:82), useRaf distance tracking, white 4px running indicator dot, launch bounce animation, and right-click contextual ContextMenu — plus the shared ContextMenu component (glass, backdrop-filter, 100ms easeOut) reusable by Desktop and Menubar.

## Tasks Completed

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 1 | Create shared ContextMenu component | 95de0f1 | ContextMenu.tsx, ContextMenu.module.css |
| 2 | Create Dock with magnification, running indicators, right-click menu, and behavioral tests | b2b1535 | Dock.tsx, DockItem.tsx, Dock.module.css, Dock.test.tsx, useWindowStore.ts, useRaf.ts |

## Decisions Made

1. **useRaf hook local implementation**: `@rooks/use-raf` was not installed; implemented a 15-line `useRaf.ts` hook using `requestAnimationFrame` per the plan's documented fallback.

2. **useWindowStore created in this plan**: Plan 02-01 runs in parallel (wave 1) and would normally provide this store. Since this worktree has no 02-01 artifacts, created the store from the interface spec in the plan context. This will need to be reconciled at merge time — the 02-01 version should take precedence.

3. **Shell-specific vitest config**: Root vitest config uses `environment: 'node'`. Added `packages/shell/vitest.config.ts` with `environment: 'happy-dom'` and `@vitejs/plugin-react` to enable React component testing. This matches the Wave 0 gap identified in RESEARCH.md.

4. **tsconfig types extended**: Added `"types": ["vitest/globals", "@testing-library/jest-dom"]` to `packages/shell/tsconfig.json` so test globals (`describe`, `it`, `expect`) type-check without needing `import` statements.

## Deviations from Plan

### Auto-added Missing Infrastructure

**1. [Rule 2 - Missing] Created useWindowStore.ts**
- **Found during:** Task 2 (DockItem requires useWindowStore for closeWindow/focusWindow)
- **Issue:** Plan 02-01 owns this file but runs in a parallel worktree; file did not exist in this worktree
- **Fix:** Created `packages/shell/src/stores/useWindowStore.ts` from the interface specification in plan context; matches the `WindowStoreWindow` interface and all actions specified in 02-03-PLAN.md
- **Files modified:** `packages/shell/src/stores/useWindowStore.ts`
- **Commit:** b2b1535

**2. [Rule 2 - Missing] Created shell vitest.config.ts and test-setup.ts**
- **Found during:** Task 2 (tests require DOM environment)
- **Issue:** Root `vitest.config.ts` uses `environment: 'node'`; React component tests need `happy-dom`
- **Fix:** Created `packages/shell/vitest.config.ts` with happy-dom + @vitejs/plugin-react; created `src/test-setup.ts` importing `@testing-library/jest-dom` matchers
- **Files modified:** `packages/shell/vitest.config.ts`, `packages/shell/src/test-setup.ts`
- **Commit:** b2b1535

**3. [Rule 2 - Missing] Created useRaf.ts hook**
- **Found during:** Task 2 (DockItem magnification uses useRaf)
- **Issue:** `@rooks/use-raf` not in package.json; plan documented this fallback
- **Fix:** Implemented 15-line `useRaf(callback, active)` using `requestAnimationFrame` with cleanup
- **Files modified:** `packages/shell/src/hooks/useRaf.ts`
- **Commit:** b2b1535

## Test Results

```
 ✓ src/components/Dock/Dock.test.tsx (4 tests) 17ms

 Test Files  1 passed (1)
      Tests  4 passed (4)
```

- SHELL-04: Running dot visible/hidden based on `isRunning` prop — PASS
- SHELL-05: Context menu shows 3 items when running, 1 item when not running — PASS

## Known Stubs

None — all data sources are wired:
- Dock loads apps from `appRegistry.getAllApps()` (real kernel call)
- Running state derived from `useWindowStore().windows` (real store)
- Context menu items use real store actions (`closeWindow`, `focusWindow`)

## Verification

- TypeScript: `npx tsc --noEmit --project packages/shell/tsconfig.json` — no errors
- Tests: `pnpm --filter @vidorra/shell test -- --run src/components/Dock/Dock.test.tsx` — 4/4 pass
- Dock uses Framer Motion `useMotionValue`/`useSpring`/`useTransform` for magnification (not CSS)
- ContextMenu is standalone shared component with its own CSS module
- Right-click items use exact Chinese copy: "打开", "在 Dock 中隐藏", "关闭"
- Running indicator uses white 4px dot with CSS `transition: opacity 150ms linear`
- `backdrop-filter` present in both Dock.module.css and ContextMenu.module.css

## Self-Check: PASSED
