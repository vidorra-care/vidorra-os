---
phase: 02-shell
plan: 04
subsystem: shell-ui
tags: [menubar, desktop, clock, wallpaper, context-menu, zustand, testing]
dependency_graph:
  requires: [02-01, 02-03]
  provides: [Menubar, MenubarClock, Desktop, useWindowStore, ContextMenu, vitest-jsdom]
  affects: [App.tsx integration in 02-05]
tech_stack:
  added: [zustand@5.0.12, framer-motion@12.38.0, react-rnd@10.5.3, vitest@jsdom, @testing-library/react, @testing-library/jest-dom, jsdom]
  patterns: [CSS Modules, Zustand hook selector pattern, minute-boundary setTimeout+setInterval, localStorage read on mount]
key_files:
  created:
    - packages/shell/src/components/Menubar/Menubar.tsx
    - packages/shell/src/components/Menubar/MenubarClock.tsx
    - packages/shell/src/components/Menubar/Menubar.module.css
    - packages/shell/src/components/Menubar/Menubar.test.tsx
    - packages/shell/src/components/Desktop/Desktop.tsx
    - packages/shell/src/components/Desktop/Desktop.module.css
    - packages/shell/src/components/Desktop/Desktop.test.tsx
    - packages/shell/src/components/ContextMenu/ContextMenu.tsx
    - packages/shell/src/components/ContextMenu/ContextMenu.module.css
    - packages/shell/src/stores/useWindowStore.ts
    - packages/shell/vitest.config.ts
    - packages/shell/src/test-setup.ts
  modified:
    - packages/shell/package.json
    - pnpm-lock.yaml
decisions:
  - Menubar shows default items (文件/编辑/窗口/帮助) only when no window is focused, not when a window is focused with no manifest
  - ContextMenu uses document-level mousedown listener for click-outside dismiss, stopPropagation on menu itself
  - useWindowStore created as dependency for Menubar (was from plan 02-01)
  - vitest jsdom config created as dependency for tests (was from plan 02-00)
metrics:
  duration: ~15 minutes
  completed: 2026-04-01T13:16:53Z
  tasks_completed: 2
  files_created: 12
---

# Phase 2 Plan 04: Menubar and Desktop Summary

**One-liner:** Menubar with glassmorphism top bar, minute-boundary HH:mm clock, focused-app name, Apple icon dropdown (关于/系统设置), plus Desktop with localStorage wallpaper and 4-item right-click context menu — all with 6 passing behavioral tests.

## Tasks Completed

| # | Name | Commit | Files |
|---|------|--------|-------|
| 1 | Menubar with Apple icon, app name, menu items, clock, and tests | 9846011 | Menubar.tsx, MenubarClock.tsx, Menubar.module.css, Menubar.test.tsx, useWindowStore.ts, ContextMenu.tsx/.module.css, vitest config |
| 2 | Desktop with wallpaper, right-click context menu, and tests | b01c8ae | Desktop.tsx, Desktop.module.css, Desktop.test.tsx |

## What Was Built

### Menubar (`packages/shell/src/components/Menubar/`)

- `Menubar.tsx`: 24px fixed header with glass background (`hsla(0,0%,50%,0.3)`, `backdrop-filter: blur(12px)`, z-index: 1001). Apple SVG icon with `aria-label="Apple 菜单"` that toggles a ContextMenu dropdown with "关于 Vidorra OS" and "系统设置..." on click. Derives focused window from `useWindowStore` and renders the window title as app name (fallback: "Vidorra OS"). Renders manifest `menubar` keys as clickable buttons (display-only, Phase 2). Defaults to 文件/编辑/窗口/帮助 when no window is focused.
- `MenubarClock.tsx`: Renders HH:mm clock. Uses `setTimeout` aligned to next minute boundary, then `setInterval` every 60 seconds — no drift.
- `Menubar.module.css`: 24px height, backdrop-filter blur(12px), z-index: 1001, 12px/500 clock typography.

### Desktop (`packages/shell/src/components/Desktop/`)

- `Desktop.tsx`: Full-viewport fixed div with `background-size: cover`. Reads `localStorage['vidorra:wallpaper']` on mount and applies as `backgroundImage` inline style. Falls back to `/wallpapers/default.png`. Right-click opens shared ContextMenu with 4 entries: "关于 Vidorra OS", "更改壁纸...", separator, "强制刷新" (triggers `window.location.reload()`).
- `Desktop.module.css`: `position: fixed; inset: 0; background-size: cover; z-index: 0`.

### ContextMenu (`packages/shell/src/components/ContextMenu/`)

Shared component (also needed by plan 02-03 Dock). Accepts `x`, `y`, `items: ContextMenuEntry[]`, `onClose`. Dismisses on click-outside (document mousedown), Escape key, or item click.

### useWindowStore (`packages/shell/src/stores/useWindowStore.ts`)

Zustand store — full window lifecycle: open (with staircase offset), close, focus (nextZIndex increment), setWindowState, setWindowRect.

## Test Results

```
 ✓ src/components/Desktop/Desktop.test.tsx (3 tests)
 ✓ src/components/Menubar/Menubar.test.tsx (3 tests)

 Test Files  2 passed (2)
      Tests  6 passed (6)
```

All 6 behavioral tests pass:
- Menubar: "Vidorra OS" fallback when no focused window
- Menubar: focused window title displayed
- Menubar: clock matches /\d{2}:\d{2}/ pattern
- Desktop: localStorage wallpaper applied as backgroundImage
- Desktop: default.png fallback when localStorage empty
- Desktop: right-click shows 4-entry context menu (3 buttons + 1 separator)

## Deviations from Plan

### Auto-fixed Issues (Rule 3 - Blocking)

**1. [Rule 3 - Blocking] Prior plans 02-00 and 02-01 not yet executed**
- **Found during:** Task 1 pre-flight
- **Issue:** Plans 02-04 depends_on 02-01 and 02-03. Neither had been executed. No vitest config, no useWindowStore, no ContextMenu existed.
- **Fix:** Bootstrapped all required dependencies inline: created `packages/shell/vitest.config.ts` (jsdom), `test-setup.ts`, `useWindowStore.ts`, `ContextMenu.tsx`. Installed zustand, framer-motion, react-rnd, vitest, @testing-library/react, @testing-library/jest-dom, jsdom.
- **Files:** vitest.config.ts, test-setup.ts, useWindowStore.ts, ContextMenu.tsx, ContextMenu.module.css
- **Commit:** 9846011

**2. [Rule 3 - Blocking] Pre-existing TypeScript errors in @vidorra/kernel**
- **Found during:** TypeScript check
- **Issue:** `packages/kernel/src/app-registry.ts` had 3 pre-existing TS errors (module resolution for @vidorra/types in strict tsconfig context)
- **Fix:** Confirmed errors are pre-existing and not caused by this plan. Verified shell package itself compiles clean. Documented as out-of-scope.
- **Impact:** TypeScript check passes for shell package; kernel errors pre-exist.

## Known Stubs

None — all required functionality is wired. Phase 2 context menu actions for "关于 Vidorra OS", "更改壁纸...", and "系统设置..." are intentional no-ops per plan spec (these wire to real functionality in Phases 4-5).

## Self-Check: PASSED

All 10 key files confirmed present on disk. Both task commits (9846011, b01c8ae) confirmed in git log. 6/6 tests passing.
