---
phase: 05-built-in-apps
plan: "03"
subsystem: ui
tags: [react, vite, typescript, sdk, iframe, welcome-app, css-modules]

# Dependency graph
requires:
  - phase: 05-01
    provides: Shell proxy infrastructure and built-in app registry entries
  - phase: 04-sdk-v01
    provides: "@vidorra/sdk createApp() with app.ready(), app.window.close(), app.theme"
provides:
  - Welcome app as full React+Vite project on port 3013 with SDK integration
  - Shell public/apps/welcome/ replaced with proper Vite build output
  - app.ready() + app.theme.onChange() + app.window.close() wired via main.tsx
  - Full-screen centered Welcome UI with brand copy and Get Started button
affects:
  - 05-01 (shell vite.config.ts proxy for /apps/welcome added)
  - 05-05 (validation will confirm Welcome opens and closes correctly)

# Tech tracking
tech-stack:
  added: ["@vidorra/welcome workspace package", "CSS Modules for Welcome app"]
  patterns:
    - "SDK in main.tsx, pure React component in App.tsx (no SDK import in UI component)"
    - "CSS token redeclaration pattern for iframe isolation (iframes cannot inherit :root vars)"
    - "Build output (outDir) targeting shell public/apps/<name> to replace static placeholder"

key-files:
  created:
    - apps/welcome/package.json
    - apps/welcome/tsconfig.json
    - apps/welcome/tsconfig.app.json
    - apps/welcome/index.html
    - apps/welcome/vite.config.ts
    - apps/welcome/src/vite-env.d.ts
    - apps/welcome/src/main.tsx
    - apps/welcome/src/App.tsx
    - apps/welcome/src/App.module.css
    - packages/shell/public/apps/welcome/assets/index-B9nSpN-F.css
    - packages/shell/public/apps/welcome/assets/index-Bl7nwBa2.js
  modified:
    - packages/shell/vite.config.ts (added /apps/welcome proxy to localhost:3013)
    - packages/shell/public/apps/welcome/index.html (replaced static placeholder with Vite build output)
    - pnpm-lock.yaml

key-decisions:
  - "SDK calls (app.ready, app.theme.onChange, app.window.close) in main.tsx, not App.tsx — keeps UI component pure React, testable without SDK mock"
  - "CSS tokens redeclared in App.module.css body selector — iframes have isolated CSS scope, cannot inherit Shell :root variables"
  - "tsconfig.app.json added (references pattern) for proper composite TypeScript builds with tsc -b"
  - "Build output committed to git (packages/shell/public/apps/welcome/) — replaces tracked static placeholder from Phase 2"

patterns-established:
  - "Pattern: SDK init in main.tsx, props to UI component — isolates SDK coupling at entry point"
  - "Pattern: iframe CSS token redeclaration — every app must redeclare --color-* and --app-* tokens since iframes don't inherit :root"
  - "Pattern: App vite.config.ts build.outDir points to shell public/apps/<name> — build replaces static placeholder"

requirements-completed: [APP-05]

# Metrics
duration: 6min
completed: 2026-04-03
---

# Phase 5 Plan 03: Welcome App Summary

**React+Vite Welcome app on port 3013 with @vidorra/sdk integration: app.ready(), theme sync via app.theme.onChange(), and Get Started button calling app.window.close()**

## Performance

- **Duration:** ~6 min
- **Started:** 2026-04-03T05:54:17Z
- **Completed:** 2026-04-03T05:59:27Z
- **Tasks:** 2
- **Files modified:** 12

## Accomplishments
- Scaffolded complete React+Vite project at apps/welcome/ with @vidorra/sdk dependency, port 3013, and build output to shell public
- Implemented Welcome UI with correct brand copy: "Welcome to Vidorra OS" headline, body text, and "Get Started" button meeting WCAG 44px touch target
- SDK integration pattern established: app.ready() + app.theme.onChange() in main.tsx, pure React App.tsx component with onGetStarted prop
- Static placeholder (packages/shell/public/apps/welcome/index.html) replaced with proper Vite build output; SDK calls now functional

## Task Commits

Each task was committed atomically:

1. **Task 1: Welcome app scaffold + SDK integration** - `96fac87` (feat)
2. **Task 2: Welcome UI component + CSS** - `555f7f0` (feat)
3. **Build output committed** - `9819b96` (chore)

**Plan metadata:** (to be added by final commit)

## Files Created/Modified
- `apps/welcome/package.json` - @vidorra/welcome workspace package, SDK + React deps
- `apps/welcome/tsconfig.json` - References tsconfig.app.json for composite build
- `apps/welcome/tsconfig.app.json` - TypeScript strict config for app src
- `apps/welcome/index.html` - Vite entry point with root div
- `apps/welcome/vite.config.ts` - Port 3013, outDir to shell public/apps/welcome
- `apps/welcome/src/vite-env.d.ts` - Vite client type reference
- `apps/welcome/src/main.tsx` - SDK init: app.ready(), theme.onChange(), renders App with app.window.close()
- `apps/welcome/src/App.tsx` - Pure React UI: headline, body, Get Started button with onGetStarted prop
- `apps/welcome/src/App.module.css` - Full-screen flex layout, CSS tokens redeclared for iframe isolation
- `packages/shell/vite.config.ts` - Added /apps/welcome proxy to http://localhost:3013
- `packages/shell/public/apps/welcome/index.html` - Replaced static placeholder with React build output
- `packages/shell/public/apps/welcome/assets/` - Vite build JS + CSS assets

## Decisions Made
- SDK calls placed in main.tsx, not App.tsx — keeps UI component pure React and easier to test without SDK mocking
- CSS tokens must be redeclared in each iframe app — iframes cannot inherit Shell's `:root` variables; used body selector in App.module.css
- Used tsconfig.app.json + tsconfig.json references pattern (matching Vite React TypeScript standard) to support `tsc -b` composite builds
- Build output files committed to git since packages/shell/public/apps/welcome/index.html was already tracked from Phase 2 static placeholder

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] SDK dist not built — tsc -b failed on @vidorra/sdk import**
- **Found during:** Verification (post-Task 2 build check)
- **Issue:** packages/sdk/dist/ did not exist; TypeScript couldn't resolve @vidorra/sdk types — build failed with TS2307
- **Fix:** Ran `pnpm --filter @vidorra/sdk build` to generate dist/index.d.ts, then welcome build succeeded
- **Files modified:** packages/sdk/dist/ (generated, not committed per .gitignore)
- **Verification:** pnpm --filter @vidorra/welcome build exits 0, outputs assets to shell public
- **Committed in:** Not committed (SDK dist is gitignored per packages/sdk/dist/)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** The SDK dist must be built before welcome build — this is a workspace build-order dependency. In CI/production, SDK is built first. No scope creep.

## Issues Encountered
- Shell vite.config.ts had no proxy block yet (plan 05-01 runs in parallel). Added welcome-only proxy entry `/apps/welcome -> localhost:3013` without the other apps' entries. Plan 05-01 will merge its proxy additions.

## Known Stubs

None - all data is wired. The Welcome app renders its actual copy, calls real SDK methods, and the build output is deployed to shell public.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Welcome app built and functional; shell can load it at /apps/welcome/index.html
- SDK integration pattern (main.tsx init, App.tsx pure component) established for reference
- Parallel plan 05-01 should be adding proxy entries for app-store, settings, and calculator — merge may require proxy block consolidation
- Plan 05-05 (validation) can verify Welcome opens at shell launch and Get Started closes the window

## Self-Check: PASSED

All created files verified present. All task commits verified in git log.

- FOUND: apps/welcome/package.json
- FOUND: apps/welcome/vite.config.ts
- FOUND: apps/welcome/src/main.tsx
- FOUND: apps/welcome/src/App.tsx
- FOUND: apps/welcome/src/App.module.css
- FOUND: .planning/phases/05-built-in-apps/05-03-SUMMARY.md
- FOUND commit: 96fac87 (Task 1)
- FOUND commit: 555f7f0 (Task 2)
- FOUND commit: 9819b96 (build output)

---
*Phase: 05-built-in-apps*
*Completed: 2026-04-03*
