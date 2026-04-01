# Phase 2: Shell — Research

**Researched:** 2026-04-01
**Domain:** React windowing system, Dock magnification, macOS-style shell UI
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Window behavior**
- Titlebar double-click toggles maximize/restore (macOS native behavior)
- Maximize area: fullscreen minus Menubar height; Dock remains visible
- Window dragged beyond screen boundary auto-snaps back (titlebar always visible; boundary detection on drag end → spring back)
- Min size: read `manifest.minSize` first; default `200×150`
- Click anywhere on window raises z-index (focus)
- New window placement: staircase-center (each +20px/+20px offset from previous)
- Minimize animation: Phase 2 uses Framer Motion scale + translate toward Dock icon position; Genie effect deferred (WebGPU, post-MVP)
- Window controls: red (close) / yellow (minimize) / green (maximize), left of titlebar, macOS style

**Dock**
- Icon base size 48px, hover magnifies to 80px, influence range 3–5 adjacent icons, spring transition (Framer Motion spring)
- Fixed at screen bottom center, glass background (`backdrop-filter: blur`)
- Running app: white dot indicator below icon
- Right-click menu (3 items): "打开" (not running) / "打开" / "在 Dock 中隐藏" / "关闭" (running)
- MVP: Dock icon order is fixed; drag-to-reorder deferred
- Dock icon source: `appRegistry.getAllApps()`

**Initial state**
- Shell first launch auto-opens Welcome window (`localStorage['vidorra:welcomed']`; not reopened after set)
- Dock default: only App Store shown (via `built-in-apps.json`); others appear after install
- Welcome app not in Dock — first-launch only

**Theme integration**
- CSS variables already injected to `document.documentElement` by ThemeEngine
- Components reference `var(--color-bg)` etc. directly — no React subscription needed
- Theme switch triggers no React re-renders; CSS variable update is automatic
- Glass effect (Menubar, Dock, window titlebar): `backdrop-filter: blur(20px) saturate(180%)`

**Wallpaper**
- Default: macOS-style mountain image (Unsplash or local preset)
- 2–3 presets in `packages/shell/public/wallpapers/`
- User custom upload: Settings App, Phase 5
- URL stored in `localStorage['vidorra:wallpaper']`; read on Shell mount

**Menubar**
- Height 24px, fixed top, glass background
- Left: Apple icon (system menu placeholder) / focused app name / app menu items (from `manifest.menubar`; Phase 2: display only, no action)
- Right: `HH:mm` clock, updates at next whole-minute boundary then every 60 000ms
- No focused app → "Vidorra OS" + system default menu
- Apple icon click: dropdown "关于 Vidorra OS" / "系统设置..."

**Desktop right-click menu**
- Items: "关于 Vidorra OS" / "更改壁纸..." / separator / "强制刷新"
- Position follows mouse; auto-adjusts if near viewport edge
- Dismiss: click outside, Escape, or item selected

### Claude's Discretion
- Window shadow and corner radius parameters (reference: macos-web project style)
- Framer Motion animation curve and duration parameters
- Dock spring animation stiffness / damping values
- CSS variable naming (already defined by ThemeEngine — reuse as-is)
- Menubar Apple icon specific SVG

### Deferred Ideas (OUT OF SCOPE)
- Genie minimize effect — separate post-MVP phase (WebGPU + WGSL)
- Dock icon drag-to-reorder — P2 feature, not MVP
- Settings App wallpaper upload — Phase 5
- Spotlight global search — P2 feature
- Mission Control — P3 feature
- Window edge snap (Snap) — noted for later
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SHELL-01 | Multiple windows simultaneously; independently draggable and resizable via `react-rnd` | react-rnd 10.5.3 confirmed; useWindowStore Zustand pattern maps directly to `Rnd` props |
| SHELL-02 | Window minimize/maximize/close buttons work; maximize fills viewport minus Menubar; Dock visible | Framer Motion AnimatePresence + useAnimation; CSS transition for maximize per reference Window.svelte |
| SHELL-03 | Clicking any window raises it to front (z-index via useWindowStore) | Zustand store slice pattern; zIndex incrementing approach confirmed |
| SHELL-04 | Dock shows installed apps; hover Framer Motion magnification (48px→80px); running dot | `useMotionValue` + `useSpring` + `useTransform` pattern; distance tracking via `onMouseMove` + `getBoundingClientRect` |
| SHELL-05 | Dock right-click menu: 3 contextual items (Open / Hide from Dock / Close) | Shared ContextMenu component; `onContextMenu` handler on DockItem |
| SHELL-06 | Menubar: focused app name + `manifest.menubar` items left; `HH:mm` clock right; fallback "Vidorra OS" | `setInterval` aligned to next minute boundary; `useWindowStore` for focusedWindow app name |
| SHELL-07 | Desktop renders wallpaper; default macOS-style; user sets `localStorage['vidorra:wallpaper']` | CSS `background-image` on Desktop component; `localStorage` read in `useEffect` on mount |
| SHELL-08 | Welcome window auto-opens first launch; `localStorage['vidorra:welcomed']` prevents repeat | Check key in `useEffect` on App mount; open window, then set key |
</phase_requirements>

---

## Summary

Phase 2 builds the visible macOS-style desktop shell on top of the already-complete kernel (Phase 1). The component set is well-defined: Desktop (wallpaper), Menubar (top bar), Dock (bottom magnifying launcher), WindowManager (container), WindowFrame (per-window chrome), and a shared ContextMenu. The technical stack is fully locked: React 18, TypeScript strict, CSS Modules, react-rnd 10.5.3 for drag/resize, Framer Motion 12.38.0 for all animations, and Zustand 5.0.12 for window state. All three libraries are already selected and their current versions are confirmed against npm registry.

The central implementation challenge is the Dock icon magnification. The reference implementation (Svelte `macos-web`) uses Popmotion's `interpolate` with a `spring` store — this must be translated to Framer Motion's `useMotionValue` + `useSpring` + `useTransform` equivalents, tracking mouse X position on the Dock container and computing per-icon distance. The interpolation curve is a custom multi-point curve (7 points) that produces a bell-curve width response. The UI-SPEC.md has pre-solved the exact spring parameters and distance math.

The second challenge is `react-rnd` integration with Framer Motion's `AnimatePresence`. The window component will be wrapped in `AnimatePresence` for mount/unmount animations, but `react-rnd`'s drag engine must receive the current position from Zustand store and write back on drag end — this requires careful prop threading: `react-rnd` is controlled via `position` prop when the window is maximized or minimized (bypassing drag), and uncontrolled during normal dragging.

**Primary recommendation:** Use `useWindowStore` (Zustand) as the single source of truth for all window state; `react-rnd` reads `rect` and writes back via `onDragStop`/`onResizeStop`; Framer Motion handles all transitions including the AnimatePresence exit animation for close.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react | ^18.3.0 | Component rendering | Already installed; locked decision |
| react-dom | ^18.3.0 | DOM rendering | Already installed |
| zustand | 5.0.12 | Window state, focus, z-index | Locked decision (STATE.md Phase 0); lightweight, no boilerplate |
| framer-motion | 12.38.0 | All animations: window open/close/minimize, Dock magnification, context menu | Locked decision (STATE.md Phase 2) |
| react-rnd | 10.5.3 | Window drag + 8-direction resize | Locked decision (STATE.md Phase 0); avoids re-implementing complex resize handles |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @vidorra/kernel | workspace:* | `appRegistry.getAllApps()`, `themeEngine` | Dock icon list, CSS variable baseline |
| @vidorra/types | workspace:* | `WindowDescriptor`, `AppManifest` | All window state typing |

### Not Needed (and why)

| Problem | Skipped | Reason |
|---------|---------|--------|
| CSS-in-JS | — | Project uses CSS Modules only (established pattern) |
| tinykeys | — | Phase 2 has no keyboard shortcuts; deferred to Phase 3+ |
| Date formatting library | — | `HH:mm` is one `String.padStart(2,'0')` expression; no library needed |
| Context menu library | — | Custom shared ContextMenu component per UI-SPEC; ~40 lines CSS Modules |

**Installation command:**
```bash
cd packages/shell && pnpm add zustand framer-motion react-rnd
```

**Version verification (confirmed against npm registry 2026-04-01):**
- react-rnd: 10.5.3 (published, latest stable)
- framer-motion: 12.38.0 (latest stable)
- zustand: 5.0.12 (latest stable)

---

## Architecture Patterns

### Recommended Project Structure

```
packages/shell/src/
├── stores/
│   └── useWindowStore.ts      # Zustand: all window state + actions
├── components/
│   ├── Desktop/
│   │   ├── Desktop.tsx
│   │   └── Desktop.module.css
│   ├── Menubar/
│   │   ├── Menubar.tsx
│   │   ├── MenubarClock.tsx
│   │   └── Menubar.module.css
│   ├── Dock/
│   │   ├── Dock.tsx
│   │   ├── DockItem.tsx
│   │   └── Dock.module.css
│   ├── WindowManager/
│   │   ├── WindowManager.tsx
│   │   └── WindowManager.module.css
│   ├── WindowFrame/
│   │   ├── WindowFrame.tsx
│   │   ├── TrafficLights.tsx
│   │   └── WindowFrame.module.css
│   └── ContextMenu/
│       ├── ContextMenu.tsx
│       └── ContextMenu.module.css
├── App.tsx                    # Shell root: Desktop + Menubar + Dock + WindowManager
├── App.module.css
└── main.tsx
packages/shell/public/
└── wallpapers/
    ├── default.jpg
    ├── preset-1.jpg
    └── preset-2.jpg
```

### Pattern 1: Zustand Window Store

The window store is the single source of truth for all runtime window state. All operations are store actions — components never mutate window state directly.

```typescript
// packages/shell/src/stores/useWindowStore.ts
import { create } from 'zustand'
import type { WindowDescriptor, WindowRect, WindowState } from '@vidorra/types'

interface WindowStore {
  windows: WindowDescriptor[]
  nextZIndex: number
  openWindow: (descriptor: Omit<WindowDescriptor, 'zIndex' | 'focused'>) => void
  closeWindow: (id: string) => void
  focusWindow: (id: string) => void
  setWindowState: (id: string, state: WindowState) => void
  setWindowRect: (id: string, rect: WindowRect) => void
}

export const useWindowStore = create<WindowStore>((set, get) => ({
  windows: [],
  nextZIndex: 1,
  openWindow: (descriptor) => {
    const { nextZIndex, windows } = get()
    // staircase offset: +20px per existing window
    const offset = windows.filter(w => w.state !== 'minimized').length * 20
    set((s) => ({
      windows: [...s.windows, {
        ...descriptor,
        rect: {
          ...descriptor.rect,
          x: descriptor.rect.x + offset,
          y: descriptor.rect.y + offset,
        },
        zIndex: nextZIndex,
        focused: true,
      }],
      nextZIndex: nextZIndex + 1,
    }))
  },
  closeWindow: (id) =>
    set((s) => ({ windows: s.windows.filter((w) => w.id !== id) })),
  focusWindow: (id) => {
    const { nextZIndex } = get()
    set((s) => ({
      windows: s.windows.map((w) =>
        w.id === id
          ? { ...w, focused: true, zIndex: nextZIndex }
          : { ...w, focused: false }
      ),
      nextZIndex: nextZIndex + 1,
    }))
  },
  setWindowState: (id, state) =>
    set((s) => ({
      windows: s.windows.map((w) => (w.id === id ? { ...w, state } : w)),
    })),
  setWindowRect: (id, rect) =>
    set((s) => ({
      windows: s.windows.map((w) => (w.id === id ? { ...w, rect } : w)),
    })),
}))
```

### Pattern 2: react-rnd + Framer Motion Window Frame

The key integration: `react-rnd` handles drag/resize during normal state; the `motion.div` wrapper (via Framer Motion) handles mount/unmount and minimize animations. When `state === 'maximized'`, pass `position` and `size` props to `Rnd` to override drag position; disable dragging.

```typescript
// packages/shell/src/components/WindowFrame/WindowFrame.tsx
import { Rnd } from 'react-rnd'
import { motion, AnimatePresence } from 'framer-motion'
import type { WindowDescriptor } from '@vidorra/types'

// react-rnd dragHandleClassName targets only the titlebar
// position prop on Rnd overrides position (used for maximize)
// onDragStop / onResizeStop commit rect back to store

function WindowFrame({ window }: { window: WindowDescriptor }) {
  const setRect = useWindowStore(s => s.setWindowRect)
  const focus = useWindowStore(s => s.focusWindow)
  const isMaximized = window.state === 'maximized'

  return (
    <Rnd
      position={isMaximized ? { x: 0, y: 0 } : { x: window.rect.x, y: window.rect.y }}
      size={isMaximized
        ? { width: '100vw', height: 'calc(100vh - 24px)' }
        : { width: window.rect.width, height: window.rect.height }}
      disableDragging={isMaximized}
      enableResizing={!isMaximized}
      dragHandleClassName="window-drag-handle"
      minWidth={window.minWidth ?? 200}
      minHeight={window.minHeight ?? 150}
      style={{ zIndex: window.zIndex }}
      onDragStop={(_, d) => setRect(window.id, { ...window.rect, x: d.x, y: d.y })}
      onResizeStop={(_, __, ___, delta, pos) =>
        setRect(window.id, {
          x: pos.x, y: pos.y,
          width: window.rect.width + delta.width,
          height: window.rect.height + delta.height,
        })
      }
      onMouseDown={() => focus(window.id)}
    >
      {/* motion.div for open/close animation */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className={styles.windowFrame}
        data-focused={window.focused}
      >
        <div className={`${styles.titlebar} window-drag-handle`}
             onDoubleClick={() => toggleMaximize(window.id)}>
          <TrafficLights windowId={window.id} />
          <span className={styles.title}>{window.title}</span>
        </div>
        <div className={styles.content}>
          <iframe src={window.url} title={window.title} />
        </div>
      </motion.div>
    </Rnd>
  )
}
```

### Pattern 3: Dock Magnification with Framer Motion

**Updated source:** `.reference/macos-preact-main/src/components/dock/DockItem.tsx` (more faithful macOS reproduction than the Svelte reference).

Key differences from the Svelte reference:
- **Spring params**: `stiffness: 1300, damping: 82` (tighter, snappier — closer to real macOS) vs Svelte's `stiffness: 150, damping: 15`
- **Distance tracking**: `useRaf` loop reads `getBoundingClientRect` every frame — avoids `useTransform` closure-stale-ref pitfall
- **Bounce animation**: `translateY: ['0%', '-39.2%', '0%']` (percentage-based, scales with icon size) vs absolute `-10px`
- **Dot color**: `var(--app-color-dark)` (theme-adaptive, dark on light / light on dark) vs hardcoded white
- **Backdrop blur**: `::before` pseudo-element isolates blur so it doesn't affect child elements

The Dock tracks mouse X via `onMouseMove` on the container. Each DockItem maintains its own `distance` MotionValue, updated every frame via `useRaf`.

```typescript
// packages/shell/src/components/Dock/Dock.tsx
import { useMotionValue } from 'framer-motion'

const BASE_SIZE = 57.6  // px — reference uses 57.6; normalized to 48 via container scaling
const DISTANCE_LIMIT = BASE_SIZE * 6  // 345.6px

function Dock() {
  const mouseX = useMotionValue<number | null>(null)  // null = mouse not over dock

  return (
    <nav
      className={styles.dock}
      onMouseMove={(e) => mouseX.set(e.nativeEvent.x)}
      onMouseLeave={() => mouseX.set(null)}
    >
      {apps.map(app => (
        <DockItem key={app.id} app={app} mouseX={mouseX} />
      ))}
    </nav>
  )
}

// packages/shell/src/components/Dock/DockItem.tsx
import { useRef } from 'react'
import { motion, useMotionValue, useSpring, useTransform, MotionValue } from 'framer-motion'
import useRaf from '@rooks/use-raf'  // OR implement manually: see note below

const baseWidth = 57.6
const distanceLimit = baseWidth * 6        // 345.6px
const beyondLimit = distanceLimit + 1

const distanceInput = [
  -distanceLimit, -distanceLimit / 1.25, -distanceLimit / 2,
  0,
  distanceLimit / 2, distanceLimit / 1.25, distanceLimit
]
const widthOutput = [
  baseWidth, baseWidth * 1.1, baseWidth * 1.414,
  baseWidth * 2,  // peak = 2× base
  baseWidth * 1.414, baseWidth * 1.1, baseWidth
]

function useDockHoverAnimation(mouseX: MotionValue<number | null>, ref: RefObject<HTMLImageElement>) {
  const distance = useMotionValue(beyondLimit)

  const widthPX = useSpring(
    useTransform(distance, distanceInput, widthOutput),
    { stiffness: 1300, damping: 82 }  // KEY: tight spring = snappy macOS feel
  )

  const width = useTransform(widthPX, (w) => `${w / 16}rem`)

  // KEY: useRaf reads getBoundingClientRect every frame — avoids stale closure
  useRaf(() => {
    const el = ref.current
    const mouseXVal = mouseX.get()
    if (el && mouseXVal !== null) {
      const rect = el.getBoundingClientRect()
      distance.set(mouseXVal - (rect.left + rect.width / 2))
      return
    }
    distance.set(beyondLimit)
  }, true)

  return { width }
}

// NOTE: If @rooks/use-raf is not available, implement manually:
// function useRaf(callback: () => void, active: boolean) {
//   useEffect(() => {
//     if (!active) return
//     let id: number
//     const loop = () => { callback(); id = requestAnimationFrame(loop) }
//     id = requestAnimationFrame(loop)
//     return () => cancelAnimationFrame(id)
//   }, [active])
// }

function DockItem({ app, mouseX }: { app: AppManifest; mouseX: MotionValue<number | null> }) {
  const imgRef = useRef<HTMLImageElement>(null)
  const [animateObj, setAnimateObj] = useState({ translateY: ['0%', '0%', '0%'] })
  const { width } = useDockHoverAnimation(mouseX, imgRef)

  return (
    <button className={styles.dockItemButton} onClick={() => openApp(app)}>
      <p className={styles.tooltip}>{app.name}</p>
      <motion.span
        onTap={() => setAnimateObj({ translateY: ['0%', '-39.2%', '0%'] })}
        initial={false}
        animate={animateObj}
        transition={{ type: 'spring', duration: 0.7 }}
        transformTemplate={({ translateY }) => `translateY(${translateY})`}
      >
        <motion.img
          ref={imgRef}
          src={app.icon}
          draggable={false}
          style={{ width, willChange: 'width' }}
          alt={`${app.name} app icon`}
        />
      </motion.span>
      {/* dot: opacity driven by CSS variable for theme-adaptive color */}
      <div className={styles.dot} style={{ '--opacity': +isRunning } as React.CSSProperties} />
    </button>
  )
}
```

**Dock container CSS** — backdrop via `::before` to isolate blur:
```scss
.dockEl {
  background-color: hsla(var(--app-color-light-hsl), 0.4);
  box-shadow:
    inset 0 0 0 0.2px hsla(var(--app-color-grey-100-hsl), 0.7),
    0 0 0 0.2px hsla(var(--app-color-grey-900-hsl), 0.7),
    hsla(0, 0%, 0%, 0.3) 2px 5px 19px 7px;
  padding: 0.3rem;
  border-radius: 1.2rem;
  position: relative;
  display: flex;
  align-items: flex-end;

  &::before {
    content: '';
    width: 100%; height: 100%;
    backdrop-filter: blur(10px);  // blur on ::before, NOT on the element itself
    position: absolute;
    top: 0; left: 0;
    z-index: -1;
  }
}
```

**Dot CSS** — theme-adaptive via CSS variable opacity:
```scss
.dot {
  height: 4px; width: 4px;
  border-radius: 50%;
  background-color: var(--app-color-dark);  // adaptive: dark on light, light on dark
  opacity: var(--opacity);  // set via inline style: { '--opacity': +isRunning }
}
```

**transform-origin: bottom** — essential for natural upward scaling:
```scss
.dockItemButton {
  transform-origin: bottom;  // icons grow upward, not centered
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
}
```

### Pattern 4: AnimatePresence for Window Lifecycle

`AnimatePresence` in `WindowManager` enables the exit animation when a window is closed. Without it, the component would unmount immediately and the exit animation would never play.

```typescript
// packages/shell/src/components/WindowManager/WindowManager.tsx
import { AnimatePresence } from 'framer-motion'

function WindowManager() {
  const windows = useWindowStore(s => s.windows)

  return (
    <div className={styles.windowArea}>
      <AnimatePresence>
        {windows.map(win => (
          <WindowFrame key={win.id} window={win} />
        ))}
      </AnimatePresence>
    </div>
  )
}
```

### Pattern 5: ContextMenu (shared component)

Used by Desktop (right-click), DockItem (right-click), and Menubar Apple icon (left-click). State lives in the parent component or a lightweight local state — do not put context menu open state in Zustand.

```typescript
// Local state pattern for context menu trigger
const [menu, setMenu] = useState<{ x: number; y: number } | null>(null)

function handleContextMenu(e: React.MouseEvent) {
  e.preventDefault()
  // Clamp to viewport
  const x = Math.min(e.clientX, window.innerWidth - 160)
  const y = Math.min(e.clientY, window.innerHeight - itemCount * 24 - 16)
  setMenu({ x, y })
}
```

### Anti-Patterns to Avoid

- **Storing ContextMenu state in Zustand:** Context menus are transient UI state; local `useState` is correct. Global store adds unnecessary complexity and causes stale-closure bugs.
- **Animating react-rnd's wrapper div with Framer Motion layout animation:** `react-rnd` uses CSS transforms internally; Framer Motion `layout` prop conflicts with this. Use explicit `initial`/`animate`/`exit` only.
- **Using CSS `display:none` for minimized windows:** React component still runs, iframe still loads. Set `visibility: hidden; pointer-events: none` + animate to Dock icon position instead. Remove from DOM only on close.
- **Reading `appRegistry.getAllApps()` on every render:** Call once in a `useEffect` or derive in a custom hook that subscribes to changes. AppRegistry has no React subscription mechanism — re-read on relevant events only.
- **z-index collisions:** Never hardcode z-index. Always use the `nextZIndex` counter from the store. Menubar: 1001, Dock: 1000, ContextMenu: 1002 — these are safe ceilings.
- **Framer Motion 12.x breaking changes:** `motion` API is stable. `useSpring`/`useMotionValue`/`useTransform` hooks are unchanged from v10. `AnimatePresence` requires `key` on children. No migration needed from earlier versions.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Window drag + 8-direction resize | Custom `onMouseMove` + hit-testing for 8 handles | `react-rnd` | Edge handles, touch events, keyboard resize, min/max constraints — each has edge cases; react-rnd has 200+ tests covering them |
| Smooth spring animations | `requestAnimationFrame` + manual spring physics | Framer Motion `useSpring` | Spring overshoot, damping math, interruption handling — all solved; Framer Motion GPU-accelerates transforms |
| Window z-index management | DOM `querySelectorAll` + sort by z-index | Zustand `nextZIndex` counter | Simple incrementing counter is correct; DOM queries are brittle and slow |
| CSS variable reading for glass effect | `getComputedStyle(root).getPropertyValue()` in JS | CSS `var()` directly in CSS Modules | CSS variables cascade automatically; no JS needed |

**Key insight:** In windowing systems, the hardest bugs are in resize handle hit areas (especially corners) and spring interruption (new gesture starts before previous animation finishes). react-rnd and Framer Motion both handle these correctly out of the box.

---

## Runtime State Inventory

> Phase 2 is greenfield UI implementation with no renames or migrations.

| Category | Items Found | Action Required |
|----------|-------------|-----------------|
| Stored data | `localStorage['vidorra:registry']` — written by Phase 1; Shell reads via `appRegistry.getAllApps()` | None — existing data, code reads it |
| Stored data | `localStorage['vidorra:welcomed']` — written by Shell on first launch | New key; Shell writes it, subsequent mounts read it |
| Stored data | `localStorage['vidorra:wallpaper']` — written by user (Settings, Phase 5) | New key; Shell reads it, falls back to default if absent |
| Live service config | None | — |
| OS-registered state | None | — |
| Secrets/env vars | None | — |
| Build artifacts | `packages/shell/public/wallpapers/` — does not yet exist | Wave 0: create directory, add `default.jpg`, `preset-1.jpg`, `preset-2.jpg` |

---

## Common Pitfalls

### Pitfall 1: react-rnd position out of sync after maximize/restore

**What goes wrong:** Maximized state overrides position to `{x:0, y:0}`. On restore, if the store's `rect` was never updated, `react-rnd` snaps to the wrong position because the internal drag state and the prop diverge.

**Why it happens:** `react-rnd` has internal position state when used uncontrolled. Toggling between controlled (maximize) and uncontrolled (normal) modes without explicit `position` prop synchronization causes a stale internal state.

**How to avoid:** Always pass `position` and `size` as controlled props derived from the Zustand store. On drag end (`onDragStop`), write back to store. On resize end (`onResizeStop`), write back to store. The store is always the source of truth.

**Warning signs:** Window jumps to `{0,0}` or wrong size after restoring from maximized state.

---

### Pitfall 2: Framer Motion `AnimatePresence` exit animation not firing

**What goes wrong:** Window close removes it from the `windows` array immediately; React unmounts the component before `exit` animation can play.

**Why it happens:** Framer Motion `exit` only works when the component is a direct child of `AnimatePresence` — AND the `key` prop is present AND the component is NOT immediately removed from the tree (Framer Motion temporarily keeps the DOM node during exit).

**How to avoid:** Wrap `WindowFrame` with `AnimatePresence` in `WindowManager`. Never conditionally unmount inside `WindowFrame` itself. Ensure `key={win.id}` on every `WindowFrame`.

**Warning signs:** Windows vanish instantly on close with no animation.

---

### Pitfall 3: Dock magnification jank on fast mouse movement

**What goes wrong:** Using `useTransform(mouseX, callback)` where the callback calls `getBoundingClientRect()` — this runs in a Framer Motion subscriber context, not a RAF loop, causing reflow-per-frame and stale ref issues.

**Why it happens:** Framer Motion's `useTransform` callback fires synchronously during state updates, not on a predictable RAF schedule. `getBoundingClientRect()` inside a transform callback can return stale values or trigger extra reflows.

**How to avoid (preact reference pattern):** Use `useRaf` to read `getBoundingClientRect()` on every animation frame and update a `distance` MotionValue directly. This decouples the measurement from the transform computation:

```typescript
const distance = useMotionValue(beyondLimit)

useRaf(() => {
  const el = ref.current
  const mouseXVal = mouseX.get()
  if (el && mouseXVal !== null) {
    const rect = el.getBoundingClientRect()
    distance.set(mouseXVal - (rect.left + rect.width / 2))
    return
  }
  distance.set(beyondLimit)
}, true)

const widthPX = useSpring(useTransform(distance, distanceInput, widthOutput), {
  stiffness: 1300,
  damping: 82,
})
```

If `@rooks/use-raf` is unavailable, implement a simple RAF loop in a `useEffect` with cleanup.

**Warning signs:** Icons snap to base size for one frame during fast mouse sweep.

---

### Pitfall 4: Menubar clock updates on exact-second intervals

**What goes wrong:** `setInterval(update, 60000)` starting at mount time drifts — if the component mounts at :30 seconds, the first update fires at :90 seconds (1 minute 30 seconds into the minute), then correctly every 60 seconds, but the displayed time is always 30 seconds stale.

**Why it happens:** `setInterval` fires relative to mount time, not the clock boundary.

**How to avoid:** Calculate milliseconds to the next minute boundary on mount, use `setTimeout` for the first tick, then start a 60-second `setInterval`. The UI-SPEC already specifies this pattern: "updates: `setInterval` at next whole minute boundary, then every 60 000ms."

```typescript
function alignedClockInterval(callback: () => void) {
  const now = new Date()
  const msToNextMinute = (60 - now.getSeconds()) * 1000 - now.getMilliseconds()
  const timeout = setTimeout(() => {
    callback()
    const interval = setInterval(callback, 60_000)
    return () => clearInterval(interval)
  }, msToNextMinute)
  return () => clearTimeout(timeout)
}
```

**Warning signs:** Clock shows time that doesn't match system time on page load.

---

### Pitfall 5: iframe content visible during minimize animation

**What goes wrong:** The iframe renders content and scrollbars during the scale-down minimize animation, making it look low-quality.

**Why it happens:** The iframe is not part of the CSS transform stack, and its repaint is independent.

**How to avoid:** Set `pointer-events: none` and `visibility: hidden` on the iframe once minimize animation completes (after 300ms). During the animation itself, the transform applies correctly — iframe content stays visible but shrinks, which is acceptable. After animation, set `display: none` via `onAnimationComplete` callback.

---

### Pitfall 6: Boundary snap causes jerky behavior with fast drags

**What goes wrong:** On drag end, if the window is off-screen, it snaps back with no animation — visually jarring.

**Why it happens:** `onDragStop` fires, position is clamped, and react-rnd immediately updates position without any spring.

**How to avoid:** After clamping on `onDragStop`, use a Framer Motion `animate` call (via `useAnimation()`) to spring the window back to the clamped position. The UI-SPEC specifies: "spring back using Framer Motion `animate` to clamped position."

---

### Pitfall 7: Zustand 5.x API changes from v4

**What goes wrong:** Code using Zustand v4 `immer` middleware patterns or `subscribeWithSelector` may fail silently in Zustand v5.

**Why it happens:** Zustand 5.0 is a major version with some breaking changes in middleware typings and the `devtools` API.

**How to avoid:** For this phase, use the basic `create()` API without middleware. The window store is simple enough to manage immutably by hand. If immer is needed later, install `immer` separately and use `immer` middleware — but the current spec does not require it.

**Warning signs:** TypeScript errors on middleware types; `getState()` returning undefined.

---

## Code Examples

### Zustand store selector (performance optimization)

```typescript
// Each component subscribes to only what it needs — prevents unnecessary re-renders
const focusedWindow = useWindowStore(
  (s) => s.windows.find((w) => w.focused) ?? null
)
const windowCount = useWindowStore((s) => s.windows.length)
```

### Clock initialization aligned to minute boundary

```typescript
// packages/shell/src/components/Menubar/MenubarClock.tsx
import { useState, useEffect } from 'react'

function formatTime(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

export function MenubarClock() {
  const [time, setTime] = useState(() => formatTime(new Date()))

  useEffect(() => {
    const tick = () => setTime(formatTime(new Date()))
    const now = new Date()
    const msToNext = (60 - now.getSeconds()) * 1000 - now.getMilliseconds()
    let intervalId: ReturnType<typeof setInterval>
    const timeoutId = setTimeout(() => {
      tick()
      intervalId = setInterval(tick, 60_000)
    }, msToNext)
    return () => {
      clearTimeout(timeoutId)
      clearInterval(intervalId)
    }
  }, [])

  return <span className={styles.clock}>{time}</span>
}
```

### Wallpaper initialization from localStorage

```typescript
// packages/shell/src/components/Desktop/Desktop.tsx
import { useState, useEffect } from 'react'

const DEFAULT_WALLPAPER = '/wallpapers/default.jpg'

export function Desktop() {
  const [wallpaperUrl, setWallpaperUrl] = useState(DEFAULT_WALLPAPER)

  useEffect(() => {
    const stored = localStorage.getItem('vidorra:wallpaper')
    if (stored) setWallpaperUrl(stored)
  }, [])

  return (
    <div
      className={styles.desktop}
      style={{ backgroundImage: `url(${wallpaperUrl})` }}
      onContextMenu={handleContextMenu}
    />
  )
}
```

### First-launch Welcome window

```typescript
// packages/shell/src/App.tsx
useEffect(() => {
  const welcomed = localStorage.getItem('vidorra:welcomed')
  if (!welcomed) {
    openWindow({
      id: crypto.randomUUID(),
      appId: 'welcome',
      title: 'Welcome to Vidorra OS',
      url: '/apps/welcome/index.html',
      icon: '/app-icons/welcome.svg',
      rect: {
        x: Math.round((window.innerWidth - 600) / 2),
        y: Math.round((window.innerHeight - 400) / 2),
        width: 600,
        height: 400,
      },
      state: 'normal',
    })
    localStorage.setItem('vidorra:welcomed', '1')
  }
}, [])
```

### Window boundary snap on drag end

```typescript
onDragStop={(_, d) => {
  const TITLEBAR_HEIGHT = 28
  const MIN_VISIBLE = 80  // at least 80px of titlebar must remain in viewport
  const clampedX = Math.max(MIN_VISIBLE - win.rect.width, Math.min(d.x, window.innerWidth - MIN_VISIBLE))
  const clampedY = Math.max(0, Math.min(d.y, window.innerHeight - TITLEBAR_HEIGHT))
  setRect(win.id, { ...win.rect, x: clampedX, y: clampedY })
}}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Framer Motion v6-v10 `motion.div` with `positionTransition` | Framer Motion v11+ `layout` prop with `layoutId` for shared layout | Framer Motion v11 (2024) | `positionTransition` removed; use `layout` for position-based animations |
| Zustand v4 `set(produce(...))` with immer baked in | Zustand v5 requires explicit `immer` middleware import | Zustand v5 (2024) | No silent immer dependency; bundle size reduced |
| react-rnd v9 `onDrag` (fired continuously) | react-rnd v10 `onDragStop` / `onResizeStop` (fired on completion) | react-rnd v10 | `onDrag` still exists but `onDragStop` is the correct hook for state sync |

**Deprecated/outdated in this stack:**
- `motion.positionTransition` → replaced by `layout` prop
- Zustand `devtools` v4 API → v5 has updated signature (not needed for Phase 2)
- Framer Motion `useViewportScroll` → renamed to `useScroll` in v6+ (not relevant here)

---

## Open Questions

1. **Welcome app manifest and URL**
   - What we know: Shell opens Welcome window on first launch using a manifest-like descriptor
   - What's unclear: In Phase 2, the Welcome app is a placeholder iframe. Where does `/apps/welcome/index.html` come from? Phase 5 delivers the real Welcome app.
   - Recommendation: Phase 2 Welcome window should point to a minimal static HTML file in `packages/shell/public/apps/welcome/index.html` — a placeholder with just the text "Welcome to Vidorra OS". Phase 5 replaces this with the real app.

2. **`built-in-apps.json` for Dock default state**
   - What we know: CONTEXT.md states "Dock default only shows App Store (written to `built-in-apps.json`)"
   - What's unclear: Where does this file live? Who reads it? AppRegistry only reads from localStorage.
   - Recommendation: The planner should clarify this. One clean approach: `useWindowStore` (or a `useDockStore`) reads a hard-coded `BUILT_IN_APPS` constant (or a `built-in-apps.json` import in the shell package) and pre-populates `appRegistry` on first boot. Alternatively, AppRegistry gains a `registerBuiltIn(manifest)` method called in `main.tsx`.

3. **Dock running indicator for Phase 2 (no real apps running)**
   - What we know: Phase 2 windows contain iframe placeholders; there is no KernelBus yet
   - What's unclear: How does the Dock know which apps are "running"?
   - Recommendation: Dock derives running state from `useWindowStore` — if any open window has `appId === app.id`, the app is "running". This is correct and ready for Phase 3 without changes.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | All build steps | ✓ | (inferred: pnpm works) | — |
| pnpm | Package management | ✓ | (workspace confirmed working) | — |
| Vite 6 | Shell dev server | ✓ | ^6.0.0 (in devDeps) | — |
| react-rnd | SHELL-01 | Not yet installed | Will be 10.5.3 | — |
| framer-motion | SHELL-02/04 | Not yet installed | Will be 12.38.0 | — |
| zustand | SHELL-01/03 | Not yet installed | Will be 5.0.12 | — |
| Wallpaper images | SHELL-07 | Not yet present | — | Download from Unsplash or use a CSS gradient fallback for Wave 0 |

**Missing dependencies with no fallback:**
- react-rnd, framer-motion, zustand — must be installed via `pnpm add` before implementation begins (Wave 0 task)

**Missing dependencies with fallback:**
- Wallpaper `default.jpg` — if not available, CSS `background: linear-gradient(...)` can be used as a placeholder until images are sourced

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 3.x (root vitest.config.ts, `globals: true`, `environment: node`) |
| Config file | `/vitest.config.ts` (root); no shell-specific config |
| Quick run command | `pnpm test --filter @vidorra/shell` |
| Full suite command | `pnpm test` |

**Note:** The root vitest config uses `environment: node`. Shell components require DOM. The shell package will need either (a) a `packages/shell/vitest.config.ts` with `environment: 'jsdom'` or `environment: 'happy-dom'`, or (b) a `/// <reference types="vitest" />` pragma with environment override. This is a Wave 0 gap.

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SHELL-01 | Windows open/close/drag/resize simultaneously | unit (store) | `vitest run packages/shell/src/stores/useWindowStore.test.ts` | ❌ Wave 0 |
| SHELL-02 | Minimize/maximize/close state transitions | unit (store) | `vitest run packages/shell/src/stores/useWindowStore.test.ts` | ❌ Wave 0 |
| SHELL-03 | Focus window raises z-index; previously focused window loses focus | unit (store) | `vitest run packages/shell/src/stores/useWindowStore.test.ts` | ❌ Wave 0 |
| SHELL-04 | Dock `getAllApps()` returns installed apps; running state derived correctly | unit (component) | `vitest run packages/shell/src/components/Dock/Dock.test.tsx` | ❌ Wave 0 |
| SHELL-05 | Dock right-click menu items contextual on running state | unit (component) | `vitest run packages/shell/src/components/Dock/Dock.test.tsx` | ❌ Wave 0 |
| SHELL-06 | Menubar shows focused app name; clock formats `HH:mm` | unit (component) | `vitest run packages/shell/src/components/Menubar/Menubar.test.tsx` | ❌ Wave 0 |
| SHELL-07 | Desktop reads `localStorage['vidorra:wallpaper']`; falls back to default | unit (component) | `vitest run packages/shell/src/components/Desktop/Desktop.test.tsx` | ❌ Wave 0 |
| SHELL-08 | Welcome opens on first launch; skipped after `vidorra:welcomed` set | unit (component) | `vitest run packages/shell/src/App.test.tsx` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `pnpm test` (full suite is fast; all tests are unit-level)
- **Per wave merge:** `pnpm test` + manual browser smoke test
- **Phase gate:** Full suite green + manual QUAL-01 checklist before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `packages/shell/vitest.config.ts` — jsdom/happy-dom environment for React component testing
- [ ] `packages/shell/package.json` — add `vitest`, `@testing-library/react`, `@testing-library/user-event`, `jsdom` to devDependencies
- [ ] `packages/shell/src/stores/useWindowStore.test.ts` — covers SHELL-01, SHELL-02, SHELL-03
- [ ] `packages/shell/src/components/Dock/Dock.test.tsx` — covers SHELL-04, SHELL-05
- [ ] `packages/shell/src/components/Menubar/Menubar.test.tsx` — covers SHELL-06
- [ ] `packages/shell/src/components/Desktop/Desktop.test.tsx` — covers SHELL-07
- [ ] `packages/shell/src/App.test.tsx` — covers SHELL-08
- [ ] `packages/shell/public/wallpapers/` directory with `default.jpg`

---

## Project Constraints (from CLAUDE.md)

No project-level `CLAUDE.md` exists at the repository root. Global CLAUDE.md (user-level) contains only personal contact information — no technical directives applicable to this project.

Constraints enforced by established patterns (from STATE.md and CONTEXT.md):
- TypeScript strict mode — no `any`
- CSS Modules only — no CSS-in-JS, no Tailwind
- Class + singleton export for kernel layer; hook-based for shell layer
- ESM (`"type": "module"`)
- Framer Motion (not CSS animations) for all interactive animations
- react-rnd (not custom drag implementation)
- Zustand (not React Context + useReducer) for window state

---

## Sources

### Primary (HIGH confidence)
- Verified via `npm view` — react-rnd@10.5.3, framer-motion@12.38.0, zustand@5.0.12 (registry, 2026-04-01)
- `.reference/macos-web-main/src/components/Dock/DockItem.svelte` — magnification math structure, bounce animation concept
- `.reference/macos-preact-main/src/components/dock/DockItem.tsx` — **PRIMARY for Dock**: precise spring params (stiffness:1300, damping:82), useRaf pattern, translateY bounce, dot CSS variable, transform-origin:bottom
- `.reference/macos-preact-main/src/components/dock/Dock.module.scss` — ::before backdrop blur isolation, box-shadow formula, border-radius 1.2rem, divider style
- `.reference/macos-web-main/src/components/Dock/Dock.svelte` — mouse tracking fallback reference
- `.reference/macos-web-main/src/components/Desktop/Window/Window.svelte` — shadow values, maximize transition, drag handle pattern
- `.reference/macos-web-main/src/components/Desktop/Window/TrafficLights.svelte` — exact traffic light hex colors, size, gap
- `.reference/macos-web-main/src/components/TopBar/TopBar.svelte` — Menubar height (1.8rem = ~28.8px, spec uses 24px), glass formula, clock font
- `packages/types/src/window.ts` — WindowDescriptor, WindowRect, WindowState types (read directly)
- `packages/types/src/manifest.ts` — AppManifest with minSize, menubar fields (read directly)
- `packages/kernel/src/app-registry.ts` — getAllApps() interface (read directly)
- `packages/kernel/src/theme-engine.ts` — CSS variable names and hex values (read directly)
- `.planning/phases/02-shell/02-CONTEXT.md` — all locked decisions
- `.planning/phases/02-shell/02-UI-SPEC.md` — complete visual/interaction spec

### Secondary (MEDIUM confidence)
- `docs/plans/mvp-plan.md` — tech stack rationale, package structure
- `docs/plans/2026-04-01-phase1-kernel-design.md` — kernel interface patterns

### Tertiary (LOW confidence)
- None — all findings verified against code or official package registry

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — versions confirmed against npm registry; packages confirmed installable
- Architecture: HIGH — patterns derived from reference implementation + existing type definitions
- Pitfalls: HIGH — derived from code inspection of reference implementation + known Framer Motion / react-rnd integration constraints
- Test gaps: HIGH — confirmed by inspection of existing vitest.config.ts (node environment, no shell tests)

**Research date:** 2026-04-01
**Valid until:** 2026-05-01 (stable stack; framer-motion and zustand release frequently but APIs are stable)
