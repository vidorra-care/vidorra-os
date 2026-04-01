# Phase 0: Scaffolding - Context

**Gathered:** 2026-04-01
**Status:** Complete

<domain>
## Phase Boundary

Initialize pnpm workspace Monorepo with all package and app directories, configure TypeScript strict mode, Vite (shell/apps), ESLint 9 (flat config), Prettier, and Vitest (workspace mode). Deliver a blank shell page that starts with `pnpm dev`.

**Not included:** Any business logic, UI components, or tests beyond the empty scaffold.

</domain>

<decisions>
## Implementation Decisions

### Monorepo Approach
- Manual setup (no `create-turbo`) — package boundaries already defined, no need for Turborepo overhead
- pnpm 9.x workspaces — defined in `pnpm-workspace.yaml`

### Package Structure
- `packages/kernel` → `@vidorra/kernel` — pure TypeScript, no React
- `packages/shell` → `@vidorra/shell` — React + Vite, main entry point
- `packages/sdk` → `@vidorra/sdk` — pure TypeScript
- `packages/types` → `@vidorra/types` — shared type definitions
- `apps/app-store` → `@vidorra/app-store` — React + Vite
- `apps/settings` → `@vidorra/settings` — React + Vite
- `apps/calculator` → `@vidorra/calculator` — plain HTML (empty stub for Phase 0)

### Dependency Graph
- `shell` → `@vidorra/kernel`, `@vidorra/types`
- `sdk` → `@vidorra/types`
- `app-store` → `@vidorra/sdk`, `@vidorra/types`
- `settings` → `@vidorra/sdk`
- `calculator` → (no dependencies, plain HTML)

### TypeScript
- Root `tsconfig.json` with `strict: true`, `target: "ES2022"`, `module: "ESNext"`, `moduleResolution: "bundler"`, `jsx: "react-jsx"`, `skipLibCheck: true`
- Each package extends root with `extends: "../../tsconfig.json"`

### Toolchain Versions
- Node.js 20 LTS, pnpm 9.x, TypeScript 5.x, Vite 6.x, React 18.x, ESLint 9.x (flat config), Prettier 3.x, Vitest 2.x

### Root Scripts
- `pnpm dev` → starts `@vidorra/shell` dev server
- `pnpm build` → `pnpm -r build`
- `pnpm test` → `vitest run`
- `pnpm lint` → `eslint .`

</decisions>

<canonical_refs>
## Canonical References

- `docs/plans/mvp-plan.md` — Full MVP plan with package structure and phase breakdown
- `docs/plans/2026-04-01-phase0-scaffolding-design.md` — Original scaffolding design doc

</canonical_refs>

<specifics>
## Specific Ideas

- `apps/notes-demo` is a P2 feature — do NOT create the directory in Phase 0
- `registry/built-in-apps.json` is created as an empty stub

</specifics>

<deferred>
## Deferred Ideas

- All business logic — Phase 1+
- Any UI components — Phase 2+

</deferred>

---

*Phase: 00-scaffolding*
*Context gathered: 2026-04-01*
