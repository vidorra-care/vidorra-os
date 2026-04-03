---
phase: 05-built-in-apps
plan: 02
subsystem: ui
tags: [react, typescript, vitest, tdd, calculator, css-modules, macos]

# Dependency graph
requires:
  - phase: 05-01
    provides: Calculator app scaffold, RED test file for useCalculator, vitest config
provides:
  - evaluate() arithmetic function with JS-native operator precedence
  - useCalculator() hook managing display/expression state machine
  - Calculator App.tsx with 4x5 macOS button grid layout
  - App.module.css with dark-glass macOS aesthetic (Calculator Exception design)
affects:
  - 05-03 (Settings app)
  - 05-04 (Welcome app)
  - 05-05 (App Store integration)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Safe Function() wrapper for arithmetic expression evaluation with character allowlist"
    - "CSS Modules for component-scoped styles — no global style leakage"
    - "TDD RED→GREEN: test file shipped in 05-01, implementation in 05-02"

key-files:
  created:
    - apps/calculator/src/hooks/useCalculator.ts
    - apps/calculator/src/App.tsx
    - apps/calculator/src/App.module.css
  modified:
    - apps/calculator/src/main.tsx

key-decisions:
  - "evaluate() uses Function() wrapper with safe character regex allowlist (not Shunting-yard) — simpler and correct for this use case since JS natively handles operator precedence"
  - "Calculator is always dark glass (Calculator Exception) — ignores prefers-color-scheme per UI-SPEC.md D-19"
  - "Zero @vidorra/sdk dependency confirmed (D-08) — Calculator is intentionally the simplest possible app"

patterns-established:
  - "Safe Function() wrapper pattern: validate with /^[\\d\\s+\\-*/.()]+$/ before evaluating"
  - "useCalculator state machine: display (shown to user) vs expression (accumulated for evaluation) are separate strings"

requirements-completed: [APP-04]

# Metrics
duration: 3min
completed: 2026-04-03
---

# Phase 5 Plan 02: Calculator App Summary

**Shunting-yard-free Calculator with safe Function() evaluator, useCalculator hook, and macOS dark-glass 4x5 button grid — all 7 TDD tests GREEN**

## Performance

- **Duration:** 3 min
- **Started:** 2026-04-03T05:54:51Z
- **Completed:** 2026-04-03T05:57:53Z
- **Tasks:** 2 (TDD GREEN + UI)
- **Files modified:** 4

## Accomplishments

- Implemented `evaluate()` using safe `Function()` wrapper with character allowlist — correctly handles `12 + 34 * 5 = 182` via JS native operator precedence
- Implemented `useCalculator()` hook with full state machine: appendDigit, appendOperator, equals, clear, toggleSign, percent, appendDecimal
- Built Calculator App.tsx with macOS 4x5 button grid (AC +/- % ÷ / 7-9×/ 4-6− / 1-3+ / 0..=) following UI-SPEC.md layout
- App.module.css implements full Calculator Exception spec: dark glass container, 3rem/weight-200 display, macOS orange operators
- All 7 Vitest tests pass, TypeScript build passes, zero SDK dependency confirmed

## Task Commits

1. **TDD GREEN — evaluate() + useCalculator hook** - `aab235d` (feat)
2. **Calculator macOS UI — App.tsx + App.module.css + main.tsx** - `940bf0a` (feat)

**Plan metadata:** (docs commit to follow)

## Files Created/Modified

- `apps/calculator/src/hooks/useCalculator.ts` — evaluate() function + useCalculator hook (94 lines)
- `apps/calculator/src/App.tsx` — Full Calculator UI with 19-button 4x5 grid (60 lines)
- `apps/calculator/src/App.module.css` — macOS dark-glass CSS: hsla(0,0%,27%,0.7) container, hsla(32,87%,56%,1) operators (84 lines)
- `apps/calculator/src/main.tsx` — Updated to render App (replaces placeholder)

## Decisions Made

- **Safe Function() over Shunting-yard:** The plan suggested both approaches. Chose `Function()` wrapper because JavaScript's expression evaluator natively handles operator precedence — simpler, correct, and the character regex allowlist `[\\d\\s+\\-*/.()]+` prevents injection.
- **Calculator Exception styling:** Always dark glass regardless of system theme — implemented as specified. `container` uses `backdrop-filter: blur(40px)` and `background-color: hsla(0,0%,27%,0.7)`.

## Deviations from Plan

None — plan executed exactly as written. Merged 05-01 branch (prerequisite) before executing since this worktree was on a clean branch without the scaffold.

## Issues Encountered

- 05-01 scaffold existed on `worktree-agent-a2b4ad86` branch but not on this worktree's branch (`worktree-agent-ab38144f`). Fast-forward merged `worktree-agent-a2b4ad86` into current branch before executing — no conflicts.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Calculator app is complete: tests pass, TypeScript compiles, build outputs to `packages/shell/public/apps/calculator/`
- Ready for 05-03 (Settings app implementation)
- Shell proxy for `/apps/calculator` → port 3012 was set up in 05-01 — dev server ready

## Self-Check: PASSED

Files verified:
- FOUND: apps/calculator/src/hooks/useCalculator.ts
- FOUND: apps/calculator/src/App.tsx
- FOUND: apps/calculator/src/App.module.css
- FOUND: .planning/phases/05-built-in-apps/05-02-SUMMARY.md

Commits verified:
- FOUND: aab235d (feat: evaluate() + useCalculator hook)
- FOUND: 940bf0a (feat: Calculator macOS UI)

---
*Phase: 05-built-in-apps*
*Completed: 2026-04-03*
