# Vidorra OS

## What This Is

Vidorra OS is a browser-based macOS-style Web Desktop OS. It lets any web application run as a sandboxed first-class citizen inside a desktop environment — with a Dock, Menubar, draggable/resizable windows, and a postMessage-based kernel bus for shell–app communication. Developers integrate via a tiny `@vidorra/sdk` package.

## Core Value

Any web app can become a Vidorra OS app with a single `createApp()` SDK call — without rewriting it or changing its tech stack.

## Requirements

### Validated

- ✓ SCAF-01 – SCAF-03: Monorepo scaffolding — Phase 0
- ✓ KERN-01 – KERN-05: AppRegistry + ThemeEngine — Phase 1
- ✓ SHELL-01 – SHELL-08: Visual shell (WindowManager, Dock, Menubar, Desktop) — Phase 2
- ✓ BUS-01 – BUS-04: KernelBus postMessage RPC — Phase 3

### Active

- [ ] SDK-01 – SDK-04: `@vidorra/sdk` v0.1
- [ ] APP-01 – APP-05: App Store, Settings, Calculator, Welcome
- [ ] QUAL-01 – QUAL-03: 60 fps animations, < 2 s load, no P0/P1 bugs

### Out of Scope

- Server-side rendering — client-only; no SSR needed for v1
- OAuth / user accounts — no backend for v1
- Real-time sync — deferred to v2 Self-Hosted Server
- VFS (Virtual File System) — P2 feature
- AI Buddy — P3 feature
- Genie minimize effect — post-MVP WebGPU enhancement

## Context

- Differentiator vs. Puter / OS.js: macOS aesthetic + truly framework-agnostic sandbox + structured cross-app data layer — none of the existing Web OS projects have all three.
- Tech stack locked: React 18 + TypeScript strict + Zustand + Framer Motion + Vite + pnpm workspaces + `react-rnd`.
- Reference implementation for visual language: `.reference/macos-web-main/` (Svelte) — used for Dock magnification params, window chrome, glass morphism.
- Post-MVP Genie effect: `.reference/Macos-Genie-Effect-With-WebGPU-main/` (WebGPU + WGSL).

## Constraints

- **Tech stack**: React 18 + TypeScript strict — locked, no deviation
- **Bundle size**: SDK ≤ 8 KB gzip — must stay installable in plain HTML apps
- **Performance**: 60 fps animations; shell load < 2 s on localhost
- **Compatibility**: Chrome 90+ / Safari 15+ / Firefox 90+
- **Scope**: No backend for v1 — all persistence via `localStorage`

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| pnpm workspaces, no Turborepo | Avoid over-engineering; package boundaries already known | ✓ Good |
| `react-rnd` for window drag+resize | Prevents 8-direction resize implementation bugs | ✓ Good |
| Class + singleton export for Kernel | Easy testing (`new AppRegistry()`) + clean import (`import { appRegistry }`) | ✓ Good |
| ThemeEngine injects CSS vars to `:root` | Shell components need no React subscriptions for theme; switches are instant | ✓ Good |
| Framer Motion for Phase 2 animations | Genie effect (WebGPU) deferred; Framer Motion covers MVP needs | ✓ Good |
| iframe sandbox for all apps | True isolation; any tech stack works | ✓ Good |
| postMessage RPC (no library) | Zero external deps for bridge layer; full control | ✓ Good |

---
*Last updated: 2026-04-02 after Phase 3 completion*
