# Codebase Concerns

**Analysis Date:** 2026-04-01

## Early-Stage Development Risks

**Unvalidated Architecture under Load:**
- Issue: Core systems (KernelBus, WindowManager, DataStore) are documented but not yet implemented in production code. Only `AppRegistry` and `ThemeEngine` exist as full implementations.
- Files: `packages/kernel/src/app-registry.ts`, `packages/kernel/src/theme-engine.ts` (complete); `packages/sdk/src/index.ts` (stub)
- Impact: Unknown performance characteristics, race conditions, memory leaks not yet discovered. Real multi-app scenarios untested.
- Fix approach: Implement Phase 2-3 incrementally with load testing. Establish performance benchmarks before scale testing.

**Shell Placeholder State:**
- Issue: `packages/shell/src/App.tsx` is a stub. WindowManager, Dock, Menubar, Spotlight UI not implemented.
- Files: `packages/shell/src/App.tsx`, entire `src/components/` missing
- Impact: Cannot validate visual language, animation performance (60 fps requirement), or window management logic. Shell load time target (< 2s) unverified.
- Fix approach: Phase 2 implementation. Start with WindowManager core before animated chrome.

**SDK Not Functional:**
- Issue: `packages/sdk/src/index.ts` is empty. `createApp()`, data collection APIs, permission framework not implemented.
- Files: `packages/sdk/src/index.ts`
- Impact: Apps cannot actually integrate. SDK bundle size constraint (≤ 8 KB gzip) has not been validated against real implementation.
- Fix approach: Phase 3 SDK v0.1 implementation with incremental bundle analysis.

---

## Storage & Persistence Concerns

**localStorage Dependency for Critical State:**
- Issue: Both `AppRegistry` and `ThemeEngine` rely entirely on `localStorage` for persistence with minimal error recovery.
- Files: `packages/kernel/src/app-registry.ts` (lines 68-88), `packages/kernel/src/theme-engine.ts` (lines 75-84)
- Impact: Silent data loss on localStorage quota exceeded, quota errors during persist not surfaced to user. Malicious app could clear registry. No backup mechanism.
- Workaround: Users must manually manage browser storage settings
- Fix approach: Implement quota checking before persist, add error logging, consider IndexedDB fallback for critical data. Add validation on load to detect corruption.

**Corrupted Storage Silent Fallback:**
- Issue: `AppRegistry.load()` silently deletes corrupted localStorage on parse error (line 84-86). User loses all installed apps without warning.
- Files: `packages/kernel/src/app-registry.ts` (lines 84-86)
- Impact: Silent data loss. No recovery path. No audit trail of what was lost.
- Fix approach: Log corrupt state before deletion, implement backup/recovery flow, or require explicit user action to recover.

---

## Validation & Type Safety Gaps

**Incomplete Manifest Validation:**
- Issue: `AppRegistry.validate()` checks required fields and defaultSize structure, but doesn't validate:
  - `entry` URL format (could be arbitrary string, not a valid URL)
  - `icon` path/URL format
  - `category` enum values (any string accepted)
  - `version` semver format
  - URL origin consistency (entry URL origin must match declared permissions)
- Files: `packages/kernel/src/app-registry.ts` (lines 46-66)
- Impact: Invalid manifests accepted at install time, causing runtime errors. XSS potential if icon/entry not properly sandboxed downstream.
- Fix approach: Use URL constructor to validate entry URL, validate category against allowed list, add icon URL validation. Consider Zod schema validation as documented in security model (ADR-0005).

**Type Casting Weakness:**
- Issue: Line 65 in `app-registry.ts` casts data to `AppManifest` without full schema validation. TypeScript type is not enforced at runtime.
- Files: `packages/kernel/src/app-registry.ts` (line 65)
- Impact: Unknown fields in manifest silently accepted, malicious fields could be injected downstream.
- Fix approach: Implement full Zod schema matching `AppManifest` interface.

---

## Permission System Not Yet Enforced

**Permission Guard Missing from Implementation:**
- Issue: Permission model documented in ADR-0005 (three-level rules: alwaysAllow/alwaysAsk/alwaysDeny) but no `PermissionGuard` class exists in codebase.
- Files: Documented in `docs/adr/0005-permission-model.md` but not in `packages/kernel/src/`
- Impact: Apps have no permission boundaries during Phase 2 shell implementation. Security audit will be required before user data.
- Fix approach: Implement PermissionGuard in Phase 2 alongside KernelBus. Block unsafe operations at API boundary.

**Origin → AppId Mapping Incomplete:**
- Issue: Security model requires trust mapping from iframe origin to AppId via manifest declaration (ADR security model), but no registration mechanism implemented.
- Files: No `registerApp()` method in `AppRegistry` yet
- Impact: Cannot validate incoming messages in KernelBus. Apps could spoof origins.
- Fix approach: Add `registerApp()` method to AppRegistry storing origin mapping from manifest.entry URL.

---

## Test Coverage Gaps

**No Shell Component Tests:**
- Issue: Shell UI not implemented yet, but when it is, will need extensive tests for:
  - Window drag/resize collision detection
  - Z-index management during focus changes
  - Dock magnification animation timing
  - Menubar state synchronization
- Files: `packages/shell/src/App.tsx` (shell placeholder)
- Risk: High - visual regressions hard to catch without tests. 60 fps requirement untestable without performance assertions.
- Priority: Medium (deferred until Phase 2 shell implementation)

**No KernelBus Integration Tests:**
- Issue: No test coverage for multi-iframe postMessage communication patterns.
- Files: KernelBus implementation (Phase 2-3)
- Risk: Medium - message ordering, race conditions, origin spoofing hard to validate without integration tests.
- Priority: High - must test before Phase 2 completion

**Limited Mutation Testing for AppRegistry:**
- Issue: `AppRegistry` tests use `vi.fn()` mocks but don't test:
  - Race conditions during concurrent installs of same app
  - Large manifest payloads (< 1MB check missing)
  - Memory leaks if apps installed/uninstalled repeatedly
- Files: `packages/kernel/src/app-registry.test.ts`
- Risk: Low-Medium - single-threaded JavaScript mitigates, but rapid install/uninstall cycles could leak memory
- Priority: Low

---

## Performance & Scaling Concerns

**No Bundled Size Validation:**
- Issue: SDK bundle size constraint (≤ 8 KB gzip) declared in PROJECT.md but no build size checking in place. No size regression test.
- Files: `packages/sdk/src/index.ts` (empty), but constraint in `.planning/PROJECT.md`
- Impact: SDK could accidentally exceed 8 KB when createApp() is implemented, breaking integration promise.
- Fix approach: Add bundlesize check in CI (package.json scripts).

**Shell Load Time Unverified:**
- Issue: < 2s load time target on localhost declared but no performance test or budget tracking.
- Files: `packages/shell/src/` (placeholder)
- Impact: Animation target (60 fps) depends on fast initial load. Unknown if Framer Motion + React 18 overhead will meet budget.
- Fix approach: Add Lighthouse CI check on shell build. Benchmark window mount/paint times.

**localStorage Scaling Limit:**
- Issue: Phase 2 plans DataStore persistence via IndexedDB (ADR-0004) but Phase 1 uses localStorage for AppRegistry. As apps accumulate, registry JSON could grow to 5MB+, approaching 5-10 MB localStorage limit.
- Files: `packages/kernel/src/app-registry.ts` (lines 68-74 persist all apps to single key)
- Impact: At ~200 apps stored locally, could hit quota. No graceful degradation.
- Fix approach: Migrate to IndexedDB for AppRegistry in Phase 2, or implement LRU cache for recently used apps.

---

## Fragile Integration Points

**Singleton Pattern Coupling:**
- Issue: `appRegistry` and `themeEngine` exported as singletons (lines 91 in app-registry.ts, line 94 in theme-engine.ts). Tests instantiate new versions but code expects singleton.
- Files: `packages/kernel/src/app-registry.ts` (line 91), `packages/kernel/src/theme-engine.ts` (line 94)
- Impact: Hard to test Shell code that imports singleton. Potential for test pollution if singleton state not cleared. Multiple instances in test environment.
- Fix approach: Refactor to dependency injection, or provide clear reset() method on singletons for test cleanup.

**ThemeEngine mediaQuery Listener Cleanup:**
- Issue: `ThemeEngine.onSystemChange` arrow function listener added in constructor but teardown only happens in `destroy()`. If destroy() not called, listener leaks (e.g., in tests).
- Files: `packages/kernel/src/theme-engine.ts` (lines 30, 56)
- Impact: Test pollution - system theme changes affect subsequent tests. Memory leak if Shell doesn't clean up.
- Workaround: Always call `engine.destroy()` in afterEach
- Fix approach: Consider `useEffect`-like pattern or explicit setup/teardown decorators for managers.

**No Explicit Error Boundaries:**
- Issue: Neither AppRegistry nor ThemeEngine define error boundaries for downstream code. Fetch errors in install() throw but don't emit events.
- Files: `packages/kernel/src/app-registry.ts` (line 24-26)
- Impact: Shell has no way to show install error UI to user. Silent failures likely.
- Fix approach: Add error event emitter or Result<T, E> return type. Propagate to Shell via subscriber pattern.

---

## Security-Relevant Gaps

**No HTTPS Enforcement for App Entry URLs:**
- Issue: manifest.entry can be any string; http:// apps allowed, could expose to MITM attacks on insecure networks.
- Files: `packages/kernel/src/app-registry.ts` (no URL validation)
- Impact: User could install HTTP app in localhost dev mode without issue, but production deployments should enforce HTTPS.
- Fix approach: Add development mode check; reject non-HTTPS in production builds.

**Missing iframe Sandbox Attribute Validation:**
- Issue: Security model (ADR) specifies dynamic sandbox attribute generation based on manifest permissions, but `buildSandboxAttr()` not yet implemented.
- Files: Documented in `docs/architecture/security-model.md` but no code in kernel
- Impact: Cannot enforce "no allow-same-origin unless declared" rule. Phase 2 Shell could accidentally grant too many permissions.
- Fix approach: Implement `buildSandboxAttr()` in Phase 2, test with malicious manifests that declare filesystem.write but try to access DOM.

**No Signature/Integrity Verification for Manifests:**
- Issue: Manifest fetched over HTTPS but unsigned; a Man-in-the-Middle on DNS or CA compromise could modify manifest.
- Files: `packages/kernel/src/app-registry.ts` (line 23 fetch)
- Impact: Attacker could redirect app entry URL to phishing domain.
- Fix approach: Phase 2/3: Add manifest signing via app developer PKI or hash pinning in app store. Out of scope for Phase 1.

---

## Technical Debt & Design Issues

**Hardcoded Theme Values:**
- Issue: Color values hardcoded in ThemeEngine (lines 5-20). Adding a new color or theme requires code change.
- Files: `packages/kernel/src/theme-engine.ts` (lines 5-20)
- Impact: Not maintainable for future themes. Theme plugins (P2+) will require refactoring.
- Fix approach: Load theme definitions from manifest or config file.

**localStorage Key Duplication:**
- Issue: Storage keys hardcoded in each manager ('vidorra:registry', 'vidorra:theme'). No central registry of keys.
- Files: `packages/kernel/src/app-registry.ts` (line 16), `packages/kernel/src/theme-engine.ts` (line 26)
- Impact: Namespace collisions if multiple stores added. Refactoring requires grep.
- Fix approach: Create `StorageKeys` enum in shared location.

**Loose Event Loop Assumption:**
- Issue: Tests mock fetch synchronously but real fetch is async. `ThemeEngine` notifies subscribers immediately after applyTheme (line 88), but DOM updates async. Timing assumptions untested.
- Files: `packages/kernel/src/theme-engine.ts`, test files
- Impact: Race conditions with real DOM updates possible in production.
- Fix approach: Test with real async fetch and DOM mutations. Use `requestAnimationFrame` for theme application.

---

## Phase Blockers

**Phase 2 Shell Cannot Start Without:**
- KernelBus implementation (postMessage RPC) — currently stubbed in types only
- WindowManager class — not in codebase
- Complete test infrastructure for UI components — not set up

**Phase 3 SDK Cannot Release Without:**
- Complete KernelBus and permission system working in shell
- Validation that bundle size stays ≤ 8 KB gzip
- Integration test with at least one real app (Calculator or Notes)

---

## Dependency Risk

**No Major Vulnerabilities Detected in Current Stack:**
- React 18.3.1, Vite 6.4, TypeScript 5.9 all current and well-maintained
- Risk: Vitest 3.2 is bleeding edge (released Jan 2025); may have undiscovered issues. Monitor for security updates.

**Missing Optional Dependencies for Future Phases:**
- DataStore will need Dexie.js for IndexedDB (P2)
- Server sync will need ws or Socket.io (P2-3)
- Animation effects need Framer Motion (not yet added, expected P2)
- These not yet in package.json, defer until phase completion

---

## Recommended Immediate Actions (Next 2 Weeks)

1. **Add validation suite to AppRegistry** — Zod schema for manifest, URL format checks, category enum
2. **Implement PermissionGuard skeleton** — Method signatures matching ADR-0005, blocked operations logging
3. **Add bundle size CI check** — Enforce SDK ≤ 8 KB gzip before Phase 3
4. **Test singleton cleanup** — Add explicit reset methods or DI to AppRegistry/ThemeEngine
5. **Implement iframe sandbox builder** — `buildSandboxAttr()` function with tests

---

*Concerns audit: 2026-04-01*
