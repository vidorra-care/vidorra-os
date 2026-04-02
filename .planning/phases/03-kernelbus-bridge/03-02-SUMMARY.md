---
phase: 03-kernelbus-bridge
plan: 02
subsystem: kernel
tags: [postmessage, rpc, trust-model, kernel-bus, dependency-injection, tdd]

# Dependency graph
requires:
  - phase: 03-01
    provides: KernelBusPush interface from @vidorra/types for push notification typing
  - phase: 02-shell
    provides: useWindowStore with closeWindow, setWindowState, setWindowRect, toggleMaximize actions
provides:
  - KernelBusHost class: Shell-side postMessage RPC dispatcher with trust model
  - kernelBusHost singleton: ready-to-use instance for shell mount integration
  - KernelBusHostCallbacks interface: DI contract for shell to supply window/theme operations
affects:
  - 03-03 (KernelBusClient must align to same protocol decisions established here)
  - 03-04 (Shell integration wires WindowFrame.tsx to call registerFrame/unregisterFrame)
  - 04-sdk (SDK client communicates with this host; RPC method names are canonical here)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Dependency injection via KernelBusHostCallbacks: kernel avoids direct shell import (no circular dep)"
    - "Two-stage trust: pendingFrames (registered) -> trustedFrames (trusted after app.ready)"
    - "app.ready as one-way signal: no response, promotes pending -> trusted"
    - "vi.hoisted() for vi.mock variables to avoid TDD hoisting errors in Vitest"

key-files:
  created:
    - packages/kernel/src/kernel-bus-host.ts
    - packages/kernel/src/kernel-bus-host.test.ts
  modified:
    - packages/kernel/src/index.ts

key-decisions:
  - "KernelBusHost uses DI (KernelBusHostCallbacks) not direct useWindowStore import — prevents circular kernel<->shell dependency"
  - "init(callbacks) replaces constructor injection — singleton created at module load, shell provides callbacks on startup"
  - "app.ready has no response — one-way trust signal (D-12 from CONTEXT.md)"
  - "Untrusted source messages are silently dropped — no error response (D-10 from CONTEXT.md)"
  - "Unknown methods return error with requestId preserved (D-11 from CONTEXT.md)"
  - "Theme push uses themeEngine.subscribe; getResolvedMode() called at push time (not ThemeMode raw value)"

patterns-established:
  - "KernelBusHost follows class+singleton pattern (same as AppRegistry, ThemeEngine)"
  - "Test pattern: vi.hoisted() for mock variables used in vi.mock factory functions"
  - "Dispatch via switch/case on method string; error caught and returned as { requestId, error }"

requirements-completed:
  - BUS-01
  - BUS-02
  - BUS-03

# Metrics
duration: 5min
completed: 2026-04-02
---

# Phase 3 Plan 02: KernelBusHost Implementation Summary

**KernelBusHost class with two-stage trust model (pending->trusted on app.ready), full 6-method RPC dispatch via dependency-injected callbacks, and theme-change push to all trusted iframes**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-04-02T06:45:45Z
- **Completed:** 2026-04-02T06:50:02Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- Implemented `KernelBusHost` with pendingFrames/trustedFrames two-stage trust model — only iframes that send `app.ready` are trusted
- All 6 RPC methods dispatched via `KernelBusHostCallbacks` DI interface: `window.setTitle`, `window.close`, `window.minimize`, `window.maximize`, `window.resize`, `theme.get`
- Theme push notifications sent to all trusted iframes on `themeEngine.subscribe` callback
- 16 unit tests cover trust model (4), RPC dispatch (9), and push notifications (2) — all passing
- Exported `KernelBusHost`, `kernelBusHost`, and `KernelBusHostCallbacks` from `@vidorra/kernel` index

## Task Commits

Each task was committed atomically:

1. **Task 1: Implement KernelBusHost class with full RPC dispatch** - `4bcdd7f` (feat)
2. **Task 2: Export KernelBusHost and kernelBusHost from kernel package index** - `9733d40` (feat)

**Plan metadata:** (docs commit to follow)

_Note: TDD task 1 had hoisting fix deviation (vi.hoisted) applied inline — test file and implementation committed together in GREEN commit_

## Files Created/Modified

- `packages/kernel/src/kernel-bus-host.ts` - KernelBusHost class, KernelBusHostCallbacks interface, kernelBusHost singleton
- `packages/kernel/src/kernel-bus-host.test.ts` - 16 unit tests covering trust model, all 6 RPC methods, push notifications
- `packages/kernel/src/index.ts` - Added exports for KernelBusHost, kernelBusHost, KernelBusHostCallbacks (KernelBusClient export by parallel agent preserved)

## Decisions Made

- **DI over direct import:** The plan's suggested implementation shows `import { useWindowStore }` from shell, but the plan also explicitly states this causes circular dependency and mandates the `KernelBusHostCallbacks` DI approach instead. DI approach implemented.
- **`init(callbacks)` signature:** Shell calls `kernelBusHost.init(callbacks)` on startup, providing all window/theme operations. Singleton created at module load but only operational after `init()`.
- **`getResolvedTheme` in callbacks:** Theme resolution (`light`/`dark`) is provided by the shell callback, not by re-importing themeEngine inside kernel (themeEngine still used internally for subscribe-only, not for getResolvedMode in dispatch path).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed vi.mock hoisting error for mockSubscribe variable**
- **Found during:** Task 1 (TDD GREEN - first test run)
- **Issue:** `vi.mock` factory is hoisted to top of file by Vitest, but `mockSubscribe` was declared with `const` below — `ReferenceError: Cannot access 'mockSubscribe' before initialization`
- **Fix:** Replaced `const mockSubscribe = vi.fn()` pattern with `vi.hoisted(() => { ... })` to ensure variables are initialized before mock factory executes
- **Files modified:** `packages/kernel/src/kernel-bus-host.test.ts`
- **Commit:** `4bcdd7f`

## Issues Encountered

None beyond the vi.hoisted deviation above.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- `KernelBusHost` is ready for shell integration (Plan 03-04: WindowFrame integration)
- `KernelBusHostCallbacks` interface defines the exact contract shell must implement
- Shell needs to: call `kernelBusHost.init(callbacks)` in `main.tsx`, wire `registerFrame`/`unregisterFrame` in `WindowFrame.tsx`
- No blockers for plan 03-03 (KernelBusClient) — runs in parallel

---
*Phase: 03-kernelbus-bridge*
*Completed: 2026-04-02*

## Self-Check: PASSED

- FOUND: packages/kernel/src/kernel-bus-host.ts
- FOUND: packages/kernel/src/kernel-bus-host.test.ts
- FOUND: .planning/phases/03-kernelbus-bridge/03-02-SUMMARY.md
- FOUND: commit 4bcdd7f (feat(03-02): implement KernelBusHost with full RPC dispatch and trust model)
- FOUND: commit 9733d40 (feat(03-02): export KernelBusHost, kernelBusHost, KernelBusHostCallbacks from kernel package index)
