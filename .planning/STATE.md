---
gsd_state_version: 1.0
milestone: v0.1
milestone_name: milestone
status: executing
stopped_at: Completed 03-03-PLAN.md (KernelBusClient)
last_updated: "2026-04-02T06:51:11.751Z"
last_activity: 2026-04-02
progress:
  total_phases: 6
  completed_phases: 1
  total_plans: 13
  completed_plans: 12
  percent: 46
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-01)

**Core value:** Any web app runs as a first-class citizen inside a macOS-style browser desktop with a single SDK call.
**Current focus:** Phase 03 — kernelbus-bridge

## Current Position

Phase: 03 (kernelbus-bridge) — EXECUTING
Plan: 3 of 4 (03-01 complete)
Status: Ready to execute
Last activity: 2026-04-02

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
| Phase 03-kernelbus-bridge P03 | 4min | 2 tasks | 3 files |

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
- [Phase 03-kernelbus-bridge]: KernelBusClient is a class (not singleton) — Phase 4 SDK instantiates it per app context
- [Phase 03-kernelbus-bridge]: Pending request Map pattern: Map<requestId, {resolve, reject, timer}> for concurrent Promise tracking with timeout cleanup
- [Phase 03-kernelbus-bridge]: Push notifications routed via type: 'push' discriminant before requestId check in KernelBusClient.handleMessage

### Pending Todos

None.

### Blockers/Concerns

None.

## Session Continuity

Last session: 2026-04-02T06:50:42.966Z
Stopped at: Completed 03-03-PLAN.md (KernelBusClient)
Resume file: None
