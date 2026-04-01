# Phase 1: Kernel - Context

**Gathered:** 2026-04-01
**Status:** Complete

<domain>
## Phase Boundary

Implement the two core Kernel modules — `AppRegistry` (install/uninstall apps via manifest URL, persist to localStorage) and `ThemeEngine` (CSS variable injection, light/dark/auto modes, subscriber notifications) — with full Vitest test coverage.

**Not included:** Any UI, Shell components, or postMessage communication (Phase 3).

</domain>

<decisions>
## Implementation Decisions

### Architecture
- Two independent classes + singleton exports: `appRegistry` and `themeEngine`
- No unified Kernel class — over-abstraction for MVP
- No functional API — harder to isolate in tests

### AppRegistry (`packages/kernel/src/app-registry.ts`)
- `install(manifestUrl)`: fetch → validate required fields → persist to `localStorage['vidorra:registry']`
- `uninstall(appId)`: remove from Map + localStorage; silently ignore unknown IDs
- `getApp(id)` / `getAllApps()`: read-only accessors
- Duplicate install (same id): silently overwrites (update behavior)
- Error messages: `'Failed to fetch manifest: <url>'` / `'Invalid manifest: missing <field>'`

### ThemeEngine (`packages/kernel/src/theme-engine.ts`)
- `setMode('light' | 'dark' | 'auto')`: updates mode, persists to `localStorage['vidorra:theme']`, injects CSS vars, notifies subscribers
- `getResolvedMode()`: resolves `auto` → `light` or `dark` via `prefers-color-scheme`
- `subscribe(cb)`: returns unsubscribe function
- `destroy()`: removes `matchMedia` listener (test cleanup)
- CSS variables injected to `document.documentElement`:
  - `--color-bg`: `#ffffff` / `#1e1e2e`
  - `--color-surface`: `#f5f5f5` / `#313244`
  - `--color-text`: `#1a1a1a` / `#cdd6f4`
  - `--color-accent`: `#0066cc` / `#89b4fa`
  - `--color-border`: `#e0e0e0` / `#45475a`

### Testing
- Environment: `happy-dom` (supports CSS variables + matchMedia mock)
- Vitest workspace mode; `packages/kernel/vitest.config.ts` sets `environment: 'happy-dom'`
- Each module has a co-located `.test.ts` file

### Exports (`packages/kernel/src/index.ts`)
```ts
export { AppRegistry, appRegistry } from './app-registry'
export { ThemeEngine, themeEngine } from './theme-engine'
export type { ThemeMode } from './theme-engine'
```

</decisions>

<canonical_refs>
## Canonical References

- `docs/plans/mvp-plan.md` — AppRegistry and ThemeEngine interface specs (Phase 1 section)
- `docs/plans/2026-04-01-phase1-kernel-design.md` — Full kernel design doc with test strategy
- `packages/types/src/manifest.ts` — `AppManifest` type definition

</canonical_refs>

<specifics>
## Specific Ideas

- ThemeEngine must handle `auto` mode by listening to `window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', ...)`
- Shell components consume CSS vars directly (`var(--color-bg)`) — no React subscription to ThemeEngine needed

</specifics>

<deferred>
## Deferred Ideas

- Permission guard for app installs — Phase 3
- DataStore integration — P2 feature

</deferred>

---

*Phase: 01-kernel*
*Context gathered: 2026-04-01*
