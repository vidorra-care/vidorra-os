---
phase: 03-kernelbus-bridge
plan: 03
subsystem: kernel
tags: [typescript, kernel-bus, postmessage, rpc, promise, timeout, tdd]

# Dependency graph
requires:
  - phase: 03-kernelbus-bridge/03-01
    provides: KernelBusMessage, KernelBusResponse, KernelBusPush type definitions in @vidorra/types
provides:
  - KernelBusClient class for SDK to instantiate (app iframe-side postMessage RPC client)
  - send(method, params) returning Promise resolving/rejecting on shell response
  - sendReady() posting app.ready signal without requestId
  - onPush(handler) subscription for server-push notifications
  - 5-second timeout rejection with descriptive error message
  - KernelBusClient exported from @vidorra/kernel package index
affects:
  - 03-04 (SDK wraps KernelBusClient in user-friendly app.window.* / app.theme.* APIs)
  - 04-sdk (Phase 4 SDK instantiates KernelBusClient and exposes high-level APIs)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Pending request Map pattern: Map<requestId, {resolve, reject, timer}> for concurrent Promise tracking"
    - "Push notification routing: type: 'push' discriminant routes to pushHandlers Set, bypasses RPC resolution"
    - "Arrow method pattern for event handlers: handleMessage = (event) => {} preserves 'this' without bind"
    - "TDD with vi.useFakeTimers for testing setTimeout behavior without actual waiting"

key-files:
  created:
    - packages/kernel/src/kernel-bus-client.ts
    - packages/kernel/src/kernel-bus-client.test.ts
  modified:
    - packages/kernel/src/index.ts

key-decisions:
  - "KernelBusClient is a class (not singleton) — Phase 4 SDK instantiates it per app context"
  - "requestId generated via crypto.randomUUID() with counter fallback for test environments"
  - "push notifications distinguished from RPC responses by type: 'push' literal (not requestId absence)"
  - "destroy() cancels all pending timers and rejects in-flight requests with 'KernelBusClient destroyed'"
  - "onPush returns unsubscribe function (pushHandlers.delete) — consistent with themeEngine.subscribe pattern"

patterns-established:
  - "Promise-based RPC: each send() creates unique requestId, stores callbacks in Map, clears on response/timeout"
  - "Timeout cleanup: clearTimeout called on successful response so no spurious rejection fires post-resolution"

requirements-completed:
  - BUS-03
  - BUS-04

# Metrics
duration: 3min
completed: 2026-04-02
---

# Phase 3 Plan 03: KernelBusClient Summary

**KernelBusClient class implementing app-iframe-side postMessage RPC with Promise-based send(), 5s timeout, concurrent request tracking via pending Map, and push notification subscription**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-04-02T06:45:56Z
- **Completed:** 2026-04-02T06:49:14Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- Implemented `KernelBusClient` with `send(method, params)` returning a Promise that resolves with result or rejects with Error
- 5-second timeout rejects with `Error('KernelBus timeout: <method>')` and cleans up pending Map entry
- `sendReady()` posts `{ method: 'app.ready' }` to parent window without requestId
- Concurrent requests each track independently via `pending = new Map<requestId, {resolve, reject, timer}>`
- Push notification routing via `onPush()` with unsubscribe support; push messages bypass RPC resolution
- 14 unit tests covering all behaviors; all 52 kernel package tests pass
- `KernelBusClient` exported from `@vidorra/kernel` index

## Task Commits

Each task was committed atomically:

1. **Task 1: Implement KernelBusClient with Promise-based RPC and timeout** - `1667769` (feat)
2. **Task 2: Export KernelBusClient from kernel package index** - `270980a` (feat)

**Plan metadata:** (to be committed with docs commit)

_Note: TDD task has combined test+implementation commit (RED confirmed by import error, GREEN by passing 13 tests)_

## Files Created/Modified

- `packages/kernel/src/kernel-bus-client.ts` - KernelBusClient class: send(), sendReady(), onPush(), destroy(), handleMessage
- `packages/kernel/src/kernel-bus-client.test.ts` - 14 unit tests: core RPC, timeout, concurrent requests, push notifications
- `packages/kernel/src/index.ts` - Added `export { KernelBusClient } from './kernel-bus-client'`

## Decisions Made

- `KernelBusClient` is a class, not a singleton — the SDK will instantiate it per app context (one client per iframe)
- `requestId` uses `crypto.randomUUID()` with a counter fallback (`req-N`) for environments where crypto is unavailable
- Push notifications are distinguished from RPC responses by checking `type === 'push'` first before checking `requestId`
- `destroy()` rejects all pending promises to prevent memory leaks when the iframe is torn down

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- `KernelBusClient` is ready for Phase 4 SDK to instantiate and wrap in `app.window.*` / `app.theme.*` APIs
- All three types (`KernelBusMessage`, `KernelBusResponse`, `KernelBusPush`) available from `@vidorra/types`
- `KernelBusClient` and `KernelBusHost` (from plan 02) complete the full bridge contract
- No blockers or concerns

---
*Phase: 03-kernelbus-bridge*
*Completed: 2026-04-02*

## Self-Check: PASSED

- FOUND: packages/kernel/src/kernel-bus-client.ts
- FOUND: packages/kernel/src/kernel-bus-client.test.ts
- FOUND: .planning/phases/03-kernelbus-bridge/03-03-SUMMARY.md
- FOUND: commit 1667769 (feat(03-03): implement KernelBusClient with Promise-based RPC and timeout)
- FOUND: commit 270980a (feat(03-03): export KernelBusClient from @vidorra/kernel index)
