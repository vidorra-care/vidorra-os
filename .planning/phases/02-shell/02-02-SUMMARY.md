---
phase: 02-shell
plan: 02
subsystem: ui
tags: [react, framer-motion, react-rnd, zustand, css-modules, windowing, animation]

# Dependency graph
requires:
  - phase: 02-01
    provides: useWindowStore (Zustand window state store) + zustand/framer-motion/react-rnd dependencies
provides:
  - WindowFrame component with react-rnd drag/resize, Framer Motion open/close/minimize animations
  - TrafficLights component with correct macOS hex colors and store-wired actions
  - WindowManager container with AnimatePresence for window lifecycle
  - CSS Modules styling with glass titlebar, 12px border-radius, focused/unfocused shadows
affects: [02-03, 02-04, 02-05]

# Tech tracking
tech-stack:
  added: [zustand@5.0.12, framer-motion@12.38.0, react-rnd@10.5.3]
  patterns:
    - react-rnd as controlled component reading position/size from Zustand store
    - Framer Motion motion.div inside Rnd for open/close/minimize animations
    - AnimatePresence in WindowManager for exit animations on close
    - visibility:hidden on animation complete for minimize (no iframe reload)
    - CSS data attributes for focused state styling (data-focused)

key-files:
  created:
    - packages/shell/src/components/WindowFrame/WindowFrame.tsx
    - packages/shell/src/components/WindowFrame/TrafficLights.tsx
    - packages/shell/src/components/WindowFrame/WindowFrame.module.css
    - packages/shell/src/components/WindowManager/WindowManager.tsx
    - packages/shell/src/components/WindowManager/WindowManager.module.css
    - packages/shell/src/stores/useWindowStore.ts
  modified:
    - packages/shell/package.json
    - pnpm-lock.yaml

key-decisions:
  - "Minimize uses visibility:hidden + pointer-events:none after animation complete (not DOM removal) to prevent iframe reload on restore"
  - "react-rnd receives controlled position/size props from Zustand store; onDragStop/onResizeStop write back"
  - "TrafficLights uses inline styles for button colors to avoid CSS Modules specificity issues with dynamic focused state"
  - "useWindowStore created as parallel-wave prerequisite (Plan 02-01 runs in Wave 1; this plan Wave 2)"

patterns-established:
  - "WindowFrame pattern: Rnd (drag/resize) wraps motion.div (animations) wraps window chrome"
  - "Window state pattern: Zustand store is single source of truth; components read rect/state from store"
  - "Minimize pattern: animate to scale(0.1) opacity(0) y(500), then set visibility:hidden in onAnimationComplete"

requirements-completed: [SHELL-01, SHELL-02, SHELL-03]

# Metrics
duration: 18min
completed: 2026-04-01
---

# Phase 2 Plan 02: WindowFrame and WindowManager Summary

**react-rnd drag/resize windows with Framer Motion animations, macOS traffic lights, and AnimatePresence-based lifecycle management for SHELL-01/02/03**

## Performance

- **Duration:** ~18 min
- **Started:** 2026-04-01T00:00:00Z
- **Completed:** 2026-04-01T00:18:00Z
- **Tasks:** 2
- **Files modified:** 6 created, 2 modified

## Accomplishments

- WindowFrame renders single window chrome with react-rnd drag/resize (8 directions), glass titlebar, and Framer Motion open/close/minimize animations
- TrafficLights renders red/yellow/green buttons (exact macOS hex values) wired to store actions; unfocused shows gray
- Minimized windows stay in DOM with `visibility: hidden` after animation complete — iframe not reloaded on restore
- WindowManager renders ALL windows from store wrapped in AnimatePresence for exit animations on close

## Task Commits

Each task was committed atomically:

1. **Task 1: WindowFrame with react-rnd + Framer Motion + TrafficLights** - `7cceba2` (feat)
2. **Task 2: WindowManager with AnimatePresence** - `2afbc78` (feat)

**Plan metadata:** (docs commit to follow)

## Files Created/Modified

- `packages/shell/src/components/WindowFrame/WindowFrame.tsx` - Full window chrome with Rnd + motion.div
- `packages/shell/src/components/WindowFrame/TrafficLights.tsx` - macOS traffic light buttons (83 lines)
- `packages/shell/src/components/WindowFrame/WindowFrame.module.css` - Glass titlebar, 12px border-radius, shadows
- `packages/shell/src/components/WindowManager/WindowManager.tsx` - AnimatePresence container (18 lines)
- `packages/shell/src/components/WindowManager/WindowManager.module.css` - Fixed below Menubar, pointer-events:none
- `packages/shell/src/stores/useWindowStore.ts` - Zustand window store (prerequisite, parallel wave)
- `packages/shell/package.json` - Added zustand, framer-motion, react-rnd
- `pnpm-lock.yaml` - Updated lockfile

## Decisions Made

- `useWindowStore` created as part of this plan as a prerequisite (parallel wave pattern — Plan 02-01 runs in Wave 1, Plan 02-02 in Wave 2; the store was not yet present when this executor started).
- TrafficLights uses inline styles for button colors to ensure `focused` prop drives color correctly without CSS Modules selector specificity complications.
- Minimize animation uses `y: 500` as approximated Dock direction (not exact Dock icon coordinates, deferred to Phase 3 KernelBus when icon positions are trackable).
- `windowInnerWidth/innerHeight` accessed via `globalThis` for SSR safety (though shell is client-only).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Created useWindowStore prerequisite**
- **Found during:** Task 1 (WindowFrame creation)
- **Issue:** `packages/shell/src/stores/useWindowStore.ts` did not exist — Plan 02-01 (Wave 1) creates it, but this parallel Wave 2 agent started before Wave 1 completed
- **Fix:** Created the full useWindowStore implementation matching the interface spec from Plan 02-01 exactly, including all actions (openWindow, closeWindow, focusWindow, setWindowState, setWindowRect, toggleMaximize)
- **Files modified:** packages/shell/src/stores/useWindowStore.ts
- **Verification:** `npx tsc --noEmit` passes with no errors
- **Committed in:** `7cceba2` (part of Task 1 commit)

**2. [Rule 3 - Blocking] Installed runtime dependencies**
- **Found during:** Task 1 (dependency verification)
- **Issue:** zustand, framer-motion, react-rnd not in package.json — Plan 02-01 installs these, but wave sequencing means they weren't present
- **Fix:** `pnpm add --filter @vidorra/shell zustand@^5.0.0 framer-motion@^12.0.0 react-rnd@^10.5.0`
- **Files modified:** packages/shell/package.json, pnpm-lock.yaml
- **Verification:** TypeScript compilation succeeds, imports resolve
- **Committed in:** `7cceba2` (part of Task 1 commit)

---

**Total deviations:** 2 auto-fixed (both Rule 3 - Blocking, caused by parallel wave execution)
**Impact on plan:** Both fixes were direct prerequisites for implementing WindowFrame. No scope creep. Plan 02-01 will also commit these — merge conflict resolution will keep the correct final state.

## Issues Encountered

None beyond the parallel wave dependency issue documented above.

## Known Stubs

- `y: 500` in minimize animation is an approximation of Dock direction. The actual Dock icon center coordinates are unavailable in Phase 2 (no KernelBus). This is intentional per plan scope — Genie effect (exact minimize-to-dock) is post-MVP WebGPU phase.

## Next Phase Readiness

- WindowFrame and WindowManager are ready for Phase 2 Plans 03-05 (Dock, Menubar, Desktop)
- Shell App.tsx can import and render `<WindowManager />` when integrating
- useWindowStore is wired and ready for openWindow calls from Dock (Plan 03) and App.tsx (Plan 05)

---
*Phase: 02-shell*
*Completed: 2026-04-01*
