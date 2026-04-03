# Roadmap: Vidorra OS

## Overview

Vidorra OS is a browser-based macOS-style Web Desktop OS with a framework-agnostic iframe sandbox and a structured cross-app data layer. The MVP delivers a complete shell experience (Dock, Menubar, WindowManager), iframe communication (KernelBus), and a developer SDK, enabling any web app to run as a first-class OS application.

## Phases

- [x] **Phase 0: Scaffolding** - Monorepo skeleton, toolchain, all packages/apps wired up
- [x] **Phase 1: Kernel** - AppRegistry + ThemeEngine — core logic without UI
- [x] **Phase 2: Shell** - WindowManager + Dock + Menubar + Desktop — visual shell
- [x] **Phase 3: KernelBus (Bridge)** - postMessage RPC between Shell and sandboxed App iframes (completed 2026-04-02)
- [x] **Phase 4: SDK v0.1** - Developer-facing API (`createApp`, window/theme APIs) (completed 2026-04-03)
- [ ] **Phase 5: Built-in Apps** - App Store, Settings, Calculator, Welcome
- [ ] **Phase 6: Integration & Polish** - E2E testing, animation tuning, final MVP verification

## Phase Details

### Phase 0: Scaffolding
**Goal**: Monorepo skeleton with pnpm workspaces, TypeScript strict mode, Vite for shell/apps, ESLint + Prettier configured; `pnpm dev` starts the shell blank page.
**Depends on**: Nothing
**Requirements**: SCAF-01, SCAF-02, SCAF-03
**Success Criteria** (what must be TRUE):
  1. `pnpm install` succeeds with no errors
  2. `pnpm --filter @vidorra/shell dev` starts a blank page in the browser
  3. All packages (`kernel`, `shell`, `sdk`, `types`) and apps (`app-store`, `settings`, `calculator`) exist with valid `package.json`
  4. `pnpm build` completes without errors
**Plans**: TBD

Plans:
- [x] 00-01: Initialize pnpm workspace and root config
- [x] 00-02: Create package stubs (kernel, shell, sdk, types, apps)
- [x] 00-03: Configure Vite, ESLint, Prettier, Vitest

### Phase 1: Kernel
**Goal**: `AppRegistry` (install/uninstall apps via manifest URL, persist to localStorage) and `ThemeEngine` (CSS variable injection, light/dark/auto modes, subscriber notifications) both fully tested.
**Depends on**: Phase 0
**Requirements**: KERN-01, KERN-02, KERN-03, KERN-04, KERN-05
**Success Criteria** (what must be TRUE):
  1. `appRegistry.install(url)` fetches, validates, and persists a manifest
  2. `themeEngine.setMode('dark')` updates CSS variables on `:root` and notifies subscribers
  3. All Vitest tests pass (`pnpm test`)
  4. `@vidorra/kernel` exports `appRegistry` and `themeEngine` singletons with TypeScript types
**Plans**: TBD

Plans:
- [x] 01-01: Implement AppRegistry with localStorage persistence
- [x] 01-02: Implement ThemeEngine with CSS variable injection
- [x] 01-03: Write Vitest unit tests for both modules

### Phase 2: Shell
**Goal**: Visible desktop with WindowManager (drag/resize/minimize/maximize/close/focus), Dock (magnification, running indicator, right-click menu), Menubar (app name + clock), and Desktop (wallpaper). First-launch Welcome window auto-opens.
**Depends on**: Phase 1
**Requirements**: SHELL-01, SHELL-02, SHELL-03, SHELL-04, SHELL-05, SHELL-06, SHELL-07, SHELL-08
**Success Criteria** (what must be TRUE):
  1. Multiple windows can be opened, dragged, resized, minimized, maximized, and closed simultaneously
  2. Dock shows installed apps with magnification on hover and a running dot when app is open
  3. Menubar shows focused app name on the left and `HH:mm` clock on the right
  4. Desktop renders wallpaper from `localStorage['vidorra:wallpaper']` with fallback to default
  5. Welcome window opens automatically on first launch; does not reopen after `localStorage['vidorra:welcomed']` is set
**Plans**: 02-00, 02-01, 02-02, 02-03, 02-04, 02-05

### Phase 3: KernelBus (Bridge)
**Goal**: Shell-side `KernelBusHost` handles postMessage RPC from trusted iframe sources; SDK-side `KernelBusClient` sends requests and resolves Promises. Core methods: `app.ready`, `window.setTitle`, `window.close`, `window.minimize`, `window.maximize`, `window.resize`, `theme.get`.
**Depends on**: Phase 2
**Requirements**: BUS-01, BUS-02, BUS-03, BUS-04
**Success Criteria** (what must be TRUE):
  1. An App iframe calling `window.parent.postMessage({method:'window.setTitle', ...})` causes the shell to update the window title
  2. Messages from untrusted origins are silently dropped
  3. Request timeout (5 s) correctly rejects the Promise
**Plans**: 03-01, 03-02, 03-03, 03-04

Plans:
- [x] 03-01: KernelBus type definitions (KernelBusPush)
- [x] 03-02: KernelBusHost (Shell-side)
- [x] 03-03: KernelBusClient (SDK-side)
- [x] 03-04: Integration and push notifications

### Phase 4: SDK v0.1
**Goal**: `@vidorra/sdk` package exposing `createApp()` with `window` and `theme` APIs; TypeScript types; ESM bundle < 8 KB gzip.
**Depends on**: Phase 3
**Requirements**: SDK-01, SDK-02, SDK-03, SDK-04
**Success Criteria** (what must be TRUE):
  1. `import { createApp } from '@vidorra/sdk'` works in a plain HTML app
  2. `app.window.setTitle('Test')` causes Shell window title to update
  3. `pnpm build` produces a bundle ≤ 8 KB gzip
  4. Full TypeScript type coverage (no implicit `any`)
**Plans**: 2 plans

Plans:
- [x] 04-01-PLAN.md — Create @vidorra/bus package (migrate KernelBusClient + bus types from kernel/types)
- [x] 04-02-PLAN.md — Implement @vidorra/sdk (createApp, VidorraApp interfaces, Vite lib build, unit tests)

### Phase 5: Built-in Apps
**Goal**: App Store (list + install from URL + uninstall), Settings (theme + wallpaper), Calculator (zero-dependency), Welcome (first-launch). All apps load as iframes via AppRegistry.
**Depends on**: Phase 4
**Requirements**: APP-01, APP-02, APP-03, APP-04, APP-05
**Success Criteria** (what must be TRUE):
  1. App Store can install an external app from a manifest URL and it appears in the Dock
  2. Settings theme switch immediately updates all CSS variables across the shell
  3. Calculator computes `12 + 34 * 5` correctly
  4. Welcome app opens on first launch; `vidorra:welcomed` key prevents re-show
**Plans**: 5 plans

Plans:
- [x] 05-01-PLAN.md — Shell integration scaffolding (proxy, Dock/Desktop reactivity fixes, registry entries, Calculator scaffold + RED tests)
- [ ] 05-02-PLAN.md — Calculator app: TDD arithmetic engine (useCalculator) + macOS dark-glass UI
- [ ] 05-03-PLAN.md — Welcome app: React+Vite project with SDK init and "Get Started" close handler
- [ ] 05-04-PLAN.md — Settings app: two-column layout, theme segmented control, wallpaper preset picker
- [ ] 05-05-PLAN.md — App Store: card grid, install modal, detail view, right-click menu, drag-to-trash uninstall

### Phase 6: Integration & Polish
**Goal**: All P0/P1 bugs fixed; window animations at 60 fps; 5+ simultaneous windows stable; Dock magnification smooth; full manual test checklist green.
**Depends on**: Phase 5
**Requirements**: QUAL-01, QUAL-02, QUAL-03
**Success Criteria** (what must be TRUE):
  1. 5 windows open simultaneously — drag, resize, z-order all correct
  2. Dock magnification produces no frame drops (tested in Chrome DevTools Performance tab)
  3. `pnpm build` produces a shell bundle that loads in < 2 s on localhost
  4. No P0 or P1 bugs open
**Plans**: TBD

## Progress

**Execution Order:** 0 → 1 → 2 → 3 → 4 → 5 → 6

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 0. Scaffolding | 3/3 | Complete | 2026-04-01 |
| 1. Kernel | 3/3 | Complete | 2026-04-01 |
| 2. Shell | 9/9 | Complete | 2026-04-02 |
| 3. KernelBus | 4/4 | Complete   | 2026-04-02 |
| 4. SDK v0.1 | 2/2 | Complete   | 2026-04-03 |
| 5. Built-in Apps | 1/5 | In Progress|  |
| 6. Integration & Polish | 0/TBD | Not started | - |
