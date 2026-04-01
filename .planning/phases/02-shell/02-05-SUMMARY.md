---
phase: 02-shell
plan: 05
status: awaiting-checkpoint
subsystem: shell
tags: [shell, integration, app-registry, welcome, built-in-apps]
dependency_graph:
  requires: [02-01, 02-02, 02-03, 02-04]
  provides: [shell-root-wiring, registerLocal, built-in-apps-seeding, welcome-first-launch]
  affects: [packages/shell, packages/kernel, registry]
tech_stack:
  added: [vitest/jsdom, @testing-library/react, zustand-stub]
  patterns: [useEffect-seed-pattern, localStorage-first-launch-gate]
key_files:
  created:
    - packages/shell/src/App.tsx
    - packages/shell/src/App.test.tsx
    - packages/shell/src/App.module.css
    - packages/shell/src/stores/useWindowStore.ts
    - packages/shell/src/components/Desktop/Desktop.tsx
    - packages/shell/src/components/Menubar/Menubar.tsx
    - packages/shell/src/components/WindowManager/WindowManager.tsx
    - packages/shell/src/components/Dock/Dock.tsx
    - packages/shell/public/apps/welcome/index.html
    - packages/shell/public/app-icons/app-store.svg
    - packages/shell/vitest.config.ts
    - packages/shell/src/test-setup.ts
  modified:
    - packages/kernel/src/app-registry.ts
    - packages/shell/package.json
    - packages/shell/tsconfig.json
    - registry/built-in-apps.json
decisions:
  - "Import path for registry JSON is ../../../registry (3 levels up from src/), not ../../registry as plan specified"
  - "Stub components created for Desktop/Menubar/WindowManager/Dock/useWindowStore since plans 02-01 to 02-04 not yet executed"
  - "Shell tsconfig updated: resolveJsonModule: true, removed rootDir constraint, added registry to include"
metrics:
  duration: "~30 min"
  completed_date: "2026-04-01T13:30:00Z"
  tasks_completed: 1
  tasks_total: 2
  files_created: 12
  files_modified: 4
---

# Phase 2 Plan 05: Shell Integration — Summary (Awaiting Checkpoint)

**One-liner:** App.tsx root wires Desktop+Menubar+WindowManager+Dock with first-launch Welcome logic and AppRegistry.registerLocal() for built-in app seeding.

## Status

**Task 1 complete — stopped at Task 2 (visual checkpoint).**

Task 2 requires visual verification of the running dev server. A human must verify the shell renders correctly before this plan is marked complete.

## Tasks

| Task | Status | Commit |
|------|--------|--------|
| Task 1: Add registerLocal, wire App.tsx, App.test.tsx, built-in apps, Welcome page | COMPLETE | 67b1567 |
| Task 2: Visual verification of complete shell | AWAITING CHECKPOINT | — |

## What Was Built (Task 1)

### AppRegistry.registerLocal()
Added to `packages/kernel/src/app-registry.ts`. Idempotent method that seeds built-in apps without going through the fetch-based `install()` flow. Uses `if (!this.apps.has(manifest.id))` guard to prevent overwriting user-installed versions.

### registry/built-in-apps.json
Populated with App Store manifest including `id: "app-store"`, icon path, defaultSize (800x600), minSize (400x300), and a Menubar entry.

### packages/shell/src/App.tsx
Root shell component that:
- Seeds built-in apps via `appRegistry.registerLocal()` on mount
- Opens Welcome window on first launch (when `vidorra:welcomed` absent in localStorage)
- Sets `vidorra:welcomed=1` after opening to prevent re-opening
- Renders: `<Desktop /> <Menubar /> <WindowManager /> <Dock />` in correct z-order

### App.test.tsx
Two behavioral tests that pass:
1. "opens Welcome window when localStorage vidorra:welcomed is not set" — verifies `openWindow` called once with `appId: 'welcome'`
2. "does NOT open Welcome window when localStorage vidorra:welcomed is already set" — verifies `openWindow` not called

### Stub Components
Since plans 02-01 through 02-04 have not been executed, minimal stub implementations were created to allow TypeScript compilation and tests to pass:
- `useWindowStore.ts` — zustand store implementing the full WindowStore interface
- `Desktop.tsx`, `Menubar.tsx`, `WindowManager.tsx`, `Dock.tsx` — minimal JSX stubs

### Test Infrastructure
- `packages/shell/vitest.config.ts` — jsdom environment + React plugin + jest-dom setup
- `packages/shell/src/test-setup.ts` — imports @testing-library/jest-dom
- `packages/shell/package.json` — updated with test scripts, zustand, @testing-library deps

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed incorrect JSON import path in App.tsx**
- **Found during:** Task 1, action step 6
- **Issue:** Plan specified `import builtInApps from '../../registry/built-in-apps.json'` but the correct relative path from `packages/shell/src/App.tsx` to repo root `registry/` is 3 levels up (`../../../registry/`), not 2
- **Fix:** Changed import to `import builtInApps from '../../../registry/built-in-apps.json'`
- **Files modified:** `packages/shell/src/App.tsx`
- **Commit:** 67b1567

**2. [Rule 3 - Blocking] Created stub components for missing dependencies**
- **Found during:** Task 1 — plans 02-01 through 02-04 not yet executed
- **Issue:** App.tsx imports Desktop, Menubar, WindowManager, Dock, useWindowStore — all of which are created in plans 02-01 to 02-04. Without these files, TypeScript compilation fails and tests cannot run.
- **Fix:** Created minimal stub implementations satisfying the interface contracts. The stubs are clearly marked with `// STUB — full implementation comes in plan 0X-0Y` comments.
- **Files created:** 5 stub files (useWindowStore.ts + 4 components)
- **Commit:** 67b1567

**3. [Rule 3 - Blocking] Updated shell package.json and tsconfig for test infrastructure**
- **Found during:** Task 1 — no test infrastructure existed in shell package
- **Issue:** Shell package had no test script, no vitest dependency, no testing libraries
- **Fix:** Updated package.json to add test scripts + all test deps; created vitest.config.ts and test-setup.ts matching the main repo's shell configuration
- **Files modified/created:** package.json, tsconfig.json, vitest.config.ts, test-setup.ts
- **Commit:** 67b1567

## Known Stubs

| File | Reason |
|------|--------|
| `packages/shell/src/stores/useWindowStore.ts` | Full implementation expected from plan 02-01 (zustand store with proper window lifecycle) |
| `packages/shell/src/components/Desktop/Desktop.tsx` | Full implementation expected from plan 02-04 (wallpaper, context menu) |
| `packages/shell/src/components/Menubar/Menubar.tsx` | Full implementation expected from plan 02-04 (app name, clock, Apple menu) |
| `packages/shell/src/components/WindowManager/WindowManager.tsx` | Full implementation expected from plan 02-02 (react-rnd, traffic lights) |
| `packages/shell/src/components/Dock/Dock.tsx` | Full implementation expected from plan 02-03 (magnification, running indicators) |

These stubs are intentional scaffolding — they allow App.tsx and its tests to be completed now, with the full component implementations to follow in plans 02-01 through 02-04.

## Verification Results

- TypeScript compilation: `npx tsc --noEmit --project packages/shell/tsconfig.json` — **0 errors**
- App.test.tsx: `pnpm --filter @vidorra/shell test -- --run src/App.test.tsx` — **2/2 tests pass**
- Kernel tests: `npx vitest run` (kernel package) — **23/23 tests pass**

## Self-Check: PASSED

Files exist:
- packages/kernel/src/app-registry.ts — FOUND (contains registerLocal)
- packages/shell/src/App.tsx — FOUND (contains vidorra:welcomed, openWindow, Desktop/Menubar/WindowManager/Dock imports)
- packages/shell/src/App.test.tsx — FOUND
- packages/shell/src/App.module.css — FOUND (contains .shell class)
- packages/shell/public/apps/welcome/index.html — FOUND (contains "Welcome to Vidorra OS")
- registry/built-in-apps.json — FOUND (contains "app-store", "defaultSize")

Commit exists: 67b1567 — FOUND
