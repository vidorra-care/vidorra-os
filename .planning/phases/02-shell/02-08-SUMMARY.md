---
id: 02-08
phase: 02-shell
plan: 08
status: complete
completed: 2026-04-01T23:46:00Z
commit: 01b33ca
---

## What Was Done

Closed UAT gap 5:

**Minimize genie toward Dock icon** — added `useDockStore` with RAF-based icon position tracking. `DockItem` registers its `getBoundingClientRect` into the store. `WindowFrame` reads the target icon's coordinates and uses them as `animateTarget` in the minimize animation, so the window flies toward its actual Dock icon instead of straight down.

## Files Changed

- `packages/shell/src/stores/useDockStore.ts` (new: icon position registry)
- `packages/shell/src/stores/useWindowStore.ts` (minor: minimize target)
- `packages/shell/src/components/Dock/DockItem.tsx`
- `packages/shell/src/components/WindowFrame/WindowFrame.tsx`
