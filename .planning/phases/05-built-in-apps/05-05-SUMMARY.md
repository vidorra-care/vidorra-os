---
phase: 05-built-in-apps
plan: "05"
subsystem: ui
tags: [react, app-store, appRegistry, drag-and-drop, context-menu, modal, css-modules]

# Dependency graph
requires:
  - phase: 05-01
    provides: Dock storage event listener for registry changes (plan 01 fix)
  - phase: 04-sdk-v01
    provides: "@vidorra/sdk createApp() factory for iframe app initialization"
  - phase: 01-kernel
    provides: "@vidorra/kernel appRegistry with install/uninstall/getAllApps"
provides:
  - Fully functional App Store app with card grid, in-page detail view, install modal, and trash zone
  - useAppRegistry hook wrapping appRegistry with reactive React state
  - Three uninstall paths: detail page button, right-click context menu, HTML5 DnD TrashZone
  - "Install from URL" modal with inline error display and loading state
  - AppCard with draggable HTML5 DnD and right-click context menu matching shell glass style
affects: [shell, dock, app-registry, 05-built-in-apps]

# Tech tracking
tech-stack:
  added: ["@vidorra/kernel added to app-store package.json dependencies"]
  patterns:
    - install() returns Promise<boolean> (hadError) to avoid stale closure on React state reads
    - CSS position:fixed overlay for modal (avoids sandbox Pitfall #1 showModal() block)
    - HTML5 DnD with dataTransfer.setData('text/plain', appId) for drag-to-trash
    - Token system redeclared in App.module.css :global(body) for iframe CSS isolation

key-files:
  created:
    - apps/app-store/src/main.tsx
    - apps/app-store/src/hooks/useAppRegistry.ts
    - apps/app-store/src/App.tsx
    - apps/app-store/src/App.module.css
    - apps/app-store/src/components/AppCard.tsx
    - apps/app-store/src/components/AppCard.module.css
    - apps/app-store/src/components/AppGrid.tsx
    - apps/app-store/src/components/AppGrid.module.css
    - apps/app-store/src/components/AppDetail.tsx
    - apps/app-store/src/components/AppDetail.module.css
    - apps/app-store/src/components/InstallModal.tsx
    - apps/app-store/src/components/InstallModal.module.css
    - apps/app-store/src/components/TrashZone.tsx
    - apps/app-store/src/components/TrashZone.module.css
  modified:
    - apps/app-store/package.json

key-decisions:
  - "install() returns Promise<boolean> (hadError) — avoids stale closure reading installError after await in handleInstallSubmit"
  - "CSS position:fixed overlay for InstallModal instead of showModal() — sandbox='allow-scripts allow-same-origin' may block native dialog"
  - "@vidorra/kernel added to app-store deps — appRegistry is the source of truth for installed apps"
  - "Lightweight custom context menu built for AppCard — App Store iframe cannot import shell React components"

patterns-established:
  - "hadError pattern: async install() returns boolean sentinel instead of relying on post-await state reads"
  - "TrashZone visibility via isDragging state in App root + CSS opacity/pointer-events toggle"
  - "Token system redeclared per-app in App.module.css :global(body) for iframe CSS isolation"

requirements-completed: [APP-01, APP-02]

# Metrics
duration: 8min
completed: 2026-04-03
---

# Phase 5 Plan 05: App Store Summary

**Full App Store with card grid, install-from-URL modal with inline errors, in-page detail view, right-click context menu, and HTML5 drag-to-trash uninstall — all three uninstall paths functional.**

## Performance

- **Duration:** 8 min
- **Started:** 2026-04-03T06:18:55Z
- **Completed:** 2026-04-03T06:26:57Z
- **Tasks:** 2
- **Files modified:** 15

## Accomplishments
- Implemented useAppRegistry hook with reactive apps state, install (returns Promise<boolean> hadError sentinel), uninstall, and refresh wired to appRegistry singleton
- Built AppGrid (CSS auto-fill minmax(160px) grid + empty state) and AppCard (draggable, right-click context menu with Open/Uninstall App, hover shadow)
- Implemented InstallModal using CSS position:fixed overlay (not showModal() — avoids sandbox restriction), with inline error display, Installing... loading state, and animation
- Created AppDetail in-page navigation with All Apps back button, 72px icon, version, description placeholder, and Uninstall button
- TrashZone HTML5 DnD drop target with fade-in on drag start, red highlight on dragOver, Drag here / Release copy per UI-SPEC

## Task Commits

1. **Task 1: App Store SDK init + useAppRegistry hook + grid/card/toolbar scaffold** - `7e9c591` (feat)
2. **Task 2: App Store detail view + install modal + trash zone** - `07559d1` (feat)

## Files Created/Modified
- `apps/app-store/src/main.tsx` - SDK init: createApp() + theme.get() + theme.onChange
- `apps/app-store/src/hooks/useAppRegistry.ts` - Reactive wrapper for appRegistry with hadError pattern
- `apps/app-store/src/App.tsx` - Root: view routing (grid/detail), toolbar, drag state, modal
- `apps/app-store/src/App.module.css` - Token system + toolbar 48px + content area layout
- `apps/app-store/src/components/AppCard.tsx` - Draggable card with right-click context menu
- `apps/app-store/src/components/AppCard.module.css` - Card 160px min, 56px icon, context menu glass
- `apps/app-store/src/components/AppGrid.tsx` - CSS auto-fill grid + empty state
- `apps/app-store/src/components/AppGrid.module.css` - minmax(160px, 1fr) grid layout
- `apps/app-store/src/components/AppDetail.tsx` - Detail page with All Apps back + Uninstall button
- `apps/app-store/src/components/AppDetail.module.css` - Detail card with 72px icon, action row
- `apps/app-store/src/components/InstallModal.tsx` - Fixed overlay modal, URL input, inline error
- `apps/app-store/src/components/InstallModal.module.css` - Modal 400px, fade+scale animation
- `apps/app-store/src/components/TrashZone.tsx` - HTML5 DnD drop target, Drag/Release text
- `apps/app-store/src/components/TrashZone.module.css` - 48px zone, opacity fade, red tint on active
- `apps/app-store/package.json` - Added @vidorra/kernel dependency

## Decisions Made
- **hadError pattern for install():** `install()` returns `Promise<boolean>` (true = error). `handleInstallSubmit` reads `const hadError = await install(url)` and skips close if error. Avoids stale closure bug where `installError` state would read as null right after await.
- **CSS overlay for modal:** Used `position: fixed` overlay instead of `<dialog>.showModal()` per Pitfall #1 from 05-RESEARCH.md — sandbox attribute can block native dialog methods.
- **Custom context menu in AppCard:** App Store runs in an iframe and cannot import `ContextMenu` from the shell's React tree. Built a lightweight matching glass-surface menu with same CSS vars.
- **@vidorra/kernel dep:** Added to app-store package.json — the app directly uses `appRegistry` from kernel, not indirectly via SDK.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added @vidorra/kernel to app-store package.json**
- **Found during:** Task 1 (useAppRegistry hook creation)
- **Issue:** useAppRegistry imports `appRegistry` from `@vidorra/kernel` but the package was not listed in app-store's dependencies
- **Fix:** Added `"@vidorra/kernel": "workspace:*"` to dependencies
- **Files modified:** apps/app-store/package.json
- **Verification:** pnpm install succeeded; TypeScript build passes
- **Committed in:** 7e9c591 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking dependency)
**Impact on plan:** Required for correct operation. No scope creep.

## Known Stubs
- `apps/app-store/src/components/AppDetail.tsx` line 31: Description shows "A Vidorra OS application." — intentional placeholder. `AppManifest` has no `description` field in Phase 5 scope. The plan's must_haves explicitly lists "description placeholder" as a requirement. No future plan is currently planned to add description to manifests.

## Issues Encountered
- SDK dist directory was missing (SDK not pre-built) — ran `pnpm --filter @vidorra/sdk build` before app-store build check. This is expected in a fresh worktree environment.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- App Store is fully functional with all three uninstall paths, install modal, and detail view
- Dock storage event reactivity depends on plan 01's Dock.tsx storage listener fix
- Full test suite green: 65 tests passing (kernel 39 + bus 13 + sdk 13)
- Build compiles clean with TypeScript strict mode

---
*Phase: 05-built-in-apps*
*Completed: 2026-04-03*

## Self-Check: PASSED

- All 15 files created/modified: FOUND
- Commit 7e9c591 (Task 1): FOUND
- Commit 07559d1 (Task 2): FOUND
- pnpm test: 65/65 tests passing
- TypeScript build: clean (0 errors)
