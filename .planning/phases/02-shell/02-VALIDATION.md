---
phase: 2
slug: shell
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-04-01
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 3.x |
| **Config file** | `packages/shell/vitest.config.ts` (none — Wave 0 creates it) |
| **Quick run command** | `pnpm test --filter @vidorra/shell` |
| **Full suite command** | `pnpm test` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm test --filter @vidorra/shell`
- **After every plan wave:** Run `pnpm test` + manual browser smoke test
- **Before `/gsd:verify-work`:** Full suite must be green + manual QUAL-01 checklist
- **Max feedback latency:** ~10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 2-W0-01 | W0 | 0 | infra | config | `test -f packages/shell/vitest.config.ts` | ❌ W0 | ⬜ pending |
| 2-W0-02 | W0 | 0 | SHELL-01..08 | stubs | `pnpm test --filter @vidorra/shell` | ❌ W0 | ⬜ pending |
| 2-01-01 | 01 | 1 | SHELL-01, SHELL-02, SHELL-03 | unit | `vitest run packages/shell/src/stores/useWindowStore.test.ts` | ❌ W0 | ⬜ pending |
| 2-02-01 | 02 | 1 | SHELL-04, SHELL-05 | unit | `vitest run packages/shell/src/components/Dock/Dock.test.tsx` | ❌ W0 | ⬜ pending |
| 2-03-01 | 03 | 1 | SHELL-06 | unit | `vitest run packages/shell/src/components/Menubar/Menubar.test.tsx` | ❌ W0 | ⬜ pending |
| 2-04-01 | 04 | 1 | SHELL-07 | unit | `vitest run packages/shell/src/components/Desktop/Desktop.test.tsx` | ❌ W0 | ⬜ pending |
| 2-05-01 | 05 | 2 | SHELL-08 | unit | `vitest run packages/shell/src/App.test.tsx` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `packages/shell/vitest.config.ts` — jsdom/happy-dom environment for React component testing
- [ ] `packages/shell/package.json` — add `vitest`, `@testing-library/react`, `@testing-library/user-event`, `jsdom` to devDependencies
- [ ] `packages/shell/src/stores/useWindowStore.test.ts` — stubs for SHELL-01, SHELL-02, SHELL-03
- [ ] `packages/shell/src/components/Dock/Dock.test.tsx` — stubs for SHELL-04, SHELL-05
- [ ] `packages/shell/src/components/Menubar/Menubar.test.tsx` — stubs for SHELL-06
- [ ] `packages/shell/src/components/Desktop/Desktop.test.tsx` — stubs for SHELL-07
- [ ] `packages/shell/src/App.test.tsx` — stubs for SHELL-08
- [ ] `packages/shell/public/wallpapers/` directory with `default.jpg`

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Dock magnification spring feel | SHELL-04 | Animation physics require visual inspection | Hover over Dock icons and verify smooth spring magnification (48px→80px, stiffness:150, damping:15) |
| Window drag snap-back at boundary | SHELL-01 | Requires browser interaction | Drag window titlebar past screen edge; verify it springs back with titlebar always visible |
| Minimize animation toward Dock | SHELL-02 | Animation requires visual check | Click yellow minimize; verify scale+translate toward Dock icon position |
| Glass blur (Menubar, Dock, titlebar) | QUAL-01 | CSS rendering varies by browser | Open shell; verify `backdrop-filter: blur(20px) saturate(180%)` visible on all three surfaces |
| Welcome window first-launch only | SHELL-08 | Requires localStorage state reset | Clear localStorage, refresh — Welcome opens. Refresh again — Welcome does not open. |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-04-01
