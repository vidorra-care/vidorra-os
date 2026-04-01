# Technology Stack

**Analysis Date:** 2026-04-01

## Languages

**Primary:**
- TypeScript 5.5+ - All source code and configuration
- JSX/TSX - React component definitions

**Secondary:**
- JavaScript - Configuration files (eslint.config.js)
- YAML - Workspace and build configuration

## Runtime

**Environment:**
- Node.js (version unspecified in `.nvmrc`, uses latest via pnpm)

**Package Manager:**
- pnpm 9.0+ (lockfileVersion 9.0)
- Lockfile: `pnpm-lock.yaml` present

## Frameworks

**Core:**
- React 18.3+ - UI framework for shell and applications
- React DOM 18.3+ - Browser rendering

**Build/Dev:**
- Vite 6.4+ - Build tool and dev server
  - Config: `vite.config.ts` per package
  - React plugin: `@vitejs/plugin-react` 4.7+
  - Dev ports: Shell (3000), App Store (3010)
- TypeScript 5.5+ - Language and type checking (tsc -b)

**Testing:**
- Vitest 3.2+ - Unit and integration testing
  - Config: `vitest.config.ts` (root and package-level)
  - Test environment: Node.js with happy-dom
  - Globals enabled

**Linting/Formatting:**
- ESLint 9.39+ - Code linting
  - Config: `eslint.config.js` (FlatConfig format)
  - Plugins: `@eslint/js`, `typescript-eslint`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`
- Prettier 3.8+ - Code formatting
  - Config: `.prettierrc` (no semicolons, single quotes, trailing commas)
  - Print width: 100 characters, tab width: 2

## Key Dependencies

**Critical:**
- React 18.3.1 - UI rendering (runtime dependency in shell, app-store, settings)
- React DOM 18.3.1 - DOM rendering (runtime dependency in shell, app-store, settings)
- TypeScript 5.9.3 - Type system and compilation
- Vite 6.4.1 - Build bundler

**Testing/Development:**
- Vitest 3.2.4 - Test runner with happy-dom integration
- happy-dom 14.12.3 - DOM implementation for tests (used in kernel testing)

**Type Safety:**
- @types/react 18.3.28 - React type definitions
- @types/react-dom 18.3.7 - React DOM type definitions

## Configuration

**Environment:**
- No `.env` files detected - configuration is static or embedded
- Development ports hardcoded in Vite configs

**Build:**
- TypeScript strict mode enabled (tsconfig.json)
- ES2022 target, ESNext modules
- JSX set to "react-jsx" (new JSX transform)
- Source maps enabled for debugging
- Bundler module resolution

## Platform Requirements

**Development:**
- Node.js runtime
- pnpm package manager
- TypeScript compiler
- Vite dev server

**Production:**
- Modern web browser with:
  - ES2022 support
  - localStorage API
  - window.matchMedia API
  - DOM APIs

---

*Stack analysis: 2026-04-01*
