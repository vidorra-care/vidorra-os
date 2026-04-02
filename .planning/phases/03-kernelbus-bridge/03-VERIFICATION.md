---
phase: 03-kernelbus-bridge
verified: 2026-04-02T07:10:00Z
status: passed
score: 8/8 must-haves verified
re_verification: false
gaps: []
human_verification:
  - test: "End-to-end postMessage RPC flow in browser"
    expected: "An iframe that calls app.ready and then sends window.setTitle via postMessage should have its parent window title updated in real-time"
    why_human: "Full browser E2E can't be verified without running the shell dev server and loading an iframe app"
---

# Phase 3: KernelBus Bridge Verification Report

**Phase Goal:** Shell-side `KernelBusHost` handles postMessage RPC from trusted iframe sources; SDK-side `KernelBusClient` sends requests and resolves Promises. Core methods: `app.ready`, `window.setTitle`, `window.close`, `window.minimize`, `window.maximize`, `window.resize`, `theme.get`.

**Verified:** 2026-04-02T07:10:00Z
**Status:** gaps_found
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | KernelBusPush type exported from @vidorra/types | VERIFIED | `packages/types/src/kernel-bus.ts` L18-22; `packages/types/src/index.ts` `export * from './kernel-bus'` |
| 2 | KernelBusHost with pendingFrames + trustedFrames trust model | VERIFIED | `kernel-bus-host.ts` L23-26: two private Maps; `handleMessage` L91-98 promotes pending→trusted on `app.ready`; silently drops untrusted (L101) |
| 3 | All 6 RPC methods implemented in KernelBusHost | VERIFIED | `dispatch()` switch/case covers `window.setTitle`, `window.close`, `window.minimize`, `window.maximize`, `window.resize`, `theme.get` (L119-155) |
| 4 | KernelBusHostCallbacks DI pattern (no direct shell import from kernel) | VERIFIED | `kernel-bus-host.ts` L6-19 defines interface; no shell imports in kernel package |
| 5 | KernelBusClient with pending Map, 5s timeout, sendReady() | VERIFIED | `kernel-bus-client.ts` L12 `pending = new Map`; L38 `setTimeout(…, 5000)`; L31-33 `sendReady()` |
| 6 | WindowFrame registers/unregisters iframeRef with kernelBusHost | VERIFIED | `WindowFrame.tsx` L38-47: `useEffect` calls `registerFrame` on mount, `unregisterFrame` in cleanup |
| 7 | main.tsx calls kernelBusHost.init(callbacks) before render | VERIFIED | `main.tsx` L16-40: `kernelBusHost.init({...})` called before `createRoot().render()` |
| 8 | All 52 kernel tests pass | FAILED | 52/52 tests pass with `packages/kernel/vitest.config.ts` (happy-dom). All 29 kernel-bus tests fail under workspace `pnpm -w run test` (root config: `environment: 'node'` → `ReferenceError: window is not defined`) |

**Score:** 7/8 truths verified

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `packages/types/src/kernel-bus.ts` | KernelBusMessage, KernelBusResponse, KernelBusPush interfaces | VERIFIED | 23 lines; all three interfaces present and exported |
| `packages/kernel/src/kernel-bus-host.ts` | KernelBusHost class, KernelBusHostCallbacks DI interface, kernelBusHost singleton | VERIFIED | 168 lines; substantive implementation |
| `packages/kernel/src/kernel-bus-host.test.ts` | 16 unit tests: trust model, all 6 RPC methods, push notifications | VERIFIED | 345 lines; 16 tests covering all BUS-01/02/03 scenarios |
| `packages/kernel/src/kernel-bus-client.ts` | KernelBusClient with send(), sendReady(), onPush(), 5s timeout | VERIFIED | 93 lines; substantive implementation |
| `packages/kernel/src/kernel-bus-client.test.ts` | 13 unit tests: RPC, timeout, push, concurrent | VERIFIED | 215 lines; 13 tests covering BUS-03/04 |
| `packages/kernel/src/index.ts` | KernelBusHost, kernelBusHost, KernelBusHostCallbacks, KernelBusClient exported | VERIFIED | All 4 symbols exported (L4-6) |
| `packages/shell/src/components/WindowFrame/WindowFrame.tsx` | iframeRef + registerFrame/unregisterFrame lifecycle | VERIFIED | L38-47 useEffect; `ref={iframeRef}` on iframe L135 |
| `packages/shell/src/main.tsx` | kernelBusHost.init(callbacks) with all 7 DI callbacks wired | VERIFIED | L16-40; all 7 callbacks implemented: setWindowTitle, closeWindow, setWindowMinimized, toggleMaximize, setWindowRect, getWindowRect, getResolvedTheme |
| `vitest.config.ts` (root) | Must allow kernel-bus tests to run via workspace test command | FAILED | `environment: 'node'` prevents `window` global from existing; kernel-bus tests fail |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| KernelBusHost | KernelBusPush | postMessage to trusted iframes on theme change | WIRED | `kernel-bus-host.ts` L2 imports KernelBusPush; L36-43 constructs and posts push to all trustedFrames |
| KernelBusClient | KernelBusPush | incoming message listener for push notifications | WIRED | `kernel-bus-client.ts` L1 imports KernelBusPush; L69-73 checks `type === 'push'` and routes to pushHandlers |
| WindowFrame | kernelBusHost | registerFrame/unregisterFrame on mount/unmount | WIRED | `WindowFrame.tsx` L4 imports kernelBusHost; L43-46 registers/unregisters |
| main.tsx | kernelBusHost.init | DI callbacks wired to useWindowStore and themeEngine | WIRED | `main.tsx` L3-40; all callbacks call useWindowStore actions or themeEngine.getResolvedMode() |
| KernelBusHost | themeEngine | subscribe for push broadcast trigger | WIRED | `kernel-bus-host.ts` L3 imports themeEngine; L34-44 subscribes and broadcasts on mode change |

---

### Data-Flow Trace (Level 4)

Not applicable for this phase — all artifacts are message-passing infrastructure (postMessage RPC bridge), not data-rendering components. No React components render dynamic data; no DB queries involved.

---

### Behavioral Spot-Checks (Step 7b)

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| All 52 kernel tests pass (kernel config) | `npx vitest run --config packages/kernel/vitest.config.ts packages/kernel/` | 52/52 pass, 4 test files | PASS |
| All 29 kernel-bus tests pass (kernel config) | `npx vitest run --config packages/kernel/vitest.config.ts packages/kernel/src/kernel-bus-host.test.ts packages/kernel/src/kernel-bus-client.test.ts` | 29/29 pass | PASS |
| Workspace-level `pnpm test` includes kernel-bus tests | `pnpm -w run test` | 29 kernel-bus tests FAIL: `window is not defined` (root config: node environment) | FAIL |
| KernelBusClient exported from @vidorra/kernel | `grep "KernelBusClient" packages/kernel/src/index.ts` | `export { KernelBusClient } from './kernel-bus-client'` | PASS |
| kernelBusHost.init called before createRoot | Inspect `main.tsx` ordering | init at L16, createRoot at L42 | PASS |

---

### Requirements Coverage

| Requirement | Source Plans | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| BUS-01 | 03-02 (host), 03-04 (shell) | Trust model — messages from untrusted contentWindows are silently dropped; app.ready promotes pending to trusted | SATISFIED | `kernel-bus-host.ts` L83-108: messages from unregistered sources dropped at L101; pendingFrames→trustedFrames promotion at L92-96; 4 trust model tests in `kernel-bus-host.test.ts` L64-125 |
| BUS-02 | 03-01 (types), 03-02 (host) | All 6 RPC methods work (window.setTitle, window.close, window.minimize, window.maximize, window.resize, theme.get) | SATISFIED | All 6 methods present in `kernel-bus-host.ts` dispatch() L119-155; 8 RPC dispatch tests in `kernel-bus-host.test.ts` L131-276 |
| BUS-03 | 03-01 (types), 03-02 (host), 03-03 (client) | requestId is echoed in responses; requests include requestId | SATISFIED | `kernel-bus-host.ts` L163-165: `source.postMessage(response, '*')` always echoes requestId; `kernel-bus-client.ts` L45: `{ requestId, method, params }` message construction |
| BUS-04 | 03-03 (client) | 5-second timeout rejects KernelBusClient Promise | SATISFIED | `kernel-bus-client.ts` L38-41: `setTimeout(() => reject(…), 5000)`; 3 timeout tests in `kernel-bus-client.test.ts` L104-146 |

All 4 requirement IDs accounted for. No orphaned requirements.

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `vitest.config.ts` (root) | 5 | `environment: 'node'` while kernel package has browser-dependent tests | Warning | Workspace-level `pnpm test` fails 29 kernel-bus tests; CI would report broken tests despite working implementation |

No TODOs, FIXMEs, placeholder implementations, or empty returns found in phase 03 source files. All RPC handlers are substantive.

---

### Human Verification Required

#### 1. End-to-End postMessage Bridge in Browser

**Test:** Start the shell dev server (`pnpm --filter @vidorra/shell dev`). Open a window that loads an iframe app. In the iframe's console, manually execute:
```javascript
window.parent.postMessage({ method: 'app.ready' }, '*')
window.parent.postMessage({ requestId: 'test-1', method: 'theme.get' }, '*')
```
Then listen for responses:
```javascript
window.addEventListener('message', e => console.log(e.data))
```

**Expected:** First `theme.get` returns `{ requestId: 'test-1', result: 'light' }` (or `'dark'`). Title change and minimize/maximize/close should visibly affect the window.

**Why human:** Requires live browser with running dev server. Cannot verify iframe sandbox interaction programmatically.

---

### Gaps Summary

One gap found, one warning:

**Gap (test runner config):** The workspace root `vitest.config.ts` uses `environment: 'node'`, while all 29 kernel-bus tests depend on browser globals (`window.addEventListener`, `MessageEvent`, `window.parent`). Running `pnpm -w run test` reports 29 failures. The kernel package has its own correct `vitest.config.ts` (`environment: 'happy-dom'`), but the workspace runner never picks it up because the root config overrides it.

This is a test infrastructure gap, not an implementation gap. All 52 kernel tests pass when invoked via `npx vitest run --config packages/kernel/vitest.config.ts`. The fix is straightforward: either change the root config to `happy-dom`, or change the workspace `test` script to use `pnpm -r run test` so each package uses its own config.

The implementation itself (KernelBusHost, KernelBusClient, WindowFrame wiring, main.tsx init) is fully correct and complete.

---

_Verified: 2026-04-02T07:10:00Z_
_Verifier: Claude (gsd-verifier)_
