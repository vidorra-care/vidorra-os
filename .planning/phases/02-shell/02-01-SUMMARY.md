---
phase: 02-shell
plan: 01
subsystem: shell
tags: [zustand, window-store, state-management, tdd, wallpapers]
dependency_graph:
  requires: [02-00]
  provides: [useWindowStore, wallpaper-assets, runtime-deps]
  affects: [02-02, 02-03, 02-04, 02-05]
tech_stack:
  added: [zustand@5.0.12, framer-motion@12.38.0, react-rnd@10.5.3, vitest@2.1.9, jsdom@25.0.1, "@testing-library/react@16.3.2", "@testing-library/jest-dom@6.9.1"]
  patterns: [zustand-create, direct-store-testing, tdd-red-green]
key_files:
  created:
    - packages/shell/src/stores/useWindowStore.ts
    - packages/shell/src/stores/useWindowStore.test.ts
    - packages/shell/vitest.config.ts
    - packages/shell/src/test-setup.ts
    - packages/shell/public/wallpapers/default.jpg
    - packages/shell/public/wallpapers/preset-1.jpg
    - packages/shell/public/wallpapers/preset-2.jpg
  modified:
    - packages/shell/package.json
    - pnpm-lock.yaml
decisions:
  - useWindowStore uses create() from zustand v5 with direct store testing (getState/setState) — no React rendering needed
  - Staircase offset counts only non-minimized windows to avoid compounding offsets from minimized windows
  - preMaximizeRect stored on WindowStoreWindow (extends WindowDescriptor) to avoid separate state map
  - toggleMaximize delegates to setWindowState for consistent behavior
metrics:
  duration: "~5 minutes"
  completed: "2026-04-01"
  tasks_completed: 2
  files_created: 7
  files_modified: 2
---

# Phase 2 Plan 01: Window Store Foundation Summary

Zustand window store with full window lifecycle (open/close/focus/minimize/maximize/restore/resize/move), staircase placement, z-index management, and preMaximizeRect save/restore using zustand v5 with direct store testing.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Install runtime dependencies and add wallpaper assets | 06ec505 | package.json, vitest.config.ts, test-setup.ts, public/wallpapers/* |
| 2 (RED) | Failing tests for useWindowStore | 51c4462 | src/stores/useWindowStore.test.ts |
| 2 (GREEN) | Implement useWindowStore Zustand store | 4d04ac3 | src/stores/useWindowStore.ts |

## Test Results

- 16 tests passing across 11 behavioral scenarios
- All SHELL-01 (multi-window + drag/resize state), SHELL-02 (state transitions), SHELL-03 (z-index focus management) requirements covered

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Set up vitest test infrastructure missing from Plan 02-00**
- **Found during:** Task 1 preparation
- **Issue:** Plan 02-00 (test infrastructure setup) was never executed. No vitest.config.ts, no test devDependencies, no test script in package.json, no src/test-setup.ts
- **Fix:** Installed vitest, jsdom, @testing-library/* devDeps; created vitest.config.ts with jsdom environment; created src/test-setup.ts with jest-dom matchers; added test scripts to package.json
- **Files modified:** packages/shell/package.json, packages/shell/vitest.config.ts, packages/shell/src/test-setup.ts
- **Commit:** 06ec505

## Known Stubs

None — wallpaper images are minimal valid JPEGs (placeholder until real assets are provided). The store is fully implemented and wired. No stubs blocking plan goals.

## Self-Check: PASSED
