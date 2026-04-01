# External Integrations

**Analysis Date:** 2026-04-01

## APIs & External Services

**App Manifest Loading:**
- HTTP Fetch API - Used to load remote app manifests
  - Method: Standard `fetch()` via AppRegistry
  - Format: JSON-based AppManifest files
  - Example usage: `fetch(manifestUrl)` in `packages/kernel/src/app-registry.ts`
  - No external API SDK/client library used

## Data Storage

**Databases:**
- None detected - No database integrations

**File Storage:**
- Browser localStorage only
  - Keys:
    - `vidorra:registry` - Stores installed applications in JSON format (AppRegistry in `packages/kernel/src/app-registry.ts`)
    - `vidorra:theme` - Stores theme mode preference (ThemeEngine in `packages/kernel/src/theme-engine.ts`)
  - Scope: Client-side browser storage, no server-side persistence

**Caching:**
- localStorage acts as simple cache
- No dedicated caching service

## Authentication & Identity

**Auth Provider:**
- None detected
- No authentication/authorization system in place
- Open system without user identity management

## Monitoring & Observability

**Error Tracking:**
- None detected - No error tracking integration

**Logs:**
- None detected - No structured logging framework
- Errors thrown as JavaScript exceptions in `AppRegistry.install()` and `AppRegistry.validate()`

## CI/CD & Deployment

**Hosting:**
- Not configured - Framework-agnostic, can be deployed to any static host
- Vite builds to `dist/` directory (default)

**CI Pipeline:**
- Not configured - No CI/CD integration detected

## Environment Configuration

**Required env vars:**
- None detected - Static configuration

**Secrets location:**
- No secrets management detected
- No `.env` files found

## Webhooks & Callbacks

**Incoming:**
- None detected

**Outgoing:**
- Manifest fetch (GET) to remote app entry points
  - URL pattern: `{entry}/manifest.json` or custom manifest URLs
  - Response validation required (JSON with AppManifest schema in `packages/types/src/manifest.ts`)

## Cross-Browser APIs Used

**localStorage:**
- Persistent client-side key-value storage
- Used by: AppRegistry, ThemeEngine
- Keys: `vidorra:registry`, `vidorra:theme`

**window.matchMedia:**
- Media query API for system theme preference detection
- Used by: ThemeEngine for auto theme mode detection (`prefers-color-scheme: dark`)
- Listener: `change` event handler for real-time theme updates

**fetch:**
- Standard HTTP client
- Used by: AppRegistry for manifest loading
- No custom axios or HTTP client library

---

*Integration audit: 2026-04-01*
