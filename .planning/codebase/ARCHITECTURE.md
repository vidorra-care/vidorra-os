# Architecture

**Analysis Date:** 2026-04-01

## Pattern Overview

**Overall:** Layered multi-tier architecture with iframe-based sandboxing

**Key Characteristics:**
- iframe sandbox isolation for all third-party applications
- postMessage RPC protocol (KernelBus) for cross-boundary communication
- Permission-based request interception at the Bridge layer
- Monorepo structure with Kernel (TypeScript), Shell (React), and Apps (framework-agnostic)
- Persistent storage via IndexedDB with cross-app data sharing via namespace isolation
- Event-driven architecture for inter-module communication

## Layers

**Kernel Layer:**
- Purpose: Core runtime logic independent of UI, handles application lifecycle, data storage, theming, and system-wide state
- Location: `packages/kernel/src/`
- Contains: AppRegistry, ThemeEngine, and foundational business logic
- Depends on: `@vidorra/types` for shared type definitions
- Used by: Shell layer and Bridge layer via public exports

**Bridge Layer:**
- Purpose: Mediates communication between Shell and Apps using postMessage RPC, enforces permissions, translates requests to handler invocations
- Location: Not yet implemented; will be created when KernelBus client is developed
- Contains: KernelBus message router, Permission Guard, EventEmitter for push notifications
- Depends on: Kernel layer implementations and type definitions
- Used by: Shell and Apps via postMessage protocol

**Shell Layer:**
- Purpose: React-based UI responsible for all user-visible components and interactions
- Location: `packages/shell/src/`
- Contains: React components for WindowManager, Dock, Menubar, Spotlight, Notifications, Wallpaper (currently placeholder)
- Depends on: `@vidorra/kernel`, `@vidorra/types`, React 18.3.0
- Used by: Primary user interface; orchestrates Kernel services

**App Layer:**
- Purpose: Sandboxed third-party applications running in `<iframe sandbox>` contexts
- Location: `apps/*/src/` for built-in apps (app-store, settings, calculator, etc.)
- Contains: Application-specific logic; each app can use any tech stack (React, Vue, Svelte, plain HTML)
- Depends on: `@vidorra/sdk` (optional; apps can work without it)
- Used by: None; apps are leaf nodes in the dependency graph

**Types Layer:**
- Purpose: Shared TypeScript interfaces and contracts for cross-package communication
- Location: `packages/types/src/`
- Contains: AppManifest, KernelBusMessage, KernelBusResponse, WindowDescriptor, WindowState, MenuItem, SpotlightAction
- Depends on: None
- Used by: Kernel, Shell, SDK, and Apps

## Data Flow

**App Request to Kernel:**

1. App (inside iframe) calls SDK method (e.g., `app.data.collection('ns').insert(record)`)
2. SDK translates to postMessage with `{ id: UUID, method: 'data.insert', params: {...} }`
3. Shell/KernelBus receives postMessage, extracts `event.origin` for authentication
4. Permission Guard validates request against manifest permissions
5. Kernel handler (DataStore, ThemeEngine, etc.) executes the operation
6. Response sent back via postMessage: `{ id: UUID, result: ... }` or `{ id: UUID, error: ... }`
7. App SDK resolves the waiting promise with result

**DataStore Write Flow:**

```
App.data.collection(namespace).insert(record)
  → postMessage: { type: 'data.insert', namespace, record }
  → KernelBus receives + validates origin
  → Permission Guard checks 'datastore.write:namespace' permission
  → DataStore validates record against Zod schema (from manifest)
  → Write to IndexedDB via Dexie
  → Notify all Apps subscribed to namespace via EventEmitter
  → postMessage push to subscriber iframes
```

**Theme Change Push:**

User changes theme in Settings App → ThemeEngine.setMode('dark') → updates CSS variables on `:root` → broadcasts 'theme:changed' event → EventEmitter pushes via postMessage to all subscribed Apps

**State Management:**
- Kernel maintains canonical state in IndexedDB (AppRegistry, DataStore, ThemeEngine)
- Shell holds UI state (focused window, dock state, window positions) in memory
- Apps hold their own state; shared state is accessed through DataStore API
- Event subscriptions enable reactive updates across layer boundaries

## Key Abstractions

**AppManifest:**
- Purpose: Declares app capabilities, permissions, menu structure, default window size
- Examples: `packages/types/src/manifest.ts` defines structure; `registry/built-in-apps.json` stores instances
- Pattern: JSON schema validated in `packages/kernel/src/app-registry.ts` at install time; required fields enforced

**KernelBus:**
- Purpose: RPC protocol wrapper around postMessage enabling reliable request/response semantics
- Examples: Defined in `packages/types/src/kernel-bus.ts`; will be implemented in SDK when Bridge layer created
- Pattern: UUID-based request tracking, AbortController for timeout handling, origin-based authentication

**WindowDescriptor:**
- Purpose: Represents a running application window with position, size, z-index, focus state
- Examples: `packages/types/src/window.ts` defines interface
- Pattern: Shell maintains Map of WindowDescriptors; sends updates to Kernel for persistence

**AppRegistry:**
- Purpose: Manages installed applications, validates manifests, persists to localStorage
- Examples: `packages/kernel/src/app-registry.ts` is singleton instance
- Pattern: Singleton service with async `install()`, `uninstall()`, `getApp()` methods; localStorage-backed persistence

**ThemeEngine:**
- Purpose: System-wide theme management with dark/light/auto modes and CSS variable injection
- Examples: `packages/kernel/src/theme-engine.ts` is singleton instance
- Pattern: Singleton service with subscribe/unsubscribe for reactive updates; applies CSS variables to DOM root

## Entry Points

**Shell Entry:**
- Location: `packages/shell/src/main.tsx`
- Triggers: Browser navigation to `http://localhost:3000` (dev) or production URL
- Responsibilities: Mounts React StrictMode, renders App component, initializes Kernel services

**App Entry (Built-in):**
- Location: `apps/{app-name}/src/main.tsx` or `src/index.html`
- Triggers: Shell opens iframe with manifest `entry` URL
- Responsibilities: Load app code, establish postMessage listeners via SDK, render UI

**Kernel Services Initialization:**
- Location: Implicit; occurs when Shell imports from `@vidorra/kernel`
- Triggers: Module load
- Responsibilities: Instantiate singletons (AppRegistry, ThemeEngine), load persisted state from localStorage/IndexedDB

## Error Handling

**Strategy:** Validation-first at Bridge layer, graceful degradation in Apps

**Patterns:**
- Origin validation at postMessage boundary silently drops unrecognized origins (no error feedback to prevent probing)
- AppRegistry.validate() throws descriptive errors for missing manifest fields
- DataStore operations return error objects with code field for permission denials (403) vs data errors
- ThemeEngine catches localStorage parse errors and starts fresh with defaults
- App-level errors propagated as `{ error: string, code: number }` through KernelBus

## Cross-Cutting Concerns

**Logging:** Not yet configured; currently implicit via browser console and test harnesses

**Validation:** Zod integration planned for DataStore; currently uses manual validation in AppRegistry

**Authentication:** Origin-based (not implemented yet; postMessage origin is inherently verified by browser)

**Authorization/Permissions:** Manifest-declared permissions (not yet enforced; Permission Guard implementation pending)

---

*Architecture analysis: 2026-04-01*
