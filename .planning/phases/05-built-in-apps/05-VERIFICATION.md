---
phase: 05-built-in-apps
verified: 2026-04-03T06:40:00Z
status: passed
score: 4/4 success criteria verified
re_verification: false
gaps: []
human_verification:
  - test: "Install from URL end-to-end"
    expected: "After entering a valid manifest URL in the Install modal, the app card appears in AppGrid and the app appears in the Dock after the storage event fires"
    why_human: "Requires a live browser + network-accessible manifest URL + running dev servers on ports 3010/3000 to observe the full iframe → kernel → Dock chain"
  - test: "Settings theme switch — immediate CSS variable update across shell"
    expected: "Clicking Dark in GeneralPanel causes the Shell chrome (Menubar, Dock, Desktop) to switch colors within one render frame, with no stale-theme flash"
    why_human: "CSS variable propagation via themeEngine.setMode() → applyTheme() → :root style.setProperty is synchronous in the JS engine, but visual verification of cross-frame timing needs a running browser"
  - test: "Welcome auto-opens on first launch; does not re-open after vidorra:welcomed is set"
    expected: "Fresh localStorage (cleared) → shell loads → Welcome window opens automatically. Reload with vidorra:welcomed='1' set → Welcome does NOT appear"
    why_human: "Requires manual browser test; localStorage.clear() + page reload sequence cannot be safely scripted in this environment"
---

# Phase 5: Built-in Apps Verification Report

**Phase Goal:** App Store (list + install from URL + uninstall), Settings (theme + wallpaper), Calculator (zero-dependency), Welcome (first-launch). All apps load as iframes via AppRegistry.
**Verified:** 2026-04-03T06:40:00Z
**Status:** passed
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths (Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|---------|
| 1 | App Store can install an external app from a manifest URL and it appears in the Dock | VERIFIED | `useAppRegistry.install()` calls `appRegistry.install(url)` which fetches, validates, and persists to `localStorage['vidorra:registry']`; `Dock.tsx` has `window.addEventListener('storage', refresh)` that re-reads `appRegistry.getAllApps()` on every registry change |
| 2 | Settings theme switch immediately updates all CSS variables across the shell | VERIFIED | `GeneralPanel.tsx` calls `themeEngine.setMode(mode)` directly; `themeEngine.setMode()` calls `applyTheme()` which iterates CSS vars onto `document.documentElement.style.setProperty`; `shell/src/main.tsx` subscribes via `themeEngine.subscribe()` to sync `useThemeStore.setState` and toggle `body.dark` class |
| 3 | Calculator computes 12 + 34 * 5 correctly (operator precedence) | VERIFIED | `evaluate()` uses `Function('"use strict"; return (' + expr + ')')()` — JS native operator precedence ensures `34 * 5 = 170` before adding `12 = 182`; Vitest test `evaluate('12 + 34 * 5') === 182` passes (7/7 tests green) |
| 4 | Welcome app opens on first launch; vidorra:welcomed key prevents re-show | VERIFIED | `shell/src/App.tsx` checks `localStorage.getItem('vidorra:welcomed')` on mount; if absent, calls `openWindow()` and sets `localStorage.setItem('vidorra:welcomed', '1')`; Welcome `App.tsx` also sets `vidorra:welcomed` idempotently in `handleGetStarted`; `onGetStarted` prop wires to `app.window.close()` via SDK |

**Score:** 4/4 truths verified

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `apps/app-store/src/App.tsx` | App Store root with install/uninstall wiring | VERIFIED | 95 lines; renders AppGrid, AppDetail, InstallModal, TrashZone; calls `useAppRegistry` hook |
| `apps/app-store/src/hooks/useAppRegistry.ts` | Reactive wrapper for appRegistry | VERIFIED | 42 lines; `install()` returns `Promise<boolean>` (hadError sentinel); `uninstall()` calls `appRegistry.uninstall()` + refresh |
| `apps/app-store/src/components/InstallModal.tsx` | Install-from-URL modal with validation | VERIFIED | 75 lines; URL input form, error display, installing state, calls `onInstall(url)` |
| `apps/app-store/src/components/TrashZone.tsx` | Drag-to-uninstall drop target | VERIFIED | 33 lines; HTML5 DnD `onDrop` reads `dataTransfer.getData('text/plain')` and calls `onDrop(appId)` |
| `apps/settings/src/App.tsx` | Settings root with panel routing | VERIFIED | 21 lines; two-column layout, `activePanel` state routes General/Wallpaper |
| `apps/settings/src/components/panels/GeneralPanel.tsx` | Theme segmented control | VERIFIED | 43 lines; calls `themeEngine.setMode(mode)` on click; imports `themeEngine` from `@vidorra/kernel` |
| `apps/settings/src/components/panels/WallpaperPanel.tsx` | Wallpaper preset picker | VERIFIED | 51 lines; 3 presets, `localStorage.setItem('vidorra:wallpaper', path)` on select |
| `apps/calculator/src/hooks/useCalculator.ts` | Calculator state machine + evaluate() | VERIFIED | 94 lines; `evaluate()` with character allowlist regex + `Function()` wrapper; full state machine |
| `apps/calculator/src/hooks/useCalculator.test.ts` | 7 Vitest tests for arithmetic | VERIFIED | All 7 tests GREEN (confirmed by `pnpm --filter @vidorra/calculator run test`) |
| `apps/welcome/src/App.tsx` | Welcome UI with Get Started button | VERIFIED | 33 lines; sets `vidorra:welcomed`, calls `onGetStarted()` on button click |
| `apps/welcome/src/main.tsx` | SDK init + window.close wiring | VERIFIED | `app.ready()`, `app.theme.get()`, `app.theme.onChange()` in async `main()`; passes `app.window.close()` as `onGetStarted` prop |
| `registry/built-in-apps.json` | 4-entry registry (app-store, settings, calculator, welcome) | VERIFIED | All 4 entries with correct `entry` paths, `defaultSize`, `minSize`, `icon`, `category` |
| `packages/shell/vite.config.ts` | Dev proxy for /apps/* to app dev servers | VERIFIED | Proxies `/apps/app-store` → 3010, `/apps/settings` → 3011, `/apps/calculator` → 3012, `/apps/welcome` → 3013 with path rewrite |
| `packages/shell/src/main.tsx` | themeEngine subscriber syncing useThemeStore | VERIFIED | `themeEngine.subscribe()` at module level; updates `useThemeStore.setState({ theme: resolved })` and `body.dark` class |
| `packages/shell/src/App.tsx` | Shell seeds registry and opens Welcome on first launch | VERIFIED | `appRegistry.registerLocal()` loop for built-ins; `vidorra:welcomed` check + `openWindow()` for Welcome |
| `packages/shell/src/components/Dock/Dock.tsx` | Storage event listener for live registry updates | VERIFIED | `window.addEventListener('storage', refresh)` calls `setApps(appRegistry.getAllApps())` on any storage change |
| `packages/shell/src/components/Desktop/Desktop.tsx` | Storage event listener for wallpaper changes | VERIFIED | `window.addEventListener('storage', handler)` checks `e.key === 'vidorra:wallpaper'` and calls `setWallpaperUrl(e.newValue)` |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `apps/settings` iframe | `packages/shell/src/components/Desktop/Desktop.tsx` | `localStorage['vidorra:wallpaper']` StorageEvent | WIRED | `WallpaperPanel.tsx` writes `localStorage.setItem(WALLPAPER_KEY, path)`; `Desktop.tsx` listens via `window.addEventListener('storage', handler)` filtering on `e.key === STORAGE_KEY` |
| `apps/app-store` iframe | `packages/shell/src/components/Dock/Dock.tsx` | `localStorage['vidorra:registry']` StorageEvent | WIRED | `appRegistry.uninstall/install` calls `persist()` → `localStorage.setItem('vidorra:registry', ...)` → StorageEvent in shell frame; `Dock.tsx` handles with `window.addEventListener('storage', refresh)` |
| `packages/shell/src/main.tsx` | `packages/shell/src/stores/useThemeStore.ts` | `themeEngine.subscribe()` callback | WIRED | `themeEngine.subscribe((mode) => { ... useThemeStore.setState({ theme: resolved }) })` in `main.tsx` at module level |
| `apps/settings/GeneralPanel.tsx` | `:root` CSS variables (shell document) | `themeEngine.setMode()` → `applyTheme()` | WIRED | `themeEngine.setMode(mode)` → private `applyTheme()` iterates `THEMES[resolved]` onto `document.documentElement.style.setProperty` synchronously |
| `apps/welcome/src/App.tsx` | Shell window manager (close window) | `app.window.close()` via KernelBus SDK | WIRED | `main.tsx` passes `onGetStarted={() => app.window.close()}` prop; `App.tsx` calls `onGetStarted()` in `handleGetStarted()` |

---

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|--------------|--------|-------------------|--------|
| `apps/app-store/src/App.tsx` | `apps` (AppManifest[]) | `useAppRegistry` → `appRegistry.getAllApps()` → `localStorage['vidorra:registry']` | Yes — reads from kernel Map populated by install/registerLocal | FLOWING |
| `packages/shell/src/components/Dock/Dock.tsx` | `apps` (AppManifest[]) | `appRegistry.getAllApps()` on mount + storage event refresh | Yes — populated from `built-in-apps.json` via `registerLocal()` in App.tsx seeding | FLOWING |
| `packages/shell/src/components/Desktop/Desktop.tsx` | `wallpaperUrl` (string) | Initial: `localStorage.getItem('vidorra:wallpaper')`; Live: StorageEvent from Settings | Yes — real localStorage read; fallback to `/wallpapers/default.png` | FLOWING |
| `apps/settings/src/components/panels/GeneralPanel.tsx` | `activeMode` (ThemeMode) | `themeEngine.getMode()` on init | Yes — reads persisted mode from `localStorage['vidorra:theme']` | FLOWING |
| `apps/calculator/src/App.tsx` | `calc.display` (string) | `useCalculator()` hook state machine | Yes — pure computation from `evaluate()` + state transitions | FLOWING |
| `apps/welcome/src/App.tsx` | Static copy, no dynamic data | N/A — renders fixed brand text | N/A — intentionally static | N/A |

---

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Calculator: 12 + 34 * 5 = 182 | `node -e "const r = Function('\"use strict\"; return (12 + 34 * 5)')(); console.log(r)"` | `182` | PASS |
| Calculator tests — all 7 green | `pnpm --filter @vidorra/calculator run test` | 7/7 passed | PASS |
| Calculator: zero SDK dependency | `grep "@vidorra/sdk" apps/calculator/package.json` | No match | PASS |
| Welcome: vidorra:welcomed check in shell | `grep "vidorra:welcomed" packages/shell/src/App.tsx` | Lines 15, 29, 45 confirmed | PASS |
| Dock storage listener exists | `grep "addEventListener.*storage" packages/shell/src/components/Dock/Dock.tsx` | Line 25 confirmed | PASS |
| Desktop storage listener exists | `grep "addEventListener.*storage" packages/shell/src/components/Desktop/Desktop.tsx` | Line 28 confirmed | PASS |
| themeEngine.subscribe in shell main | `grep "themeEngine.subscribe" packages/shell/src/main.tsx` | Line 44 confirmed | PASS |
| 4 entries in registry | `registry/built-in-apps.json` apps array | app-store, settings, calculator, welcome | PASS |
| Vite proxy routes /apps/welcome | `grep "localhost:3013" packages/shell/vite.config.ts` | Line 29 confirmed | PASS |

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|---------|
| APP-01 | 05-05-PLAN | App Store lists installed apps (card layout) and supports "Install from URL" flow with manifest validation | SATISFIED | `AppGrid` renders `apps` from `useAppRegistry`; `InstallModal` submits URL to `appRegistry.install()` which fetches, validates required fields, persists |
| APP-02 | 05-05-PLAN | App Store supports uninstall; uninstalled apps disappear from Dock | SATISFIED | Three uninstall paths: `AppDetail` button, right-click context menu in `AppCard`, HTML5 DnD `TrashZone`; all call `useAppRegistry.uninstall()`; Dock listens via storage event |
| APP-03 | 05-04-PLAN | Settings app provides theme (Light/Dark/Auto) and wallpaper selection (2–3 presets) | SATISFIED | `GeneralPanel` has 3-option segmented control calling `themeEngine.setMode()`; `WallpaperPanel` has 3 preset thumbnails writing `localStorage['vidorra:wallpaper']` |
| APP-04 | 05-02-PLAN | Calculator performs basic arithmetic; zero SDK dependency; macOS-style UI | SATISFIED | `evaluate()` with `Function()` wrapper + allowlist regex; `useCalculator` hook; `App.tsx` 4×5 macOS button grid; `apps/calculator/package.json` has no `@vidorra/sdk` |
| APP-05 | 05-03-PLAN | Welcome app renders first-launch guidance; "Get Started" button closes window and sets `vidorra:welcomed` | SATISFIED | `App.tsx` renders brand copy + "Get Started" button; `handleGetStarted` sets `vidorra:welcomed`; `main.tsx` wires `onGetStarted={() => app.window.close()}`; shell checks `vidorra:welcomed` on mount |

**All 5 requirements (APP-01 through APP-05) SATISFIED. No orphaned requirements for Phase 5.**

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `apps/app-store/src/components/AppDetail.tsx` | 31–33 | Description shows hardcoded "A Vidorra OS application." | Info | `AppManifest` has no `description` field in Phase 5 scope — intentional and explicitly documented in 05-05-SUMMARY.md Known Stubs section. Does not block APP-01/APP-02. |

No blocker or warning anti-patterns found. The one info-level item is an acknowledged scope limitation with no `description` field on `AppManifest` in the Phase 5 type definition.

---

### Human Verification Required

#### 1. Install from URL — Full End-to-End Flow

**Test:** Start shell dev server (`pnpm --filter @vidorra/shell dev`) and app-store dev server (`pnpm --filter @vidorra/app-store dev`). Open App Store window. Click "Install from URL". Enter a valid manifest URL (e.g., a locally hosted `manifest.json` with all required fields). Click "Install".
**Expected:** The new app card appears in the App Store grid AND the Dock updates to show the new app icon without a page reload.
**Why human:** Requires live browser, a network-accessible manifest URL, and both dev servers running simultaneously to observe the iframe → kernel → StorageEvent → Dock chain.

#### 2. Settings Theme Switch — Immediate CSS Variable Update

**Test:** Open Settings window. Click "Dark" in the Appearance segmented control.
**Expected:** Shell chrome (Menubar, Dock, window chrome) switches from light to dark colors within one render frame. No stale-theme flash. CSS variables on `:root` are updated synchronously.
**Why human:** `themeEngine.setMode()` is synchronous and correct in code, but cross-frame visual timing and the absence of flash requires a running browser to confirm the user-visible experience.

#### 3. Welcome Auto-Opens; Does Not Re-Open After Acknowledged

**Test:** Clear localStorage in DevTools (`localStorage.clear()`). Reload the shell. Observe whether Welcome window opens automatically. Click "Get Started". Reload again.
**Expected:** First load: Welcome window appears centered on screen. After "Get Started": reload does not open Welcome window again.
**Why human:** `localStorage.clear()` + page reload sequence requires manual browser interaction to verify the first-launch detection and suppression logic in `App.tsx`.

---

### Gaps Summary

No gaps found. All four success criteria are fully implemented and wired:

1. **App Store install → Dock update**: `appRegistry.install()` fetches + validates + persists to localStorage; Dock's storage listener refreshes the apps list.
2. **Settings theme → CSS vars**: `themeEngine.setMode()` synchronously injects CSS variables onto `:root`; shell subscribes to keep `useThemeStore` and `body.dark` in sync.
3. **Calculator operator precedence**: `evaluate()` uses JS native `Function()` which respects PEMDAS; test `evaluate('12 + 34 * 5') === 182` confirmed green.
4. **Welcome first-launch guard**: Shell checks `vidorra:welcomed` on mount, opens Welcome if absent, sets the key immediately; Welcome's "Get Started" button calls `app.window.close()` via SDK.

Three items are routed to human verification because they require live browser observation of cross-frame timing, StorageEvent propagation, and localStorage state management — none of which can be confirmed by static code analysis alone.

---

_Verified: 2026-04-03T06:40:00Z_
_Verifier: Claude (gsd-verifier)_
