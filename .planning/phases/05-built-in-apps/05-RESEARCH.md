# Phase 5: Built-in Apps - Research

**Researched:** 2026-04-03
**Domain:** React/Vite iframe apps + Shell integration (AppRegistry, ThemeEngine, KernelBus SDK)
**Confidence:** HIGH — all findings derived from direct codebase inspection and established project patterns

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Each built-in app is an independent Vite+React project on its own dev port:
  - `apps/app-store` → :3010
  - `apps/settings` → :3011
  - `apps/calculator` → :3012 (must be created from scratch)
  - Welcome → static HTML replacement at `packages/shell/public/apps/welcome/index.html` (transform current placeholder into functional page with SDK call — see D-07 discretion note below)
- **D-02:** Shell `vite.config.ts` gets proxy rules for /apps/app-store, /apps/settings, /apps/calculator during dev
- **D-03:** Each app's Vite build outputs to `packages/shell/public/apps/xxx/`; `built-in-apps.json` entries use `/apps/xxx/index.html` paths
- **D-04:** `built-in-apps.json` needs Settings, Calculator, Welcome entries added (entry, icon, defaultSize, minSize)
- **D-05:** App Store uses `@vidorra/sdk`: `app.ready()` + `app.theme.onChange()`
- **D-06:** Settings uses `@vidorra/sdk`: `app.ready()` + `app.theme.onChange()`; theme switch calls `themeEngine.setMode()` — Settings is same-domain to Shell so direct import is allowed; KernelBus push broadcasts to all other iframes automatically
- **D-07:** Welcome uses `@vidorra/sdk`: `app.ready()` + "Get Started" calls `app.window.close()`
- **D-08:** Calculator has zero SDK dependency — pure React, no `@vidorra/sdk` import
- **D-09:** App Store layout: top toolbar ("Install from URL" entry) + card grid; click card → detail page (in-page navigation, not new window)
- **D-10:** Detail page: app icon, name, version, description, Uninstall button
- **D-11:** Three uninstall paths: detail page button, right-click card menu, drag to in-window trash icon
- **D-12:** Trash icon inside App Store window only — do NOT modify Shell Dock area
- **D-13:** "Install from URL": modal dialog with URL input; calls `appRegistry.install(url)`; validation errors shown inline in modal
- **D-14:** After install: refresh list via `appRegistry.getAllApps()`
- **D-15:** Settings: two-column layout (left nav + right content), macOS System Preferences style
- **D-16:** Settings nav items v1: General (theme), Wallpaper, placeholder for future app sections
- **D-17:** Wallpaper: show `public/wallpapers/` presets as thumbnails; on click write `localStorage['vidorra:wallpaper']` and trigger Desktop update
- **D-18:** Theme toggle calls `themeEngine.setMode()` directly (same-domain import); KernelBus push auto-broadcasts
- **D-19:** Calculator theme follows Shell via CSS `prefers-color-scheme` media query (no SDK, no KernelBus)
- **D-20:** Calculator: basic arithmetic with correct operator precedence (`12 + 34 * 5 = 182`)
- **D-21:** Calculator: no `@vidorra/sdk` import, no KernelBus
- **D-22:** Welcome: full-screen centered layout, brand + "Get Started" button
- **D-23:** Welcome "Get Started": (1) set `localStorage['vidorra:welcomed']`, (2) call `app.window.close()`
- **D-24:** Welcome theme follows via `app.theme.onChange()`

### Claude's Discretion

- Internal component decomposition of each app (Context, hooks, etc.)
- Calculator arithmetic engine: safe `eval` wrapper vs. hand-written expression parser
- App Store right-click menu implementation (reuse ContextMenu component vs. custom)
- Welcome: keep as static HTML enhanced with inline script SDK usage vs. rebuild as React Vite project

### Deferred Ideas (OUT OF SCOPE)

- JSON-driven frontend app generator (low-code v2 direction)
- Per-app fine-grained settings (Calculator precision, App Store category filters)
- Shell-level trash icon (global drag-to-uninstall from Dock area)
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| APP-01 | App Store lists installed apps (card layout) and supports "Install from URL" flow with manifest validation | `appRegistry.getAllApps()` returns `AppManifest[]`; `appRegistry.install(url)` fetches + validates + persists; validation errors are thrown as `Error` objects — catch and display inline |
| APP-02 | App Store supports uninstall; uninstalled apps disappear from Dock | `appRegistry.uninstall(id)` removes from Map + re-persists; Dock reads `appRegistry.getAllApps()` on mount — Dock does NOT react to registry changes dynamically (see Pitfall #2 below); uninstall must cause Dock to re-render |
| APP-03 | Settings app provides theme (Light/Dark/Auto) and wallpaper selection (2-3 presets) | `themeEngine.setMode()` is same-domain callable; `useThemeStore` in Shell uses `body.dark` class + themeEngine; wallpaper key is `vidorra:wallpaper`; 3 presets exist: `default.png`, `preset-1.jpg`, `preset-2.jpg` |
| APP-04 | Calculator performs basic arithmetic; zero SDK dependency; macOS-style UI | No `@vidorra/sdk` in package.json; `prefers-color-scheme` for dark mode; operator precedence must be correct |
| APP-05 | Welcome app renders first-launch guidance; "Get Started" closes window + sets `vidorra:welcomed` | Shell's `App.tsx` already sets `vidorra:welcomed = '1'` on launch — Welcome only needs to call `app.window.close()`; the key is already written by Shell before Welcome opens |
</phase_requirements>

---

## Summary

Phase 5 implements four built-in apps on top of a fully operational shell (Phases 0-4 complete). The codebase is in excellent shape: AppRegistry, ThemeEngine, KernelBusHost, SDK, and WindowFrame are all implemented and tested. The apps (`app-store`, `settings`, `calculator`) have stub Vite projects; `calculator` is an empty directory with a `.gitkeep`.

The primary work is UI implementation inside each app, plus three shell-integration tasks: (1) add proxy rules to `packages/shell/vite.config.ts`, (2) configure each app's Vite build to output into `packages/shell/public/apps/xxx/`, and (3) add Settings/Calculator/Welcome entries to `registry/built-in-apps.json`.

A critical non-obvious finding: the Dock reads `appRegistry.getAllApps()` only in a `useEffect([])` — it does not subscribe to registry changes. Uninstalling an app from App Store will not automatically remove it from the Dock until page reload. The plan must address this gap (either App Store calls `useWindowStore` to close the window, or a reactive store/event bridges the two).

**Primary recommendation:** Treat the shell integration tasks (proxy, build output, built-in-apps.json) as Wave 0 scaffolding, then implement each app sequentially. App Store last (most complex).

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | ^18.3.0 | UI framework | Already in all apps (app-store, settings) |
| Vite | ^6.0.0 | Build tool + dev server | Established in all packages |
| TypeScript | ^5.5.0 | Type safety | Strict mode enforced project-wide |
| @vidorra/sdk | workspace:* | Shell communication (ready, window, theme) | Already dep in app-store + settings package.json |
| @vidorra/types | workspace:* | `AppManifest` type | Already dep in app-store + settings |
| @vidorra/kernel | workspace:* | `appRegistry`, `themeEngine` | Direct import in Settings (same-domain) |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| framer-motion | ^12.38.0 | Animation | Already in Shell; use for App Store card hover/transitions if desired |
| zustand | ^5.0.12 | State management | Shell uses it; individual apps can use local useState instead |
| @iconify/react | ^6.0.2 | Icons | Shell devDep; add to app-store if icon set needed |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| CSS Modules | Tailwind / styled-components | CSS Modules is the established pattern in this project |
| Local `useState` | Zustand inside app | Apps are small — useState is simpler; Zustand overkill |
| `prefers-color-scheme` in Calculator | Custom postMessage | prefers-color-scheme is simpler and zero-dependency |

### Installation (Calculator — new package)

```bash
cd D:/Code/Study/vidorra-os/apps/calculator
pnpm init
# Then add to pnpm-workspace.yaml (already handled by 'apps/*' glob)
# Install react + vite dependencies matching other apps
pnpm add react react-dom
pnpm add -D @vitejs/plugin-react vite typescript @types/react @types/react-dom
```

---

## Architecture Patterns

### Recommended Project Structure — App Store

```
apps/app-store/src/
├── main.tsx                   # createApp() + app.ready() + mount
├── App.tsx                    # Root: SDK theme provider + routing state
├── components/
│   ├── AppGrid.tsx            # Card grid layout
│   ├── AppCard.tsx            # Single card + right-click menu
│   ├── AppDetail.tsx          # Detail page (in-page navigation)
│   ├── InstallModal.tsx       # URL install dialog
│   └── TrashZone.tsx          # Drag-to-uninstall drop target (bottom of window)
└── hooks/
    └── useAppRegistry.ts      # Wrapper: getAllApps() with local state refresh
```

### Recommended Project Structure — Settings

```
apps/settings/src/
├── main.tsx                   # createApp() + app.ready() + mount
├── App.tsx                    # Root: theme sync + two-column layout
├── components/
│   ├── Sidebar.tsx            # Left nav list
│   ├── panels/
│   │   ├── GeneralPanel.tsx   # Theme Light/Dark/Auto selector
│   │   └── WallpaperPanel.tsx # Preset thumbnails grid
└── hooks/
    └── useTheme.ts            # Wraps themeEngine + SDK theme sync
```

### Recommended Project Structure — Calculator

```
apps/calculator/src/
├── main.tsx                   # createRoot only (no SDK)
├── App.tsx                    # Full calculator UI
├── hooks/
│   └── useCalculator.ts      # Expression state + evaluation logic
└── styles/
    └── calculator.module.css  # macOS-style dark/light via prefers-color-scheme
```

### Recommended Project Structure — Welcome

```
packages/shell/public/apps/welcome/
└── index.html                 # Replace placeholder; inline <script type="module">
                               # import createApp from CDN or use inline SDK calls
```

**OR** (if Welcome becomes a React project):

```
apps/welcome/src/
├── main.tsx                   # createApp() + app.ready()
└── App.tsx                    # Centered UI + "Get Started" button
```

### Pattern 1: App SDK Initialization (App Store, Settings, Welcome)

```typescript
// Source: packages/sdk/src/index.ts (verified)
import { createApp } from '@vidorra/sdk'

const app = createApp()

async function main() {
  await app.ready()

  // Get initial theme
  const mode = await app.theme.get()
  applyTheme(mode)

  // Subscribe to future changes pushed by Shell
  app.theme.onChange((newMode) => {
    applyTheme(newMode)
  })
}

main()
```

### Pattern 2: Theme Application in iframe App

The Shell uses `body.dark` class + CSS variables (`--color-bg`, `--color-text`, etc.). iframe apps are sandboxed and do not inherit Shell CSS. Each app must define its own CSS variables and apply them when the theme changes:

```typescript
// Source: packages/shell/src/global.css (verified — these are the variables to mirror)
function applyTheme(mode: 'light' | 'dark') {
  document.body.classList.toggle('dark', mode === 'dark')
}
```

```css
/* In app's CSS — mirror the shell variable names for consistency */
body {
  --color-bg: rgba(255, 255, 255, 0.8);
  --color-text: rgba(0, 0, 0, 0.85);
}
body.dark {
  --color-bg: rgba(30, 30, 30, 0.85);
  --color-text: rgba(255, 255, 255, 0.9);
}
```

### Pattern 3: Calling themeEngine from Settings (same-domain)

Settings runs at `/apps/settings/index.html` which is served by the same Vite dev server (port 3000 via proxy). This means it shares the same origin and can import `@vidorra/kernel` directly:

```typescript
// Source: packages/kernel/src/index.ts + theme-engine.ts (verified)
import { themeEngine } from '@vidorra/kernel'

// Calling this automatically:
// 1. Injects CSS vars onto Shell :root
// 2. Calls notify() → all themeEngine subscribers get the callback
// 3. KernelBusHost subscribed via themeEngine.subscribe() → pushes theme.changed to all trusted iframes
themeEngine.setMode('dark')
```

**Important:** `useThemeStore.setTheme()` in Shell also calls `themeEngine.setMode()`. Settings should call `themeEngine.setMode()` directly (not `useThemeStore`) since Settings is an iframe and cannot import Zustand stores from the shell. The KernelBus push will still fire because KernelBusHost is subscribed to `themeEngine.subscribe()`.

**Limitation found:** `useThemeStore` state in Shell will be out of sync if Settings calls `themeEngine.setMode()` directly. The ActionCenter toggle will not reflect the new mode. To fix: Settings could also send a custom postMessage to Shell, OR Shell's main.tsx could subscribe to `themeEngine.subscribe()` to keep `useThemeStore` in sync.

### Pattern 4: Wallpaper Update from Settings

Desktop.tsx reads `localStorage['vidorra:wallpaper']` only in `useEffect([])` — it does not listen for storage events. Settings can write `localStorage['vidorra:wallpaper']` but Desktop will not update until reload.

**Gap:** A storage event listener is needed in Desktop.tsx, OR Settings uses `window.parent.postMessage` with a custom `wallpaper.set` message, OR Desktop polls storage.

Recommended approach: add a `window.addEventListener('storage', ...)` listener in `Desktop.tsx` to react to the `vidorra:wallpaper` key change. This is a `packages/shell` change, not a `packages/kernel` change.

### Pattern 5: AppRegistry-to-Dock Reactivity

Dock.tsx reads `appRegistry.getAllApps()` in `useEffect([])`. It does NOT re-read on registry changes. After App Store uninstalls an app:
- The app's window (if open) should be closed
- The Dock should not show the uninstalled app

**Gap:** `appRegistry` has no event/subscriber system. The plan must either:
1. Add a subscriber mechanism to AppRegistry (risky — touches completed kernel code)
2. Have App Store trigger a page-level event that Dock can listen to
3. (Simpler) The Dock re-reads the registry whenever a window is closed or the page receives a custom event

Recommended: use `window.dispatchEvent(new CustomEvent('vidorra:registry-changed'))` from inside the App Store iframe via a new `registry.changed` KernelBus push, OR add a `storage` event approach since `appRegistry.persist()` writes to `localStorage['vidorra:registry']`. Dock.tsx can add a `storage` event listener for that key.

**The storage event approach is cleanest:** When `appRegistry.persist()` writes to localStorage, other frames on the same origin receive a `storage` event. Dock can listen:
```typescript
useEffect(() => {
  const handler = () => setApps(appRegistry.getAllApps())
  window.addEventListener('storage', handler)
  return () => window.removeEventListener('storage', handler)
}, [])
```
This requires no changes to kernel code.

### Pattern 6: Vite Proxy for Dev

```typescript
// Add to packages/shell/vite.config.ts server.proxy section:
// Source: D-02 decision (verified against current vite.config.ts which has no proxy yet)
proxy: {
  '/apps/app-store': {
    target: 'http://localhost:3010',
    changeOrigin: true,
    rewrite: (path) => path.replace(/^\/apps\/app-store/, ''),
  },
  '/apps/settings': {
    target: 'http://localhost:3011',
    changeOrigin: true,
    rewrite: (path) => path.replace(/^\/apps\/settings/, ''),
  },
  '/apps/calculator': {
    target: 'http://localhost:3012',
    changeOrigin: true,
    rewrite: (path) => path.replace(/^\/apps\/calculator/, ''),
  },
},
```

### Pattern 7: Vite Build Output to Shell Public

```typescript
// In each app's vite.config.ts — add build.outDir:
// Source: D-03 decision (verified — current configs have no build.outDir)
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: { port: 3010 }, // existing
  build: {
    outDir: '../../packages/shell/public/apps/app-store',
    emptyOutDir: true,
  },
})
```

### Pattern 8: Calculator Arithmetic Engine

The simplest correct implementation for `12 + 34 * 5 = 182` is a two-pass evaluator or using the standard approach:

**Option A: Safe Function wrapper (discretion item)**
```typescript
function evaluate(expr: string): number {
  // Validate: only digits, operators, parens, decimals, spaces
  if (!/^[\d\s+\-*/().]+$/.test(expr)) throw new Error('Invalid expression')
  // eslint-disable-next-line no-new-func
  return Function('"use strict"; return (' + expr + ')')() as number
}
```

**Option B: Shunting-yard parser (recommended — no eval risk)**
Standard algorithm: tokenize → output queue → evaluate with operator precedence. ~60 lines of TypeScript. Guarantees correct precedence without `eval`.

For this project, Option B is recommended since Calculator is a showcase app. Option A is acceptable if code clarity is prioritized.

### Anti-Patterns to Avoid

- **Importing `@vidorra/kernel` in Calculator:** Calculator must be zero-dependency. No kernel import.
- **Importing Zustand stores from Shell into app iframes:** iframes are separate JS contexts; store references don't cross iframe boundaries. Use SDK or direct kernel imports (for same-domain apps only).
- **Calling `localStorage.setItem('vidorra:welcomed', ...)` in Welcome:** Shell's `App.tsx` already sets this key before opening the Welcome window. Welcome only needs to call `app.window.close()`. Setting the key again is harmless but redundant.
- **Using `window.location.href` or React Router for App Store detail navigation:** in-page navigation means using React state (`const [view, setView] = useState<'grid' | 'detail'>('grid')`), not URL routing. The app runs in an iframe at a fixed URL.
- **Building the Vite proxy rewrite incorrectly:** the rewrite must strip the prefix so the target dev server receives paths it understands (e.g., `/index.html`, not `/apps/app-store/index.html`).

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Drag-and-drop for trash | Custom mouse events | HTML5 Drag and Drop API (`draggable`, `dragover`, `drop` events) | Built into browsers; handles edge cases |
| Right-click context menu | Custom event system | Reuse existing `ContextMenu` component from `packages/shell/src/components/ContextMenu/` | Already styled, portal-based, keyboard accessible |
| Theme CSS variable propagation | Custom postMessage | `themeEngine.subscribe()` → KernelBusHost already pushes `theme.changed` to all trusted iframes | Entire push system already works (Phase 3) |
| Manifest validation | Custom JSON schema | `appRegistry.install(url)` already validates required fields and throws descriptive errors | Already tested in Phase 1 |
| Modal/dialog | Custom overlay | Native `<dialog>` element with `showModal()` or simple CSS `position: fixed` div with backdrop | Simple enough; no library needed |
| Icon rendering | Base64 inline SVG | `<img src={app.icon} />` using existing paths from AppManifest | Icons already in `packages/shell/public/app-icons/` |

**Key insight:** The hardest parts of this phase (KernelBus, AppRegistry CRUD, ThemeEngine, WindowFrame iframe sandboxing) are all done. Phase 5 is almost entirely UI work against stable APIs.

---

## Common Pitfalls

### Pitfall 1: iframe sandbox attribute blocks `@vidorra/sdk`

**What goes wrong:** `WindowFrame.tsx` uses `sandbox="allow-scripts allow-same-origin"`. The `allow-same-origin` flag is already present, which means the SDK's `window.parent.postMessage()` works. However, if `allow-forms` or `allow-popups` are missing, modal dialogs using `showModal()` may fail silently.
**Why it happens:** The sandbox attribute is restrictive by default.
**How to avoid:** Use a CSS + React state approach for the Install modal (not `<dialog>.showModal()`). Alternatively add `allow-forms` to the sandbox in WindowFrame — but this is a Shell change.
**Warning signs:** Modal appears but input focus is broken, or form submission silently fails.

### Pitfall 2: Dock not reactive to AppRegistry changes

**What goes wrong:** After App Store calls `appRegistry.uninstall(id)`, the Dock still shows the app until page reload.
**Why it happens:** `Dock.tsx` reads `appRegistry.getAllApps()` in `useEffect([])` with no dependencies — it never re-reads.
**How to avoid:** Add a `storage` event listener in Dock.tsx for the `vidorra:registry` key. When `appRegistry.persist()` writes to localStorage, the storage event fires (same-origin, different frame counts as "different document" in some browsers — verify). Alternatively, App Store can emit a `CustomEvent` on `window.parent` after uninstall.
**Warning signs:** App uninstalled in App Store still appears in Dock.

### Pitfall 3: Settings themeEngine call doesn't sync useThemeStore

**What goes wrong:** Settings calls `themeEngine.setMode('dark')`. Shell CSS variables update correctly and KernelBus pushes to all iframes. But `useThemeStore.theme` in Shell React tree remains stale — the ActionCenter toggle still shows the wrong state.
**Why it happens:** `useThemeStore` is independent Zustand state; only `useThemeStore.setTheme()` updates it, but Settings calls `themeEngine.setMode()` directly.
**How to avoid:** In `packages/shell/src/main.tsx`, subscribe to `themeEngine` and sync `useThemeStore`:
```typescript
themeEngine.subscribe((mode) => {
  useThemeStore.setState({ theme: mode === 'auto' ? themeEngine.getResolvedMode() : mode })
})
```
This is a small Shell change in the scaffolding wave.
**Warning signs:** ActionCenter moon icon doesn't update when Settings changes theme.

### Pitfall 4: Wallpaper changes in Settings not reflected in Desktop

**What goes wrong:** Settings writes `localStorage['vidorra:wallpaper']` but Desktop.tsx reads it only in `useEffect([])` — no live updates.
**Why it happens:** No storage event listener in Desktop.tsx.
**How to avoid:** Add to Desktop.tsx:
```typescript
useEffect(() => {
  const handler = (e: StorageEvent) => {
    if (e.key === 'vidorra:wallpaper' && e.newValue) setWallpaperUrl(e.newValue)
  }
  window.addEventListener('storage', handler)
  return () => window.removeEventListener('storage', handler)
}, [])
```
Note: `StorageEvent` fires when another document writes to storage. Since Settings is an iframe in the same origin, this should work.
**Warning signs:** Wallpaper doesn't update after clicking preset in Settings until refresh.

### Pitfall 5: Calculator build output collision with Welcome static file

**What goes wrong:** `packages/shell/public/apps/` contains both static files (`welcome/index.html`) and Vite build outputs (`app-store/`, `settings/`, `calculator/`). Running `pnpm build` may delete the `welcome/` directory if one of the build configs uses `emptyOutDir: true` on the wrong path.
**Why it happens:** `emptyOutDir: true` in Vite deletes the entire output directory before building.
**How to avoid:** Each app's `outDir` points to its own specific subdirectory (`/apps/app-store`, `/apps/settings`, `/apps/calculator`). Welcome is at `/apps/welcome` and is not touched by any build. Verify `outDir` is exact, not the parent `/apps/` directory.

### Pitfall 6: App Store Dock reactivity — window not closed after uninstall

**What goes wrong:** An app is uninstalled but its window is still open. The window continues running even though the app is removed from the registry.
**Why it happens:** `appRegistry.uninstall()` only removes from localStorage. It doesn't interact with `useWindowStore`.
**How to avoid:** After calling `appRegistry.uninstall(id)`, App Store should also call the SDK's `app.window.*` — but App Store cannot close OTHER windows. This requires a Shell-side mechanism. Options:
1. Have App Store emit a custom KernelBus message (not in current API — requires extending kernel)
2. App Store uses a `window.parent.postMessage` with a custom payload that Shell's `App.tsx` handles
3. The Dock storage event listener re-reads registry, and if a window's `appId` is no longer in the registry, Shell closes it

Recommended: use the storage event in Dock + add a check in Dock that closes windows for unregistered apps. Or scope this to: "uninstall only works when app is not running" (show error/disable if app window is open).

### Pitfall 7: Welcome app — SDK call blocked in static HTML

**What goes wrong:** Welcome is currently a static HTML file. The SDK (`@vidorra/sdk`) is an ESM module in the workspace. A static HTML file cannot import it via a relative path from `public/apps/welcome/index.html` unless the SDK is published to a CDN or built separately.
**Why it happens:** `@vidorra/sdk` is a workspace package; `public/` files are not processed by Vite.
**How to avoid:** Two options:
1. Build Welcome as a React Vite project (add `apps/welcome/`) — cleanest but more work
2. Inline the SDK functionality in a `<script type="module">` — KernelBusClient is ~80 lines; can be inlined or load from `/packages/sdk/dist/index.js` if built
3. Use the Vite build output: build Welcome as React and output to `packages/shell/public/apps/welcome/`

The discretion decision in CONTEXT.md defers this choice to the implementor. Recommendation: build Welcome as a React Vite project (add `apps/welcome/`) for consistency and proper SDK access. This matches the pattern of all other apps.

---

## Code Examples

Verified patterns from official project source:

### Initializing an app with SDK

```typescript
// Pattern from packages/sdk/src/index.ts (verified)
import { createApp } from '@vidorra/sdk'

const app = createApp()

async function main() {
  await app.ready() // Marks iframe as trusted by Shell
  const mode = await app.theme.get()
  document.body.classList.toggle('dark', mode === 'dark')
  app.theme.onChange((m) => document.body.classList.toggle('dark', m === 'dark'))
}

main()
```

### Listing and installing apps (App Store)

```typescript
// Pattern from packages/kernel/src/app-registry.ts (verified)
import { appRegistry } from '@vidorra/kernel'
import type { AppManifest } from '@vidorra/types'

// List
const apps: AppManifest[] = appRegistry.getAllApps()

// Install from URL
try {
  await appRegistry.install('https://example.com/app/manifest.json')
  // Throws if: fetch fails, JSON invalid, required fields missing, defaultSize malformed
  const updated = appRegistry.getAllApps() // refresh
} catch (err) {
  // err.message is descriptive: "Invalid manifest: missing entry"
  setError((err as Error).message)
}

// Uninstall
await appRegistry.uninstall('some-app-id')
```

### Theme switching in Settings (same-domain import)

```typescript
// Pattern from packages/kernel/src/theme-engine.ts (verified)
import { themeEngine } from '@vidorra/kernel'
import type { ThemeMode } from '@vidorra/kernel'

// All three modes are valid
themeEngine.setMode('dark')   // → CSS vars updated, KernelBus push fires
themeEngine.setMode('light')
themeEngine.setMode('auto')   // → follows prefers-color-scheme
```

### AppManifest shape for built-in-apps.json

```json
// Pattern from registry/built-in-apps.json + packages/types/src/manifest.ts (verified)
{
  "id": "settings",
  "name": "Settings",
  "version": "1.0.0",
  "entry": "/apps/settings/index.html",
  "icon": "/app-icons/settings.svg",
  "category": "system",
  "defaultSize": { "width": 700, "height": 500 },
  "minSize": { "width": 400, "height": 300 },
  "permissions": [],
  "menubar": {
    "Settings": [{ "label": "About Settings", "action": "about" }]
  }
}
```

### Drag and drop trash zone (HTML5 API)

```tsx
// Standard HTML5 DnD — no library needed
function TrashZone({ onDrop }: { onDrop: (appId: string) => void }) {
  const [isOver, setIsOver] = useState(false)
  return (
    <div
      className={`trash-zone ${isOver ? 'trash-zone--active' : ''}`}
      onDragOver={(e) => { e.preventDefault(); setIsOver(true) }}
      onDragLeave={() => setIsOver(false)}
      onDrop={(e) => {
        e.preventDefault()
        setIsOver(false)
        const appId = e.dataTransfer.getData('text/plain')
        if (appId) onDrop(appId)
      }}
    >
      Trash
    </div>
  )
}

// On each AppCard:
<div
  draggable
  onDragStart={(e) => e.dataTransfer.setData('text/plain', app.id)}
>
  ...
</div>
```

### Storage event for Dock reactivity

```typescript
// To add to Dock.tsx (packages/shell)
useEffect(() => {
  const refresh = () => setApps(appRegistry.getAllApps())
  window.addEventListener('storage', refresh)
  return () => window.removeEventListener('storage', refresh)
}, [])
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Single HTML file apps | Vite+React projects in pnpm workspace | Phase 0 | All apps get TypeScript + hot reload |
| Global CSS | CSS Modules + HSL CSS variables | Phase 2 | iframe apps need to define their own token sets |
| Direct DOM manipulation for theme | ThemeEngine + KernelBus push | Phases 1+3 | iframe apps get theme changes via SDK `theme.onChange()` |

**Deprecated in this project:**
- `packages/shell/public/apps/app-store/index.html` — the static placeholder HTML; will be replaced by Vite build output from `apps/app-store/`
- `packages/shell/public/apps/welcome/index.html` — Phase 2 placeholder; replaced by proper React build output

---

## Open Questions

1. **Welcome app: static HTML vs. React project**
   - What we know: Current Welcome is a static HTML placeholder without SDK. `app.window.close()` requires SDK. SDK is an ESM workspace package not accessible from `public/` files.
   - What's unclear: Whether to add `apps/welcome/` as a new Vite project or inline SDK as a `<script>`.
   - Recommendation: Add `apps/welcome/` as a React+Vite project (port :3013), output to `packages/shell/public/apps/welcome/`. Adds ~15 min of scaffolding but is cleaner and consistent.

2. **Dock reactivity: storage event reliability**
   - What we know: `StorageEvent` fires on other documents in the same origin when localStorage is written. The App Store iframe is a different document on the same origin.
   - What's unclear: Whether the Shell's main document (Dock is rendered here) receives `StorageEvent` when the App Store **iframe** writes to localStorage. Per the Web Storage spec, `StorageEvent` fires on all other browsing contexts — including the parent.
   - Recommendation: Test this pattern. If storage events don't propagate as expected, fall back to a custom KernelBus push message for registry changes.

3. **useThemeStore sync with themeEngine**
   - What we know: Settings calls `themeEngine.setMode()` directly; `useThemeStore` is not synced.
   - What's unclear: Whether ActionCenter visual desync matters for Phase 5 (it's a polish issue, not a correctness issue for APP-03).
   - Recommendation: Add the `themeEngine.subscribe()` → `useThemeStore.setState()` bridge in `main.tsx` as a Shell scaffolding task in Wave 0.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js + pnpm | All build/dev | Verified (project runs) | pnpm workspace active | — |
| Vite 6 | All apps dev + build | Verified in package.json | ^6.0.0 | — |
| React 18 | All apps | Verified in app-store/settings | ^18.3.0 | — |
| @vidorra/sdk | app-store, settings, welcome | Verified (workspace:*) | Phase 4 complete | — |
| @vidorra/kernel | settings (direct import) | Verified (workspace:*) | Phase 1 complete | — |
| Wallpaper files | Settings app | Verified at `packages/shell/public/wallpapers/` | 3 files: default.png, preset-1.jpg, preset-2.jpg | — |
| App icons | built-in-apps.json entries | Partially — `app-store.svg`, `appstore-256.png` exist; `settings.svg`, `calculator.svg`, `welcome.svg` do NOT exist | — | Use emoji or simple SVG placeholders |

**Missing dependencies with fallback:**
- `settings.svg`, `calculator.svg`, `welcome.svg` icon files — use inline SVG or emoji character as placeholder icons in built-in-apps.json

---

## Validation Architecture

Nyquist validation is enabled (config.json: `nyquist_validation_enabled: true`).

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest ^3.0.0 (root) / Vitest ^2.1.9 (shell) |
| Config file | `packages/kernel/vitest.config.ts` (happy-dom env); `vitest.config.ts` (root, node env) |
| Quick run command | `pnpm --filter @vidorra/kernel run test` |
| Full suite command | `pnpm test` (runs kernel + bus + sdk) |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| APP-01 | App Store lists apps + install from URL with validation | Integration (manual smoke) | `pnpm --filter @vidorra/kernel run test` (tests appRegistry.install validation) | Partial — kernel tests cover install; no App Store UI test |
| APP-02 | Uninstall removes from registry | Unit (kernel already tested) | `pnpm --filter @vidorra/kernel run test` | Yes — `app-registry.test.ts` covers uninstall |
| APP-03 | Settings theme switch updates CSS vars | Manual smoke (CSS mutation) | N/A — CSS variable inspection is manual | ❌ No automated test for Settings UI |
| APP-04 | Calculator: `12 + 34 * 5 = 182` | Unit | `pnpm --filter @vidorra/calculator run test` | ❌ No calculator test (app not scaffolded yet) |
| APP-05 | Welcome: Get Started closes window + sets key | Manual smoke | N/A — requires live Shell | ❌ No automated test |

### Sampling Rate

- **Per task commit:** `pnpm --filter @vidorra/kernel run test` (existing registry/theme tests, <5s)
- **Per wave merge:** `pnpm test` (full suite)
- **Phase gate:** Full suite green + manual smoke: open each app, verify APP-01 through APP-05 success criteria

### Wave 0 Gaps

- [ ] `apps/calculator/src/hooks/useCalculator.test.ts` — covers APP-04 arithmetic correctness (`12 + 34 * 5 = 182`, operator precedence, edge cases)
- [ ] Calculator needs a `vitest.config.ts` (happy-dom environment)
- [ ] No new kernel tests needed (AppRegistry uninstall already tested)

*(All other existing tests pass through; only Calculator needs a new test file)*

---

## Project Constraints (from CLAUDE.md)

No project-level `CLAUDE.md` found in `D:/Code/Study/vidorra-os/`. Global CLAUDE.md contains only user identity info (name: ROYIANS, email: royians@vidorra.life). No project-specific coding constraints from CLAUDE.md.

Established project conventions (from codebase inspection):
- **TypeScript strict mode** — no `any`, all types explicit
- **CSS Modules** — all component styles in `ComponentName.module.css`
- **Named exports** — no default exports for components (App.tsx is the exception for Vite entry convention)
- **pnpm workspace** — all cross-package refs use `workspace:*`
- **No Turborepo** — plain pnpm scripts, no orchestration layer
- **Framer Motion** — for animations (Shell already depends on it; apps can add it if needed)

---

## Sources

### Primary (HIGH confidence)

- Direct codebase inspection: `packages/kernel/src/app-registry.ts` — `install()`, `uninstall()`, `getAllApps()`, `registerLocal()` signatures verified
- Direct codebase inspection: `packages/kernel/src/theme-engine.ts` — `setMode()`, `subscribe()`, `getResolvedMode()` verified
- Direct codebase inspection: `packages/sdk/src/index.ts` — `createApp()`, `VidorraApp` interface verified
- Direct codebase inspection: `packages/bus/src/client.ts` — KernelBusClient push/RPC pattern verified
- Direct codebase inspection: `packages/kernel/src/kernel-bus-host.ts` — `themeEngine.subscribe()` → KernelBus push pipeline verified
- Direct codebase inspection: `packages/shell/src/App.tsx` — Welcome auto-open + `vidorra:welcomed` key handling verified
- Direct codebase inspection: `packages/shell/src/stores/useThemeStore.ts` — independent Zustand store, desync risk confirmed
- Direct codebase inspection: `packages/shell/src/components/Desktop/Desktop.tsx` — `useEffect([])` only, storage event gap confirmed
- Direct codebase inspection: `packages/shell/src/components/Dock/Dock.tsx` — `useEffect([])` only, registry reactivity gap confirmed
- Direct codebase inspection: `registry/built-in-apps.json` — only App Store entry exists, Settings/Calculator/Welcome must be added
- Direct codebase inspection: `packages/shell/public/wallpapers/` — 3 preset files confirmed
- Direct codebase inspection: `packages/shell/public/app-icons/` — missing settings.svg, calculator.svg, welcome.svg confirmed

### Secondary (MEDIUM confidence)

- HTML5 Drag and Drop API — standard browser API, well-established; no external verification needed
- Web Storage `StorageEvent` cross-frame propagation — per MDN spec (same-origin, different browsing contexts); verify with live test

### Tertiary (LOW confidence)

- None — all findings are from direct codebase inspection or well-established web APIs

---

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH — all libraries verified in existing package.json files
- Architecture: HIGH — patterns derived from existing working code
- Pitfalls: HIGH — identified from direct code reading of Dock.tsx, Desktop.tsx, useThemeStore.ts
- Integration gaps: HIGH — confirmed by reading actual implementation, not inferred

**Research date:** 2026-04-03
**Valid until:** 2026-05-03 (stable codebase; only changes if Phase 5 execution modifies shell files)
