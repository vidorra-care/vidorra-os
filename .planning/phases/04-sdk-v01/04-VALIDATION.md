---
phase: 4
slug: sdk-v01
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-03
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 3.x |
| **Config file** | `packages/bus/vitest.config.ts`, `packages/sdk/vitest.config.ts` |
| **Quick run command** | `pnpm --filter @vidorra/bus test && pnpm --filter @vidorra/sdk test` |
| **Full suite command** | `pnpm -r run test` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm --filter @vidorra/bus test && pnpm --filter @vidorra/sdk test`
- **After every plan wave:** Run `pnpm -r run test`
- **Before `/gsd:verify-work`:** Full suite must be green + `pnpm --filter @vidorra/sdk build` exits 0
- **Max feedback latency:** ~10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 04-01-01 | 01 | 1 | SDK-01 | unit | `pnpm --filter @vidorra/bus test` | ❌ W0 | ⬜ pending |
| 04-01-02 | 01 | 1 | SDK-01 | build | `pnpm --filter @vidorra/kernel build` | ✅ | ⬜ pending |
| 04-02-01 | 02 | 1 | SDK-02, SDK-03 | unit | `pnpm --filter @vidorra/sdk test` | ❌ W0 | ⬜ pending |
| 04-02-02 | 02 | 2 | SDK-04 | build | `pnpm --filter @vidorra/sdk build` | ❌ W0 | ⬜ pending |
| 04-02-03 | 02 | 2 | SDK-04 | size | `gzip -c packages/sdk/dist/vidorra-sdk.js \| wc -c` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `packages/bus/src/client.test.ts` — migrated KernelBusClient tests (stubs passing before implementation)
- [ ] `packages/sdk/src/index.test.ts` — SDK unit tests with mocked `@vidorra/bus`
- [ ] `packages/bus/vitest.config.ts` — happy-dom environment config
- [ ] `packages/sdk/vitest.config.ts` — happy-dom environment config
- [ ] `packages/sdk/vite.config.ts` — Vite lib mode config for build

*Wave 0 creates test infrastructure; subsequent waves fill implementations.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Bundle ≤ 8 KB gzip verified | SDK-04 / QUAL-03 | Requires built dist file | Run `gzip -c packages/sdk/dist/vidorra-sdk.js \| wc -c` after `pnpm --filter @vidorra/sdk build`; confirm output ≤ 8192 |
| Types visible in IDE | SDK-04 | IDE integration | Open a TS file, `import { createApp } from '@vidorra/sdk'`, hover `app.window.setTitle` — JSDoc appears |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
