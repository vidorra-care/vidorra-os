---
phase: 03-kernelbus-bridge
plan: 04
subsystem: shell
tags: [postmessage, rpc, kernel-bus, iframe, dependency-injection, react, windowframe]

# Dependency graph
requires:
  - phase: 03-02
    provides: KernelBusHost class with registerFrame/unregisterFrame, kernelBusHost singleton, KernelBusHostCallbacks DI interface
  - phase: 02-shell
    provides: useWindowStore with closeWindow, setWindowState, setWindowRect, toggleMaximize actions; WindowFrame.tsx with iframe element
affects:
  - 03-03 (KernelBusClient in SDK must align to trust model established here — app.ready promotes pending->trusted)
  - 04-sdk (SDK createApp uses KernelBusClient; shell-side trust registration is now wired)

provides:
  - WindowFrame registers its iframe contentWindow with kernelBusHost on mount; unregisters on unmount
  - Shell initializes KernelBusHost at startup with all 7 DI callbacks wired to useWindowStore and themeEngine
  - Full postMessage RPC pipeline now operational end-to-end (app.ready -> trusted -> dispatch)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "kernelBusHost.init(callbacks) called in main.tsx before createRoot().render() — ensures trust model is active before any iframe mounts"
    - "WindowFrame useEffect with [win.id] dep array: registerFrame on mount, unregisterFrame in cleanup"
    - "useWindowStore.setState for setWindowTitle (no existing action) vs. useWindowStore.getState().action() for others"
    - "themeEngine.getResolvedMode() called inside getResolvedTheme callback — not re-imported separately inside kernel"

key-files:
  created: []
  modified:
    - packages/shell/src/components/WindowFrame/WindowFrame.tsx
    - packages/shell/src/main.tsx

key-decisions:
  - "kernelBusHost.init() placed before createRoot().render() in main.tsx — trust model active before any iframe can mount (D-01)"
  - "iframeRef useEffect uses [win.id] dependency — reruns if window ID changes, always unregisters correct windowId"
  - "setWindowTitle uses useWindowStore.setState (no action) while all other callbacks use useWindowStore.getState().action()"

patterns-established:
  - "Shell-side DI pattern: main.tsx provides all window/theme callbacks to kernel via init(); kernel never imports shell stores"
  - "WindowFrame lifecycle: mount registers contentWindow as pending; unregisterFrame clears both pending and trusted maps"

requirements-completed:
  - BUS-01
  - BUS-02

# Metrics
duration: 4min
completed: 2026-04-02
---

# Phase 3 Plan 04: Shell KernelBus Integration Summary

**Shell wired to KernelBusHost: WindowFrame registers/unregisters iframe contentWindows, main.tsx initializes all 7 DI callbacks before render — postMessage RPC pipeline is now end-to-end operational**

## Performance

- **Duration:** ~4 min
- **Started:** 2026-04-02T06:52:00Z
- **Completed:** 2026-04-02T06:56:11Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- `WindowFrame.tsx` imports `kernelBusHost`, adds `iframeRef = useRef<HTMLIFrameElement>(null)`, attaches `ref={iframeRef}` to iframe, and registers/unregisters with `kernelBusHost` via `useEffect([win.id])`
- `main.tsx` calls `kernelBusHost.init(callbacks)` before `createRoot().render()`, providing all 7 callbacks mapped to `useWindowStore` actions and `themeEngine.getResolvedMode()`
- Shell builds without TypeScript errors (`pnpm --filter @vidorra/shell build` exits 0)

## Task Commits

Each task was committed atomically:

1. **Task 1: Add iframeRef and register/unregister lifecycle to WindowFrame** - `e66c465` (feat)
2. **Task 2: Initialize kernelBusHost at shell startup with store callbacks** - `5594f21` (feat)

**Plan metadata:** (docs commit to follow)

## Files Created/Modified

- `packages/shell/src/components/WindowFrame/WindowFrame.tsx` — Added `kernelBusHost` import, `iframeRef`, registration `useEffect`, `ref={iframeRef}` on iframe
- `packages/shell/src/main.tsx` — Added `kernelBusHost` import, `useWindowStore` import, full `kernelBusHost.init(callbacks)` call with all 7 DI callbacks

## Decisions Made

- **Init placement:** `kernelBusHost.init()` placed after theme initialization but before `createRoot().render()` — ensures the trust model message handler is active before any iframe can mount (D-01 requirement).
- **setWindowTitle approach:** No `setWindowTitle` action exists on `useWindowStore`, so `useWindowStore.setState((s) => ({ windows: s.windows.map(...) }))` used directly (consistent with Zustand patterns).
- **useEffect dependency:** `[win.id]` dependency array ensures the effect re-runs if window ID changes and always unregisters the correct ID in cleanup.

## Deviations from Plan

None - plan executed exactly as written. Both tasks implemented per specification with no issues. TypeScript compiled clean on first attempt.

## Issues Encountered

None.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Full KernelBus pipeline is now wired: `kernelBusHost.init()` active in shell, `WindowFrame` registers/unregisters iframes, `KernelBusHost` handles postMessage RPC dispatch
- Plan 03-03 (KernelBusClient SDK side) runs in parallel and is ready to be integrated
- Phase 4 (SDK `createApp`) can now wire `KernelBusClient` to `postMessage` knowing the shell trust model is operational
- No blockers

---
*Phase: 03-kernelbus-bridge*
*Completed: 2026-04-02*

## Self-Check: PASSED

- FOUND: packages/shell/src/components/WindowFrame/WindowFrame.tsx (modified with iframeRef, registerFrame, unregisterFrame)
- FOUND: packages/shell/src/main.tsx (modified with kernelBusHost.init and all 7 callbacks)
- FOUND: .planning/phases/03-kernelbus-bridge/03-04-SUMMARY.md (this file)
- FOUND: commit e66c465 (feat(03-04): add iframeRef and register/unregister lifecycle to WindowFrame)
- FOUND: commit 5594f21 (feat(03-04): initialize kernelBusHost at shell startup with store callbacks)
- BUILD: pnpm --filter @vidorra/shell build exits 0 (TypeScript clean, 493 modules transformed)
