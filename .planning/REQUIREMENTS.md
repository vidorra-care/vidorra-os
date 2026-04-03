# Requirements: Vidorra OS

**Defined:** 2026-04-01
**Core Value:** Any web app can run as a first-class citizen inside a macOS-style desktop OS in the browser, with a single SDK call.

## v1 Requirements

### Scaffolding

- [x] **SCAF-01**: pnpm workspace with packages (kernel, shell, sdk, types) and apps (app-store, settings, calculator) initializes with `pnpm install`
- [x] **SCAF-02**: `pnpm --filter @vidorra/shell dev` starts the shell blank page in the browser
- [x] **SCAF-03**: ESLint, Prettier, TypeScript strict mode, and Vitest are configured at root and inherited by all packages

### Kernel

- [x] **KERN-01**: `appRegistry.install(url)` fetches a remote `manifest.json`, validates required fields, and persists to `localStorage['vidorra:registry']`
- [x] **KERN-02**: `appRegistry.uninstall(id)` removes the app and updates localStorage
- [x] **KERN-03**: `appRegistry.getAllApps()` returns all installed apps
- [x] **KERN-04**: `themeEngine.setMode('dark' | 'light' | 'auto')` injects CSS variables onto `:root` and notifies all subscribers
- [x] **KERN-05**: `themeEngine.subscribe(cb)` returns an unsubscribe function; `auto` mode responds to `prefers-color-scheme` media query

### Shell

- [ ] **SHELL-01**: Multiple windows can be open simultaneously; each is independently draggable and resizable via `react-rnd`
- [ ] **SHELL-02**: Window minimize/maximize/close buttons work; maximize fills viewport minus Menubar height; Dock remains visible
- [ ] **SHELL-03**: Clicking any window raises it to the front (z-index management via `useWindowStore`)
- [ ] **SHELL-04**: Dock shows all installed apps; hovering triggers Framer Motion magnification (base 48px → 80px); running apps show a white dot indicator
- [ ] **SHELL-05**: Dock right-click menu has 3 contextual items (Open / Hide from Dock / Close) depending on running state
- [ ] **SHELL-06**: Menubar shows focused app name and its `manifest.menubar` items on the left; `HH:mm` clock on the right; no focused app → "Vidorra OS"
- [ ] **SHELL-07**: Desktop renders a wallpaper image; default fallback is a macOS-style landscape; user can set `localStorage['vidorra:wallpaper']`
- [x] **SHELL-08**: Welcome window opens automatically on first launch; once `localStorage['vidorra:welcomed']` is set it never auto-opens again

### Bridge (KernelBus)

- [x] **BUS-01**: Shell-side `KernelBusHost` only processes messages from registered iframe `contentWindow` references; unknown origins are dropped
- [x] **BUS-02**: App iframes can call `window.setTitle`, `window.close`, `window.minimize`, `window.maximize`, `window.resize`, `theme.get` via postMessage RPC
- [x] **BUS-03**: Each request includes a `requestId`; Shell sends a response message with matching `requestId`
- [x] **BUS-04**: Client-side request times out after 5 seconds with a rejected Promise

### SDK

- [x] **SDK-01**: `import { createApp } from '@vidorra/sdk'` works in a plain HTML/JS app (no build tool required)
- [x] **SDK-02**: `app.ready()` sends the `app.ready` signal to Shell (marks iframe as trusted)
- [x] **SDK-03**: `app.window.*` and `app.theme.*` APIs map to KernelBus methods with Promise return values
- [x] **SDK-04**: Published ESM bundle is ≤ 8 KB gzip; full TypeScript type definitions included

### Built-in Apps

- [ ] **APP-01**: App Store lists installed apps (card layout) and supports "Install from URL" flow with manifest validation
- [ ] **APP-02**: App Store supports uninstall; uninstalled apps disappear from Dock
- [ ] **APP-03**: Settings app provides theme (Light/Dark/Auto) and wallpaper selection (2–3 presets)
- [x] **APP-04**: Calculator performs basic arithmetic; zero SDK dependency; macOS-style UI
- [x] **APP-05**: Welcome app renders first-launch guidance; "Get Started" button closes window and sets `vidorra:welcomed`

### Quality

- [ ] **QUAL-01**: 5 simultaneous windows — drag, resize, z-order, and minimize/restore all correct
- [ ] **QUAL-02**: Dock magnification and window animations maintain 60 fps (Chrome DevTools Performance)
- [ ] **QUAL-03**: Shell production bundle loads in < 2 s on localhost; SDK bundle ≤ 8 KB gzip

## v2 Requirements (Deferred)

### DataStore
- **DS-01**: Cross-app structured data storage (replaces per-app localStorage)
- **DS-02**: Permission guard — apps must declare required data namespaces in manifest

### Spotlight
- **SPOT-01**: Global search overlay (⌘Space) — searches app names and spotlight actions

### Notifications
- **NOTF-01**: Apps can send notifications via SDK; Shell renders them as macOS-style banners

### Advanced Shell
- **ASHELL-01**: Dock icon drag-to-reorder
- **ASHELL-02**: Genie minimize effect (WebGPU + WGSL)
- **ASHELL-03**: Mission Control overview (⌃↑)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Server-side rendering | Shell is fully client-side; no SSR needed for v1 |
| OAuth / user accounts | No backend for v1; all data is localStorage-based |
| Real-time sync | No server; deferred to v2 Self-Hosted Server phase |
| Mobile app | Web-first; responsive design is stretch goal |
| VFS (Virtual File System) | P2 feature; too complex for MVP |
| AI Buddy | P3 feature |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| SCAF-01 | Phase 0 | Complete |
| SCAF-02 | Phase 0 | Complete |
| SCAF-03 | Phase 0 | Complete |
| KERN-01 | Phase 1 | Complete |
| KERN-02 | Phase 1 | Complete |
| KERN-03 | Phase 1 | Complete |
| KERN-04 | Phase 1 | Complete |
| KERN-05 | Phase 1 | Complete |
| SHELL-01 | Phase 2 | Pending |
| SHELL-02 | Phase 2 | Pending |
| SHELL-03 | Phase 2 | Pending |
| SHELL-04 | Phase 2 | Pending |
| SHELL-05 | Phase 2 | Pending |
| SHELL-06 | Phase 2 | Pending |
| SHELL-07 | Phase 2 | Pending |
| SHELL-08 | Phase 2 | Complete |
| BUS-01 | Phase 3 | Complete |
| BUS-02 | Phase 3 | Complete |
| BUS-03 | Phase 3 | Complete |
| BUS-04 | Phase 3 | Complete |
| SDK-01 | Phase 4 | Complete |
| SDK-02 | Phase 4 | Complete |
| SDK-03 | Phase 4 | Complete |
| SDK-04 | Phase 4 | Complete |
| APP-01 | Phase 5 | Pending |
| APP-02 | Phase 5 | Pending |
| APP-03 | Phase 5 | Complete |
| APP-04 | Phase 5 | Complete |
| APP-05 | Phase 5 | Complete |
| QUAL-01 | Phase 6 | Pending |
| QUAL-02 | Phase 6 | Pending |
| QUAL-03 | Phase 6 | Pending |

**Coverage:**
- v1 requirements: 31 total
- Mapped to phases: 31
- Unmapped: 0 ✓

---
*Requirements defined: 2026-04-01*
*Last updated: 2026-04-01 after initial definition*
