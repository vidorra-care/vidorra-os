---
phase: 5
slug: built-in-apps
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-03
---

# Phase 5 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest ^3.0.0 (root) / Vitest ^2.1.9 (shell) |
| **Config file** | `packages/kernel/vitest.config.ts` (happy-dom env); `apps/calculator/vitest.config.ts` (Wave 0 installs) |
| **Quick run command** | `pnpm --filter @vidorra/kernel run test` |
| **Full suite command** | `pnpm test` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm --filter @vidorra/kernel run test`
- **After every plan wave:** Run `pnpm test`
- **Before `/gsd:verify-work`:** Full suite must be green + manual smoke for APP-01, APP-03, APP-05
- **Max feedback latency:** ~10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 5-W0-calc-test | 01 (Calculator) | 0 | APP-04 | unit | `pnpm --filter @vidorra/calculator run test` | ❌ W0 | ⬜ pending |
| 5-calc-engine | 01 (Calculator) | 1 | APP-04 | unit | `pnpm --filter @vidorra/calculator run test` | ❌ W0 | ⬜ pending |
| 5-registry-uninstall | 02 (App Store) | 1 | APP-02 | unit | `pnpm --filter @vidorra/kernel run test` | ✅ | ⬜ pending |
| 5-registry-install | 02 (App Store) | 1 | APP-01 | integration (manual smoke) | `pnpm --filter @vidorra/kernel run test` | ✅ partial | ⬜ pending |
| 5-theme-settings | 03 (Settings) | 1 | APP-03 | manual smoke | N/A | ❌ no UI test | ⬜ pending |
| 5-welcome-close | 04 (Welcome) | 1 | APP-05 | manual smoke | N/A | ❌ requires live shell | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `apps/calculator/src/hooks/useCalculator.test.ts` — unit tests for APP-04: `12 + 34 * 5 = 182`, operator precedence, edge cases (div by zero, decimal, chained ops)
- [ ] `apps/calculator/vitest.config.ts` — happy-dom environment config for Calculator

*All other existing infrastructure covers remaining phase requirements.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| App Store install from URL appears in Dock | APP-01 | Requires live shell + AppRegistry + iframe loading | 1. Open App Store → click "Install from URL" → enter valid manifest URL → confirm → check Dock for new app icon |
| Settings theme switch updates CSS vars across all frames | APP-03 | CSS variable mutation requires visual inspection + cross-frame check | 1. Open Settings → toggle theme → verify shell background, Dock, and any open app iframes switch theme immediately |
| Welcome opens on first launch, doesn't reopen after | APP-05 | Requires live shell + localStorage + SDK window.close() | 1. Clear localStorage → launch shell → Welcome window must auto-open. 2. Click "Get Started" → window closes → reload shell → Welcome must NOT reopen |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
