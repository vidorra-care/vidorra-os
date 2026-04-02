# Phase 2 Shell Visual Fidelity Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fully align the Vidorra OS shell with the macOS reference project (`.reference/macos-preact-main`) in visual fidelity and interaction quality, covering CSS variables, TrafficLights, WindowFrame, Dock, Menubar with full dropdown menus, ContextMenu, and a functional ActionCenter panel.

**Architecture:** Seven independent plans (02-09 through 02-15), each targeting one component layer. CSS foundation goes first (02-09) since all subsequent plans depend on the HSL variable system. Plans 02-10 through 02-14 can each be verified in isolation. Plan 02-15 (ActionCenter) integrates with ThemeEngine.

**Tech Stack:** React 18 + TypeScript + CSS Modules + Zustand + Framer Motion. No new dependencies introduced.

---

## Task 1 (Plan 02-09): CSS Foundation — HSL Variable System

**Files:**
- Modify: `packages/shell/src/global.css`

### Step 1: Replace global.css with the HSL variable system

Open `packages/shell/src/global.css` and replace its entire contents with:

```css
/* ===== Reset ===== */
*, *::before, *::after {
  box-sizing: border-box;
}

/* ===== Theme Tokens — Light (default) ===== */
body,
body[data-theme='light'] {
  /* Primary (macOS blue) */
  --app-color-primary: hsl(211, 100%, 50%);
  --app-color-primary-hsl: 211, 100%, 50%;
  --app-color-primary-contrast: hsl(240, 24%, 100%);
  --app-color-primary-contrast-hsl: 240, 24%, 100%;

  /* Dark */
  --app-color-dark: hsl(240, 3%, 11%);
  --app-color-dark-hsl: 240, 3%, 11%;
  --app-color-dark-contrast: hsl(240, 24%, 100%);
  --app-color-dark-contrast-hsl: 240, 24%, 100%;

  /* Light */
  --app-color-light: hsl(240, 24%, 100%);
  --app-color-light-hsl: 240, 24%, 100%;
  --app-color-light-contrast: hsl(0, 0%, 11%);
  --app-color-light-contrast-hsl: 0, 0%, 11%;

  /* Font */
  --app-font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Helvetica Neue',
    'Helvetica', 'Arial', sans-serif;

  /* Grey scale */
  --app-color-grey-50-hsl:  0, 0%, 98%;
  --app-color-grey-100-hsl: 0, 0%, 96%;
  --app-color-grey-200-hsl: 0, 0%, 93%;
  --app-color-grey-300-hsl: 0, 0%, 88%;
  --app-color-grey-400-hsl: 0, 0%, 74%;
  --app-color-grey-500-hsl: 0, 0%, 62%;
  --app-color-grey-600-hsl: 0, 0%, 46%;
  --app-color-grey-700-hsl: 0, 0%, 38%;
  --app-color-grey-800-hsl: 0, 0%, 26%;
  --app-color-grey-900-hsl: 0, 0%, 13%;

  /* Legacy compat — kept so existing components don't break */
  --color-text: rgba(0, 0, 0, 0.85);
  --color-text-secondary: rgba(0, 0, 0, 0.5);
  --color-bg: rgba(255, 255, 255, 0.8);
  --color-surface: rgba(245, 245, 245, 0.92);
  --color-border: rgba(0, 0, 0, 0.1);
  --color-selection: rgba(0, 102, 204, 0.15);
  --menubar-height: 1.4rem;
  --dock-height: 5.2rem;
}

/* ===== Theme Tokens — Dark ===== */
body.dark {
  /* Primary stays the same */
  --app-color-primary: hsl(211, 100%, 50%);
  --app-color-primary-hsl: 211, 100%, 50%;
  --app-color-primary-contrast: hsl(240, 24%, 100%);
  --app-color-primary-contrast-hsl: 240, 24%, 100%;

  /* Dark ↔ Light swapped */
  --app-color-dark: hsl(240, 24%, 100%);
  --app-color-dark-hsl: 240, 24%, 100%;
  --app-color-dark-contrast: hsl(0, 0%, 11%);
  --app-color-dark-contrast-hsl: 0, 0%, 11%;

  --app-color-light: hsl(240, 3%, 11%);
  --app-color-light-hsl: 240, 3%, 11%;
  --app-color-light-contrast: hsl(240, 24%, 100%);
  --app-color-light-contrast-hsl: 240, 24%, 100%;

  /* Legacy compat */
  --color-text: rgba(255, 255, 255, 0.9);
  --color-text-secondary: rgba(255, 255, 255, 0.5);
  --color-bg: rgba(30, 30, 30, 0.85);
  --color-surface: rgba(40, 40, 40, 0.92);
  --color-border: rgba(255, 255, 255, 0.12);
  --color-selection: rgba(0, 122, 255, 0.3);
}

/* ===== Base Styles ===== */
html, body, #root {
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
  overflow: hidden;
  font-family: var(--app-font-family);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

*, * {
  transition: background-color 150ms ease-in, background 150ms ease-in;
}

button {
  color: inherit;
  border: 0;
  outline: 0;
  margin: 0;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  user-select: none;
  appearance: none;
  cursor: default;
  background-color: transparent;
  font-family: var(--app-font-family);
  -webkit-tap-highlight-color: transparent;
}

*:focus {
  outline: none;
}
```

### Step 2: Run the dev server to verify no visual regressions

```bash
cd d:/Code/Study/vidorra-os
pnpm --filter @vidorra/shell dev
```

Open `http://localhost:5173`. The shell should look identical to before (no visible change yet — this plan only adds variables). Check browser DevTools → Elements → `body` to confirm the new CSS variables are present.

### Step 3: Run tests

```bash
pnpm --filter @vidorra/shell test
```

Expected: all tests pass (no CSS is tested, but this verifies nothing broke).

### Step 4: Commit

```bash
cd d:/Code/Study/vidorra-os
git add packages/shell/src/global.css
git commit -m "feat(02-09): add HSL CSS variable system for theme-aware components"
```

---

## Task 2 (Plan 02-10): TrafficLights — CSS-driven hover icons + unfocused state

**Files:**
- Modify: `packages/shell/src/components/WindowFrame/TrafficLights.module.css`
- Modify: `packages/shell/src/components/WindowFrame/TrafficLights.tsx`

> **Context:** The current TrafficLights already has the right SVG icons and correct hex colors, but uses inline styles for colors, doesn't use CSS variables, and the unfocused state uses `#b6b6b7`. We need to migrate to CSS classes and use `--app-color-*` variables.

### Step 1: Rewrite TrafficLights.module.css

Replace `packages/shell/src/components/WindowFrame/TrafficLights.module.css` entirely:

```css
.container {
  --button-size: 0.75rem;

  display: flex;
  align-items: center;
  gap: 0.5rem;

  position: absolute;
  top: 0.9rem;
  left: 0.9rem;
}

.container svg {
  visibility: hidden;
}

.container:hover svg {
  visibility: visible;
}

/* When the parent window is unfocused, grey out all lights */
.unfocused .closeLight,
.unfocused .minimizeLight,
.unfocused .maximizeLight {
  --bgcolor: hsla(var(--app-color-dark-hsl), 0.25);
  --border-color: hsla(var(--app-color-dark-hsl), 0.4);
}

.light {
  height: var(--button-size);
  width: var(--button-size);
  border-radius: 50%;
  cursor: default;
  outline: none;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  flex-shrink: 0;
  border: none;
  background-color: var(--bgcolor);
  box-shadow: 0 0 0 0.5px var(--border-color);
}

.closeLight {
  composes: light;
  --bgcolor: #ff5f56;
  --border-color: #e0443e;
}

.minimizeLight {
  composes: light;
  --bgcolor: #ffbd2e;
  --border-color: #dea123;
}

.maximizeLight {
  composes: light;
  --bgcolor: #27c93f;
  --border-color: #1aab29;
}

/* Rotate the maximize/expand icon 90 degrees like macOS */
.maximizeLight svg {
  transform: rotate(90deg);
}
```

### Step 2: Rewrite TrafficLights.tsx

Replace `packages/shell/src/components/WindowFrame/TrafficLights.tsx` entirely:

```tsx
import { useWindowStore } from '../../stores/useWindowStore'
import styles from './TrafficLights.module.css'

interface TrafficLightsProps {
  windowId: string
  focused: boolean
}

function CloseIcon() {
  return (
    <svg width={7} height={7} fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        stroke="#4d0000"
        strokeWidth={1.2}
        strokeLinecap="round"
        d="M1.182 5.99L5.99 1.182m0 4.95L1.182 1.323"
      />
    </svg>
  )
}

function MinimizeIcon() {
  return (
    <svg width={6} height={2} fill="none" xmlns="http://www.w3.org/2000/svg">
      <path stroke="#4d3400" strokeWidth={2} strokeLinecap="round" d="M.61 1h5.8" />
    </svg>
  )
}

function MaximizeIcon() {
  return (
    <svg width={8} height={8} fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        stroke="#004d00"
        strokeWidth={1.2}
        strokeLinecap="round"
        d="M1.5 6.5L6.5 1.5M4.5 1.5H6.5V3.5M1.5 4.5V6.5H3.5"
      />
    </svg>
  )
}

export function TrafficLights({ windowId, focused }: TrafficLightsProps) {
  const closeWindow = useWindowStore((s) => s.closeWindow)
  const setWindowState = useWindowStore((s) => s.setWindowState)
  const toggleMaximize = useWindowStore((s) => s.toggleMaximize)

  const stopPropagation = (e: React.MouseEvent) => e.stopPropagation()

  const containerClass = [
    styles.container,
    !focused ? styles.unfocused : '',
  ].filter(Boolean).join(' ')

  return (
    <div className={containerClass} onMouseDown={stopPropagation}>
      <button
        className={styles.closeLight}
        aria-label="Close window"
        onClick={() => closeWindow(windowId)}
        onMouseDown={stopPropagation}
      >
        <CloseIcon />
      </button>
      <button
        className={styles.minimizeLight}
        aria-label="Minimize window"
        onClick={() => setWindowState(windowId, 'minimized')}
        onMouseDown={stopPropagation}
      >
        <MinimizeIcon />
      </button>
      <button
        className={styles.maximizeLight}
        aria-label="Maximize window"
        onClick={() => toggleMaximize(windowId)}
        onMouseDown={stopPropagation}
      >
        <MaximizeIcon />
      </button>
    </div>
  )
}
```

### Step 3: Verify visually

Start the dev server and open a window. Verify:
1. Three lights show correct red/yellow/green colors
2. SVG icons hidden by default, visible on `.container:hover`
3. Click another window to unfocus — the inactive window's lights turn grey

### Step 4: Run tests

```bash
pnpm --filter @vidorra/shell test
```

Expected: all tests pass.

### Step 5: Commit

```bash
cd d:/Code/Study/vidorra-os
git add packages/shell/src/components/WindowFrame/TrafficLights.tsx \
        packages/shell/src/components/WindowFrame/TrafficLights.module.css
git commit -m "feat(02-10): migrate TrafficLights to CSS classes, CSS-variable unfocused state"
```

---

## Task 3 (Plan 02-11): WindowFrame — titlebar, shadows, dark mode border

**Files:**
- Modify: `packages/shell/src/components/WindowFrame/WindowFrame.module.css`

> **Context:** Align shadow strength, titlebar height, and add dark mode inner border. The `.tsx` file doesn't need changes.

### Step 1: Update WindowFrame.module.css

Replace `packages/shell/src/components/WindowFrame/WindowFrame.module.css` entirely:

```css
.windowFrame {
  width: 100%;
  height: 100%;
  display: grid;
  grid-template-rows: 2.5rem 1fr;
  border-radius: 0.75rem;
  overflow: hidden;
  background: var(--color-bg);
  font-family: var(--app-font-family);
  cursor: default;
  position: relative;
}

/* Focused window */
.windowFrame[data-focused='true'] {
  box-shadow:
    0 0 0 0.5px hsla(var(--app-color-dark-hsl), 0.18),
    0 33px 81px rgba(0, 0, 0, 0.31);
}

/* Unfocused window */
.windowFrame[data-focused='false'] {
  box-shadow:
    0 0 0 0.5px hsla(var(--app-color-dark-hsl), 0.12),
    0 16px 40px rgba(0, 0, 0, 0.16);
}

/* Dark mode: add inner highlight border */
body.dark .windowFrame[data-focused='true'] {
  box-shadow:
    inset 0 0 0 0.9px hsla(var(--app-color-dark-hsl), 0.3),
    0 0 0 1px hsla(var(--app-color-light-hsl), 0.5),
    0 33px 81px rgba(0, 0, 0, 0.5);
}

.titlebar {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  padding: 0 1rem;
  background-color: hsla(var(--app-color-light-hsl), 0.3);
  backdrop-filter: blur(12px) saturate(180%);
  -webkit-backdrop-filter: blur(12px) saturate(180%);
  border-bottom: 1px solid hsla(var(--app-color-dark-hsl), 0.1);
  user-select: none;
  -webkit-user-select: none;
}

.title {
  font-size: 0.8rem;
  font-weight: 500;
  letter-spacing: 0.3px;
  color: var(--color-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  pointer-events: none;
  text-shadow: 0 0 1px hsla(0, 0%, 0%, 0.1);
}

.content {
  overflow: hidden;
  position: relative;
}

.content iframe {
  width: 100%;
  height: 100%;
  border: none;
  display: block;
}

.maximized {
  border-radius: 0;
}

.minimizedHidden {
  visibility: hidden;
  pointer-events: none;
}

.dragging {
  user-select: none;
}

.dragOverlay {
  position: absolute;
  inset: 0;
  z-index: 1;
}
```

### Step 2: Verify visually

Open two windows. Check:
1. Titlebar is taller (2.5rem vs old 28px)
2. Focused window has stronger shadow than unfocused
3. Toggle dark mode (will work properly after Plan 02-15 — for now you can test by adding `dark` class to `<body>` in DevTools)

### Step 3: Run tests

```bash
pnpm --filter @vidorra/shell test
```

Expected: all tests pass.

### Step 4: Commit

```bash
cd d:/Code/Study/vidorra-os
git add packages/shell/src/components/WindowFrame/WindowFrame.module.css
git commit -m "feat(02-11): align WindowFrame titlebar height, shadows, dark mode border"
```

---

## Task 4 (Plan 02-12): Dock — theme-aware glass, dot color, divider support

**Files:**
- Modify: `packages/shell/src/components/Dock/Dock.module.css`
- Modify: `packages/shell/src/components/Dock/Dock.tsx`
- Modify: `packages/types/src/manifest.ts`

### Step 1: Add dockBreaksBefore to AppManifest

Open `packages/types/src/manifest.ts` and add `dockBreaksBefore?: boolean` to the `AppManifest` interface:

```typescript
export interface AppManifest {
  id: string
  name: string
  version: string
  entry: string
  icon: string
  category: string
  defaultSize: { width: number; height: number }
  minSize?: { width: number; height: number }
  permissions?: string[]
  menubar?: Record<string, MenuItem[]>
  spotlightActions?: SpotlightAction[]
  dockBreaksBefore?: boolean  // ← ADD THIS
}
```

### Step 2: Rewrite Dock.module.css

Replace `packages/shell/src/components/Dock/Dock.module.css` entirely:

```css
.container {
  position: fixed;
  margin-bottom: 0.3rem;
  bottom: 0;
  left: 0;
  z-index: 9900;
  width: 100%;
  height: var(--dock-height, 5.2rem);
  padding: 0.4rem;
  display: flex;
  justify-content: center;
}

.dockEl {
  background-color: hsla(var(--app-color-light-hsl), 0.4);
  box-shadow:
    inset 0 0 0 0.2px hsla(var(--app-color-grey-100-hsl), 0.7),
    0 0 0 0.2px hsla(var(--app-color-grey-900-hsl), 0.7),
    hsla(0, 0%, 0%, 0.3) 2px 5px 19px 7px;
  position: relative;
  padding: 0.3rem;
  border-radius: 1.2rem;
  height: 100%;
  display: flex;
  align-items: flex-end;
}

.dockEl::before {
  content: '';
  width: 100%;
  height: 100%;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-radius: inherit;
  position: absolute;
  top: 0;
  left: 0;
  z-index: -1;
}

.divider {
  height: 100%;
  width: 0.2px;
  background-color: hsla(var(--app-color-dark-hsl), 0.3);
  margin: 0 2px;
  align-self: stretch;
}

.dockItemButton {
  height: 100%;
  width: auto;
  cursor: default;
  transform-origin: bottom;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  align-items: center;
  position: relative;
}

.dockItemButton:hover .tooltip,
.dockItemButton:focus-visible .tooltip {
  display: block;
}

.dockIcon {
  user-select: none;
  -webkit-user-drag: none;
  display: block;
}

.dot {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  /* Theme-aware: dark on light bg, light on dark bg */
  background-color: var(--app-color-dark);
  margin-top: 2px;
  opacity: var(--opacity, 0);
  transition: opacity 150ms linear;
}

.tooltip {
  display: none;
  /* Keep tooltip invisible while no hover, but position it */
  white-space: nowrap;
  position: absolute;
  top: -35%;
  left: 50%;
  transform: translateX(-50%);
  padding: 0.5rem 0.75rem;
  border-radius: 0.375rem;
  background-color: hsla(var(--app-color-light-hsl), 0.5);
  backdrop-filter: blur(5px);
  box-shadow: rgba(0, 0, 0, 0.3) 0px 1px 5px 2px;
  color: var(--app-color-light-contrast);
  font-family: var(--app-font-family);
  font-weight: 400;
  font-size: 0.9rem;
  letter-spacing: 0.4px;
  pointer-events: none;
  z-index: 9901;
}

/* Dark mode: tooltip gets double border */
body.dark .tooltip {
  box-shadow:
    inset 0 0 0 0.9px hsla(var(--app-color-dark-hsl), 0.3),
    0 0 0 1.2px hsla(var(--app-color-light-hsl), 0.3),
    rgba(0, 0, 0, 0.3) 0px 1px 5px 2px;
}
```

### Step 3: Add divider rendering to Dock.tsx

Open `packages/shell/src/components/Dock/Dock.tsx`. Find the `{apps.map(...)}` block and wrap each item to support `dockBreaksBefore`:

```tsx
{apps.map((app) => {
  const isRunning = windows.some((w) => w.appId === app.id)
  return (
    <div key={app.id} style={{ display: 'contents' }}>
      {app.dockBreaksBefore && (
        <div className={styles.divider} aria-hidden="true" />
      )}
      <DockItem
        app={app}
        mouseX={mouseX}
        isRunning={isRunning}
        onOpen={handleOpen}
      />
    </div>
  )
})}
```

Full `Dock.tsx` after edit:

```tsx
import { useEffect, useState } from 'react'
import { useMotionValue } from 'framer-motion'
import type { AppManifest } from '@vidorra/types'
import { appRegistry } from '@vidorra/kernel'
import { useWindowStore } from '../../stores/useWindowStore'
import { DockItem } from './DockItem'
import styles from './Dock.module.css'

export function Dock() {
  const [apps, setApps] = useState<AppManifest[]>([])
  const mouseX = useMotionValue<number | null>(null)

  const windows = useWindowStore((s) => s.windows)
  const openWindow = useWindowStore((s) => s.openWindow)
  const focusWindow = useWindowStore((s) => s.focusWindow)
  const setWindowState = useWindowStore((s) => s.setWindowState)

  useEffect(() => {
    setApps(appRegistry.getAllApps())
  }, [])

  const handleOpen = (app: AppManifest) => {
    const existing = windows.find((w) => w.appId === app.id)
    if (existing) {
      if (existing.state === 'minimized') setWindowState(existing.id, 'normal')
      focusWindow(existing.id)
      return
    }
    openWindow({
      id: crypto.randomUUID(),
      appId: app.id,
      title: app.name,
      url: app.entry,
      icon: app.icon,
      rect: {
        x: Math.round((window.innerWidth - app.defaultSize.width) / 2),
        y: Math.round((window.innerHeight - 24 - app.defaultSize.height) / 2) + 24,
        width: app.defaultSize.width,
        height: app.defaultSize.height,
      },
      state: 'normal',
      minWidth: app.minSize?.width ?? 200,
      minHeight: app.minSize?.height ?? 150,
    })
  }

  return (
    <section className={styles.container}>
      <div
        className={styles.dockEl}
        onMouseMove={(e) => mouseX.set(e.nativeEvent.x)}
        onMouseLeave={() => mouseX.set(null)}
      >
        {apps.map((app) => {
          const isRunning = windows.some((w) => w.appId === app.id)
          return (
            <div key={app.id} style={{ display: 'contents' }}>
              {app.dockBreaksBefore && (
                <div className={styles.divider} aria-hidden="true" />
              )}
              <DockItem
                app={app}
                mouseX={mouseX}
                isRunning={isRunning}
                onOpen={handleOpen}
              />
            </div>
          )
        })}
      </div>
    </section>
  )
}
```

### Step 4: Run tests

```bash
pnpm --filter @vidorra/shell test
```

Expected: all tests pass.

### Step 5: Verify visually

Dock glass effect should now respond to dark mode (test by toggling `body.dark` in DevTools). Running dot should be dark-colored on light background.

### Step 6: Commit

```bash
cd d:/Code/Study/vidorra-os
git add packages/shell/src/components/Dock/Dock.module.css \
        packages/shell/src/components/Dock/Dock.tsx \
        packages/types/src/manifest.ts
git commit -m "feat(02-12): dock theme-aware glass, dark-mode dot, divider support"
```

---

## Task 5 (Plan 02-13): Menubar — full dropdown menu system

**Files:**
- Create: `packages/shell/src/stores/useMenubarStore.ts`
- Create: `packages/shell/src/data/finder.menu.config.ts`
- Create: `packages/shell/src/components/Menubar/Menu.tsx`
- Create: `packages/shell/src/components/Menubar/Menu.module.css`
- Rewrite: `packages/shell/src/components/Menubar/Menubar.tsx`
- Rewrite: `packages/shell/src/components/Menubar/Menubar.module.css`

### Step 1: Create useMenubarStore.ts

Create `packages/shell/src/stores/useMenubarStore.ts`:

```typescript
import { create } from 'zustand'

interface MenubarStore {
  activeMenu: string
  setActiveMenu: (id: string) => void
  closeMenu: () => void
}

export const useMenubarStore = create<MenubarStore>((set) => ({
  activeMenu: '',
  setActiveMenu: (id) => set({ activeMenu: id }),
  closeMenu: () => set({ activeMenu: '' }),
}))
```

### Step 2: Create finder.menu.config.ts

Create `packages/shell/src/data/finder.menu.config.ts`. This contains the default Vidorra OS menubar structure (shown when no app is focused). Simplified but faithful to the reference:

```typescript
export interface MenuItemConfig {
  title: string
  disabled?: boolean
  breakAfter?: boolean
}

export interface MenuConfig {
  [menuId: string]: {
    title: string
    items: Record<string, MenuItemConfig>
  }
}

export const defaultMenuConfig: MenuConfig = {
  apple: {
    title: '',  // rendered as Apple icon
    items: {
      'about': { title: 'About Vidorra OS', breakAfter: true },
      'preferences': { title: 'System Settings...', breakAfter: true },
      'sleep': { title: 'Sleep', disabled: true },
      'restart': { title: 'Restart...', disabled: true },
      'shutdown': { title: 'Shut Down...', disabled: true },
    },
  },
  finder: {
    title: 'Vidorra',
    items: {
      'about': { title: 'About Vidorra OS', breakAfter: true },
      'hide': { title: 'Hide Vidorra', disabled: true },
      'hide-others': { title: 'Hide Others', disabled: true },
    },
  },
  file: {
    title: 'File',
    items: {
      'new-window': { title: 'New Window', disabled: true, breakAfter: true },
      'close': { title: 'Close Window', disabled: true },
    },
  },
  edit: {
    title: 'Edit',
    items: {
      'undo': { title: 'Undo', disabled: true },
      'redo': { title: 'Redo', disabled: true, breakAfter: true },
      'cut': { title: 'Cut', disabled: true },
      'copy': { title: 'Copy', disabled: true },
      'paste': { title: 'Paste', disabled: true },
      'select-all': { title: 'Select All', disabled: true },
    },
  },
  window: {
    title: 'Window',
    items: {
      'minimize': { title: 'Minimize', disabled: true },
      'zoom': { title: 'Zoom', disabled: true, breakAfter: true },
      'bring-to-front': { title: 'Bring All to Front', disabled: true },
    },
  },
  help: {
    title: 'Help',
    items: {
      'help': { title: 'Vidorra Help', disabled: true },
    },
  },
}
```

### Step 3: Create Menu.tsx

Create `packages/shell/src/components/Menubar/Menu.tsx`:

```tsx
import { useEffect, useRef } from 'react'
import type { MenuItemConfig } from '../../data/finder.menu.config'
import styles from './Menu.module.css'

interface MenuProps {
  items: Record<string, MenuItemConfig>
  onClose: () => void
}

export function Menu({ items, onClose }: MenuProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const itemKeys = Object.keys(items)

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        onClose()
      }
    }
    // Small delay to avoid same-click-that-opened triggering close
    const timer = setTimeout(() => document.addEventListener('mousedown', handler), 0)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('mousedown', handler)
    }
  }, [onClose])

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    const buttons = containerRef.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')
    if (!buttons) return
    const arr = Array.from(buttons)
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      arr[(index + 1) % arr.length]?.focus()
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      arr[(index - 1 + arr.length) % arr.length]?.focus()
    }
  }

  let focusableIndex = 0

  return (
    <div className={styles.container} ref={containerRef} tabIndex={-1}>
      {itemKeys.map((key) => {
        const item = items[key]
        const currentIndex = focusableIndex
        if (!item.disabled) focusableIndex++

        return (
          <div key={key}>
            <button
              className={[styles.menuItem, item.disabled ? styles.disabled : ''].filter(Boolean).join(' ')}
              disabled={item.disabled}
              onKeyDown={(e) => handleKeyDown(e, currentIndex)}
            >
              {item.title}
            </button>
            {item.breakAfter && <div className={styles.divider} />}
          </div>
        )
      })}
    </div>
  )
}
```

### Step 4: Create Menu.module.css

Create `packages/shell/src/components/Menubar/Menu.module.css`:

```css
.container {
  display: block;
  min-width: 16rem;
  width: max-content;
  padding: 0.5rem;
  position: relative;
  user-select: none;
  background-color: hsla(var(--app-color-light-hsl), 0.3);
  backdrop-filter: blur(25px);
  -webkit-backdrop-filter: blur(25px);
  border-radius: 0.5rem;
  box-shadow: rgba(0, 0, 0, 0.3) 0px 0px 11px 0px;
}

body.dark .container {
  box-shadow:
    rgba(0, 0, 0, 0.3) 0px 0px 11px 0px,
    inset 0 0 0 0.9px hsla(var(--app-color-dark-hsl), 0.3),
    0 0 0 1.2px hsla(var(--app-color-light-hsl), 0.3);
}

.menuItem {
  display: flex;
  justify-content: flex-start;
  width: 100%;
  padding: 0.2rem 0.4rem;
  margin: 0.1rem 0;
  letter-spacing: 0.4px;
  font-weight: 400;
  font-size: 0.875rem;
  border-radius: 0.3rem;
  cursor: default;
  color: hsla(var(--app-color-dark-hsl), 1);
  background: transparent;
  border: none;
  text-align: left;
  font-family: var(--app-font-family);
  transition: none;
}

.menuItem:not(.disabled):hover,
.menuItem:not(.disabled):focus-visible {
  background-color: var(--app-color-primary);
  color: var(--app-color-primary-contrast);
}

.disabled {
  opacity: 0.5;
  cursor: default;
}

.divider {
  width: 100%;
  height: 0.2px;
  background-color: hsla(var(--app-color-dark-hsl), 0.2);
  margin: 2px 0;
}
```

### Step 5: Rewrite Menubar.tsx

Replace `packages/shell/src/components/Menubar/Menubar.tsx` entirely:

```tsx
import { useRef, useEffect } from 'react'
import { useWindowStore } from '../../stores/useWindowStore'
import { useMenubarStore } from '../../stores/useMenubarStore'
import { defaultMenuConfig, type MenuConfig } from '../../data/finder.menu.config'
import { Menu } from './Menu'
import { MenubarClock } from './MenubarClock'
import styles from './Menubar.module.css'

function AppleIcon() {
  return (
    <svg width="13" height="16" viewBox="0 0 814 1000" fill="currentColor" aria-hidden="true">
      <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-43.4-150.3-109.6C27.8 766.4 1 637 1 524.3c0-221.1 144.4-338.2 285.7-338.2 75.5 0 138.5 49.9 185.5 49.9 44.9 0 118.1-52.7 203.7-52.7 32.4 0 117.6 1.3 177.3 64.3zm-158.3-81.4c31.1-36.9 53.1-88.1 53.1-139.3 0-7.1-.6-14.3-1.9-20.1-50.6 1.9-110.8 33.7-147.1 75.8-28.5 32.4-55.1 83.6-55.1 135.5 0 7.8 1.3 15.6 1.9 18.1 3.2.6 8.4 1.3 13.6 1.3 45.4 0 102.5-30.4 135.5-71.3z" />
    </svg>
  )
}

export function Menubar() {
  const { activeMenu, setActiveMenu, closeMenu } = useMenubarStore()
  const menubarRef = useRef<HTMLElement>(null)

  const focusedWindow = useWindowStore((s) =>
    s.windows.find((w) => w.focused) ?? null
  )

  // For now, always use default Vidorra config.
  // Phase 4 SDK will inject app-specific menus via manifest.
  const menuConfig: MenuConfig = defaultMenuConfig

  const menuIds = Object.keys(menuConfig)

  // Close menu when clicking outside the menubar
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!menubarRef.current?.contains(e.target as Node)) {
        closeMenu()
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [closeMenu])

  return (
    <header className={styles.menubar} ref={menubarRef}>
      <div className={styles.leftSection}>
        {menuIds.map((menuId) => {
          const menuDef = menuConfig[menuId]
          const isActive = activeMenu === menuId

          return (
            <div key={menuId} className={styles.menuWrapper}>
              <button
                className={[
                  styles.menuButton,
                  menuId === 'apple' ? styles.appleButton : '',
                  menuId === 'finder' ? styles.appNameButton : '',
                  isActive ? styles.active : '',
                ].filter(Boolean).join(' ')}
                onClick={() => setActiveMenu(isActive ? '' : menuId)}
                onMouseEnter={() => activeMenu && activeMenu !== menuId && setActiveMenu(menuId)}
                aria-haspopup="menu"
                aria-expanded={isActive}
              >
                {menuId === 'apple' ? <AppleIcon /> : menuDef.title}
              </button>

              {isActive && (
                <div className={styles.menuDropdown}>
                  <Menu
                    items={menuDef.items}
                    onClose={closeMenu}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className={styles.rightSection}>
        <MenubarClock />
      </div>
    </header>
  )
}
```

### Step 6: Rewrite Menubar.module.css

Replace `packages/shell/src/components/Menubar/Menubar.module.css` entirely:

```css
.menubar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: var(--menubar-height, 1.4rem);
  display: flex;
  align-items: center;
  color: var(--app-color-light-contrast);
  fill: var(--app-color-light-contrast);
  z-index: 9950;
  user-select: none;
  -webkit-user-select: none;
}

/* Blur layer sits behind menu items so z-index stacking is correct */
.menubar::before {
  content: '';
  position: fixed;
  left: 0;
  top: 0;
  width: 100%;
  height: var(--menubar-height, 1.4rem);
  background-color: hsla(var(--app-color-light-hsl), 0.3);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  z-index: -1;
}

.leftSection {
  display: flex;
  align-items: center;
  height: 100%;
}

.rightSection {
  margin-left: auto;
  display: flex;
  align-items: center;
  height: 100%;
  padding-right: 0.5rem;
  font-size: 0.8rem;
  font-weight: 500;
}

.menuWrapper {
  position: relative;
  height: 100%;
  display: flex;
  align-items: center;
}

.menuButton {
  font-weight: 500;
  font-size: 0.8rem;
  font-family: var(--app-font-family);
  letter-spacing: 0.3px;
  height: 100%;
  padding: 0 0.5rem;
  border-radius: 0.25rem;
  color: var(--app-color-light-contrast);
  fill: var(--app-color-light-contrast);
  position: relative;
  z-index: 1;
  text-shadow: 0 0 1px hsla(0, 0%, 0%, 0.1);
}

.menuButton:hover,
.menuButton.active {
  background-color: hsla(var(--app-color-grey-100-hsl), 0.3);
}

.appleButton {
  padding: 0 0.7rem;
  margin: 0 0 0 0.25rem;
}

.appNameButton {
  font-weight: 600;
  margin: 0 4px;
}

.menuDropdown {
  position: absolute;
  top: 100%;
  left: 0;
  margin-top: 1.5px;
  z-index: 9960;
}
```

### Step 7: Run tests

```bash
pnpm --filter @vidorra/shell test
```

Expected: all tests pass.

### Step 8: Verify visually

1. Click any menu button — dropdown panel appears
2. Hover between buttons while one is open — menu switches (slidethrough effect)
3. Click outside — menu closes
4. Press Escape — menu closes
5. Arrow keys navigate items in dropdown

### Step 9: Commit

```bash
cd d:/Code/Study/vidorra-os
git add packages/shell/src/stores/useMenubarStore.ts \
        packages/shell/src/data/finder.menu.config.ts \
        packages/shell/src/components/Menubar/Menubar.tsx \
        packages/shell/src/components/Menubar/Menubar.module.css \
        packages/shell/src/components/Menubar/Menu.tsx \
        packages/shell/src/components/Menubar/Menu.module.css
git commit -m "feat(02-13): full menubar dropdown system with keyboard nav and default Vidorra menus"
```

---

## Task 6 (Plan 02-14): ContextMenu — theme-aware colors

**Files:**
- Modify: `packages/shell/src/components/ContextMenu/ContextMenu.module.css`

### Step 1: Update ContextMenu.module.css

Replace `packages/shell/src/components/ContextMenu/ContextMenu.module.css` entirely:

```css
.contextMenu {
  position: fixed;
  z-index: 99999;
  min-width: 16rem;
  padding: 0.5rem;
  user-select: none;
  -webkit-user-select: none;
  background-color: hsla(var(--app-color-light-hsl), 0.3);
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
  border-radius: 0.5rem;
  box-shadow: rgba(0, 0, 0, 0.3) 0px 0px 11px 0px;
}

body.dark .contextMenu {
  box-shadow:
    rgba(0, 0, 0, 0.3) 0px 0px 11px 0px,
    inset 0 0 0 0.9px hsla(var(--app-color-dark-hsl), 0.3),
    0 0 0 1.2px hsla(var(--app-color-light-hsl), 0.3);
}

.item {
  display: flex;
  justify-content: flex-start;
  width: 100%;
  padding: 0.3rem 0.4rem;
  margin: 0.2rem 0;
  letter-spacing: 0.4px;
  font-weight: 400;
  font-size: 0.875rem;
  border-radius: 0.3rem;
  border: none;
  background: none;
  text-align: left;
  cursor: default;
  font-family: var(--app-font-family);
  /* Theme-aware text color */
  color: hsla(var(--app-color-dark-hsl), 1);
  transition: none;
}

.item:hover {
  background-color: var(--app-color-primary);
  color: var(--app-color-primary-contrast);
}

.separator {
  width: 100%;
  height: 0.2px;
  background-color: hsla(var(--app-color-dark-hsl), 0.2);
  margin: 2px 0;
  border: none;
}
```

### Step 2: Verify visually

Right-click on the desktop. The context menu text should be dark on light background, light on dark background. Hover highlight should be macOS blue.

### Step 3: Run tests

```bash
pnpm --filter @vidorra/shell test
```

Expected: all tests pass.

### Step 4: Commit

```bash
cd d:/Code/Study/vidorra-os
git add packages/shell/src/components/ContextMenu/ContextMenu.module.css
git commit -m "feat(02-14): context menu theme-aware colors and dark mode border"
```

---

## Task 7 (Plan 02-15): ActionCenter — dark mode toggle + control panel

**Files:**
- Create: `packages/shell/src/stores/useThemeStore.ts`
- Create: `packages/shell/src/components/ActionCenter/ActionCenter.tsx`
- Create: `packages/shell/src/components/ActionCenter/ActionCenter.module.css`
- Create: `packages/shell/src/components/ActionCenter/ActionCenterToggle.tsx`
- Modify: `packages/shell/src/components/Menubar/Menubar.tsx`
- Modify: `packages/shell/src/main.tsx`

### Step 1: Create useThemeStore.ts

Create `packages/shell/src/stores/useThemeStore.ts`:

```typescript
import { create } from 'zustand'
import { themeEngine } from '@vidorra/kernel'

type Theme = 'light' | 'dark'

const STORAGE_KEY = 'vidorra:theme'

function getInitialTheme(): Theme {
  const stored = localStorage.getItem(STORAGE_KEY) as Theme | null
  if (stored === 'light' || stored === 'dark') return stored
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function applyTheme(theme: Theme) {
  document.body.classList.toggle('dark', theme === 'dark')
  themeEngine.setMode(theme === 'dark' ? 'dark' : 'light')
  localStorage.setItem(STORAGE_KEY, theme)
}

interface ThemeStore {
  theme: Theme
  setTheme: (t: Theme) => void
  toggleTheme: () => void
}

export const useThemeStore = create<ThemeStore>((set, get) => ({
  theme: getInitialTheme(),
  setTheme: (t) => {
    applyTheme(t)
    set({ theme: t })
  },
  toggleTheme: () => {
    const next: Theme = get().theme === 'light' ? 'dark' : 'light'
    applyTheme(next)
    set({ theme: next })
  },
}))
```

### Step 2: Create ActionCenter.tsx

Create `packages/shell/src/components/ActionCenter/ActionCenter.tsx`:

```tsx
import { useThemeStore } from '../../stores/useThemeStore'
import styles from './ActionCenter.module.css'

// Inline SVGs for Wi-Fi, Bluetooth, AirDrop, Moon — no external deps needed

function WifiIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M1 9l2 2c5.07-5.06 13.31-5.06 18.38 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3a4.237 4.237 0 00-6 0zm-4-4l2 2a7.074 7.074 0 0110 0l2-2C15.14 9.14 8.87 9.14 5 13z"/>
    </svg>
  )
}

function BluetoothIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.71 7.71L12 2h-1v7.59L6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 11 14.41V22h1l5.71-5.71-4.3-4.29 4.3-4.29zM13 5.83l1.88 1.88L13 9.59V5.83zm1.88 10.46L13 18.17v-3.76l1.88 1.88z"/>
    </svg>
  )
}

function AirDropIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 11c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm6 2c0-3.31-2.69-6-6-6s-6 2.69-6 6c0 2.22 1.21 4.15 3 5.19l1-1.74c-1.19-.7-2-1.97-2-3.45 0-2.21 1.79-4 4-4s4 1.79 4 4c0 1.48-.81 2.75-2 3.45l1 1.74c1.79-1.04 3-2.97 3-5.19zM12 3C6.48 3 2 7.48 2 13c0 3.7 2.01 6.92 4.99 8.65l1-1.73C5.61 18.53 4 15.96 4 13c0-4.42 3.58-8 8-8s8 3.58 8 8c0 2.96-1.61 5.53-4 6.92l1 1.73c2.99-1.73 5-4.95 5-8.65 0-5.52-4.48-10-10-10z"/>
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 512 512" fill="currentColor">
      <path d="M283.211 512c78.962 0 151.079-35.925 198.857-94.792 7.068-8.708-.639-21.43-11.562-19.35-124.203 23.654-238.262-71.576-238.262-196.954 0-72.222 38.662-138.635 101.498-174.394 9.686-5.512 7.25-20.197-3.756-22.23A258.156 258.156 0 00283.211 0c-141.309 0-256 114.511-256 256 0 141.309 114.511 256 256 256z" />
    </svg>
  )
}

interface ToggleProps {
  filled: boolean
  onClick?: () => void
  children: React.ReactNode
  label: string
}

function Toggle({ filled, onClick, children, label }: ToggleProps) {
  return (
    <button
      className={[styles.toggle, filled ? styles.toggleOn : styles.toggleOff].join(' ')}
      onClick={onClick}
      aria-label={label}
      aria-pressed={filled}
    >
      {children}
    </button>
  )
}

interface TileProps {
  label: string
  children: React.ReactNode
}

function Tile({ label, children }: TileProps) {
  return (
    <div className={styles.tile}>
      {children}
      <span className={styles.tileLabel}>{label}</span>
    </div>
  )
}

export function ActionCenter() {
  const { theme, toggleTheme } = useThemeStore()
  const isDark = theme === 'dark'

  return (
    <div className={styles.container}>
      {/* Row 1: Network controls */}
      <div className={styles.surface}>
        <Tile label="Wi-Fi">
          <Toggle filled label="Wi-Fi">
            <WifiIcon />
          </Toggle>
        </Tile>
        <Tile label="Bluetooth">
          <Toggle filled label="Bluetooth">
            <BluetoothIcon />
          </Toggle>
        </Tile>
        <Tile label="AirDrop">
          <Toggle filled={false} label="AirDrop">
            <AirDropIcon />
          </Toggle>
        </Tile>
      </div>

      {/* Row 2: Dark mode + Keyboard */}
      <div className={styles.surfaceRow}>
        <div className={styles.surface}>
          <Tile label="Dark Mode">
            <Toggle filled={isDark} onClick={toggleTheme} label="Toggle dark mode">
              <MoonIcon />
            </Toggle>
          </Tile>
        </div>
      </div>
    </div>
  )
}
```

### Step 3: Create ActionCenter.module.css

Create `packages/shell/src/components/ActionCenter/ActionCenter.module.css`:

```css
.container {
  width: 19.5rem;
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  background-color: hsla(var(--app-color-light-hsl), 0.3);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-radius: 1rem;
  box-shadow: rgba(0, 0, 0, 0.3) 0px 0px 11px 0px;
  user-select: none;
}

body.dark .container {
  box-shadow:
    rgba(0, 0, 0, 0.3) 0px 0px 11px 0px,
    inset 0 0 0 0.5px hsla(var(--app-color-dark-hsl), 0.3),
    0 0 0 0.5px hsla(var(--app-color-light-hsl), 0.3);
}

.surface {
  display: flex;
  gap: 0.5rem;
  padding: 0.5rem;
  background-color: hsla(var(--app-color-light-hsl), 0.5);
  border-radius: 0.75rem;
  box-shadow: rgba(0, 0, 0, 0.15) 0px 1px 4px -1px;
}

body.dark .surface {
  box-shadow:
    rgba(0, 0, 0, 0.15) 0px 1px 4px -1px,
    inset 0 0 0 0.4px hsla(var(--app-color-dark-hsl), 0.3),
    0 0 0 0.4px hsla(var(--app-color-light-hsl), 0.3);
}

.surfaceRow {
  display: flex;
  gap: 0.75rem;
}

.surfaceRow .surface {
  flex: 1;
}

.tile {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.35rem;
  flex: 1;
}

.tileLabel {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--app-color-dark);
  text-align: center;
}

.toggle {
  --size: 1.7rem;
  height: var(--size);
  width: var(--size);
  padding: 0;
  display: flex;
  place-items: center;
  border-radius: 50%;
  transition: box-shadow 100ms ease, background-color 150ms ease;
}

.toggle:focus-visible {
  box-shadow: 0 0 0 0.25rem hsla(var(--app-color-primary-hsl), 0.4);
}

.toggleOn {
  background-color: hsla(var(--app-color-primary-hsl), 1);
}

.toggleOn svg {
  fill: hsla(var(--app-color-primary-contrast-hsl), 1);
}

.toggleOff {
  background-color: hsla(var(--app-color-dark-hsl), 0.1);
}

.toggleOff svg {
  fill: hsla(var(--app-color-light-contrast-hsl), 0.9);
}
```

### Step 4: Create ActionCenterToggle.tsx

Create `packages/shell/src/components/ActionCenter/ActionCenterToggle.tsx`:

```tsx
import { useRef, useState, useEffect } from 'react'
import { ActionCenter } from './ActionCenter'
import styles from './ActionCenterToggle.module.css'

function SwitchIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 351 348"
      fill="none"
      stroke="currentColor"
      strokeWidth="20"
    >
      <path d="M87.75 46.2C97.06 46.2 105.99 49.45 112.57 55.22 119.15 60.997 122.85 68.83 122.85 77c0 8.17-3.7 16-10.28 21.78C105.99 104.555 97.06 107.8 87.75 107.8c-9.31 0-18.24-3.245-24.82-9.02C56.348 93 52.65 85.17 52.65 77c0-8.17 3.698-16 10.28-21.78C69.51 49.445 78.44 46.2 87.75 46.2zM263.25 0c23.27 0 45.59 8.11 62.05 22.55C341.755 36.99 351 56.58 351 77c0 20.42-9.245 40.007-25.7 54.447C308.84 145.888 286.52 154 263.25 154H87.75C64.48 154 42.16 145.888 25.7 131.447 9.245 117.007 0 97.42 0 77 0 56.578 9.245 36.993 25.7 22.553 42.158 8.112 64.477 0 87.75 0h175.5zM87.75 30.8C73.786 30.8 60.395 35.668 50.52 44.332 40.647 52.996 35.1 64.747 35.1 77c0 12.253 5.547 24.004 15.42 32.668C60.395 118.332 73.786 123.2 87.75 123.2H263.25c13.964 0 27.355-4.867 37.229-13.532C310.353 101.004 315.9 89.253 315.9 77c0-12.253-5.547-24.004-15.421-32.668C290.605 35.667 277.214 30.8 263.25 30.8H87.75z" />
      <path d="M263.25 194H87.75C64.477 194 42.158 202.112 25.7 216.553 9.245 230.993 0 250.578 0 271c0 20.422 9.245 40.007 25.7 54.447C42.158 339.888 64.477 348 87.75 348H263.25c23.273 0 45.592-8.112 62.049-22.553C341.755 311.007 351 291.422 351 271c0-20.422-9.245-40.007-25.701-54.447C308.842 202.112 286.523 194 263.25 194zm0 123.2c-13.964 0-27.355-4.867-37.229-13.532C216.147 295.004 210.6 283.253 210.6 271c0-12.253 5.547-24.004 15.421-32.668C236.895 229.667 250.286 224.8 263.25 224.8c13.964 0 27.355 4.867 37.229 13.532C310.353 246.996 315.9 258.747 315.9 271c0 12.253-5.547 24.004-15.421 32.668C290.605 312.333 277.214 317.2 263.25 317.2z" />
    </svg>
  )
}

export function ActionCenterToggle() {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div className={styles.container} ref={containerRef}>
      <button
        className={styles.toggleButton}
        onClick={() => setOpen((v) => !v)}
        aria-label="Control Center"
        aria-expanded={open}
      >
        <SwitchIcon />
      </button>
      {open && (
        <div className={styles.panel}>
          <ActionCenter />
        </div>
      )}
    </div>
  )
}
```

### Step 5: Create ActionCenterToggle.module.css

Create `packages/shell/src/components/ActionCenter/ActionCenterToggle.module.css`:

```css
.container {
  position: relative;
  height: 100%;
  display: flex;
  align-items: center;
}

.toggleButton {
  height: 100%;
  margin: 0 0.5rem;
  display: flex;
  align-items: center;
  color: var(--app-color-light-contrast);
}

.toggleButton:hover {
  opacity: 0.8;
}

.panel {
  position: absolute;
  top: 100%;
  right: 0.5rem;
  margin-top: 4px;
  z-index: 9960;
}
```

### Step 6: Wire ActionCenterToggle into Menubar

Open `packages/shell/src/components/Menubar/Menubar.tsx`. Import and add `ActionCenterToggle` between the leftSection and rightSection:

```tsx
import { ActionCenterToggle } from '../ActionCenter/ActionCenterToggle'

// In the JSX, between leftSection and rightSection:
<div className={styles.spacer} />
<ActionCenterToggle />
```

Add the spacer style to Menubar.module.css:

```css
.spacer {
  flex: 1 1 auto;
}
```

Full Menubar.tsx after edit (only the return JSX changes):

```tsx
return (
  <header className={styles.menubar} ref={menubarRef}>
    <div className={styles.leftSection}>
      {menuIds.map((menuId) => {
        const menuDef = menuConfig[menuId]
        const isActive = activeMenu === menuId

        return (
          <div key={menuId} className={styles.menuWrapper}>
            <button
              className={[
                styles.menuButton,
                menuId === 'apple' ? styles.appleButton : '',
                menuId === 'finder' ? styles.appNameButton : '',
                isActive ? styles.active : '',
              ].filter(Boolean).join(' ')}
              onClick={() => setActiveMenu(isActive ? '' : menuId)}
              onMouseEnter={() => activeMenu && activeMenu !== menuId && setActiveMenu(menuId)}
              aria-haspopup="menu"
              aria-expanded={isActive}
            >
              {menuId === 'apple' ? <AppleIcon /> : menuDef.title}
            </button>

            {isActive && (
              <div className={styles.menuDropdown}>
                <Menu
                  items={menuDef.items}
                  onClose={closeMenu}
                />
              </div>
            )}
          </div>
        )
      })}
    </div>

    <div className={styles.spacer} />
    <ActionCenterToggle />

    <div className={styles.rightSection}>
      <MenubarClock />
    </div>
  </header>
)
```

### Step 7: Initialize theme on app startup

Open `packages/shell/src/main.tsx` and add theme initialization before `createRoot`:

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './global.css'
import App from './App'

// Initialize theme from localStorage on startup
const storedTheme = localStorage.getItem('vidorra:theme')
if (storedTheme === 'dark') {
  document.body.classList.add('dark')
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

### Step 8: Run tests

```bash
pnpm --filter @vidorra/shell test
```

Expected: all tests pass.

### Step 9: Verify visually

1. Menubar right side shows switch icon
2. Click it → ActionCenter panel drops down
3. Click "Dark Mode" toggle → `body.dark` class added, whole UI shifts to dark theme
4. Click again → light mode restored
5. Refresh page → theme persists from localStorage

### Step 10: Commit

```bash
cd d:/Code/Study/vidorra-os
git add packages/shell/src/stores/useThemeStore.ts \
        packages/shell/src/components/ActionCenter/ \
        packages/shell/src/components/Menubar/Menubar.tsx \
        packages/shell/src/components/Menubar/Menubar.module.css \
        packages/shell/src/main.tsx
git commit -m "feat(02-15): ActionCenter panel with functional dark mode toggle"
```

---

## Final Verification

After all 7 tasks complete, run a full verification:

```bash
cd d:/Code/Study/vidorra-os
pnpm --filter @vidorra/shell test
pnpm --filter @vidorra/shell build
```

Both should succeed with no errors.

**Manual checklist:**
- [ ] Light mode: Dock glass is translucent white, running dot is dark, tooltip text is dark
- [ ] Dark mode: Dock glass is translucent dark, window borders show inner highlight
- [ ] TrafficLights: red/yellow/green visible on focused window, grey on unfocused, icons on hover
- [ ] Menubar: click File → dropdown appears, hover to other menus → slides through, Escape closes
- [ ] ActionCenter: click toggle button → panel drops down, dark mode tile toggles theme
- [ ] ContextMenu: right-click desktop → text is dark on light / white on dark bg
- [ ] Theme persists after page refresh
