---
gsd_state_version: 1.0
milestone: v0.1
milestone_name: "**Goal**: `@vidorra/sdk` package exposing `createApp"
status: planning
stopped_at: Completed 03-kernelbus-bridge-01-PLAN.md
last_updated: "2026-04-02T06:39:09.868Z"
last_activity: 2026-04-02 — Phase 2 (Shell) complete; all 9 UAT gaps closed and verified
progress:
  total_phases: 7
  completed_phases: 0
  total_plans: 9
  completed_plans: 7
  percent: 43
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-01)

**Core value:** Any web app runs as a first-class citizen inside a macOS-style browser desktop with a single SDK call.
**Current focus:** Phase 3 — KernelBus (Bridge)

## Current Position

Phase: 3 of 7 (KernelBus)
Plan: 1 of 4 in current phase (03-01 complete)
Status: In progress
Last activity: 2026-04-02 — Phase 3 Plan 01 complete; KernelBusPush type added to @vidorra/types

Progress: [████░░░░░░] ~46%

## Performance Metrics

**Velocity:**

- Total plans completed: 9 (3 in Phase 0, 3 in Phase 1, 3 gap plans in Phase 2)
- Average duration: TBD
- Total execution time: TBD

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 0. Scaffolding | 3 | - | - |
| 1. Kernel | 3 | - | - |
| 2. Shell | 9 | - | - |
| Phase 03-kernelbus-bridge P01 | 5 | 1 tasks | 1 files |

## Accumulated Context

### Decisions

- [Phase 0]: pnpm workspaces, TypeScript strict, Vite 6, ESLint 9 flat config — hand-crafted monorepo (no Turborepo)
- [Phase 0]: `react-rnd` chosen for window drag+resize to avoid implementing 8-direction resize manually
- [Phase 1]: Class + singleton export pattern (`appRegistry`, `themeEngine`) — not function-based
- [Phase 1]: ThemeEngine injects CSS variables to `:root`; Shell components use `var(--color-bg)` directly, no React subscription needed
- [Phase 2]: Framer Motion for animations; bounce uses `translateY` key + `transformTemplate` (reference-parity)
- [Phase 2]: Dock/ContextMenu use pure CSS `backdrop-filter` glass (not SVG liquid glass) — matches macos-preact reference
- [Phase 2]: Wallpaper stored as base64 via FileReader (not blob URL) for persistence across reloads
- [Phase 2]: `useDockStore` tracks icon positions via RAF for accurate minimize genie target
- [Phase 2 Visual]: HSL CSS variable system + `body.dark` class-based theme switching (02-09)
- [Phase 2 Visual]: TrafficLights CSS-class-driven colors; unfocused greying via `.unfocused` compound selector (02-10)
- [Phase 2 Visual]: WindowFrame 2.5rem titlebar, layered shadows, dark mode inner border (02-11)
- [Phase 2 Visual]: Dock theme-aware glass, `var(--app-color-dark)` dot, divider via `dockBreaksBefore` (02-12)
- [Phase 2 Visual]: Menubar full dropdown (useMenubarStore + defaultMenuConfig + Menu + slidethrough) (02-13)
- [Phase 2 Visual]: ContextMenu theme-aware colors, dark mode double-border (02-14)
- [Phase 2 Visual]: ActionCenter panel + useThemeStore + ThemeEngine startup sync in main.tsx (02-15)
- [Phase 03-kernelbus-bridge]: KernelBusPush uses type: 'push' discriminant (not requestId) to distinguish push from RPC response; absence of requestId is a secondary distinguishing property

### Pending Todos

None.

### Blockers/Concerns

None.

## Session Continuity

Last session: 2026-04-02T06:39:09.863Z
Stopped at: Completed 03-kernelbus-bridge-01-PLAN.md
Resume file: None
