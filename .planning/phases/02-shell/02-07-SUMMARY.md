---
id: 02-07
phase: 02-shell
plan: 07
status: complete
completed: 2026-04-01T23:46:00Z
commit: 01b33ca
---

## What Was Done

Closed UAT gaps 4, 8:

1. **Traffic light hover icons** — `×/−/⤢` icons appear on hover using CSS `visibility` group-hover pattern, matching reference SVG icons.
2. **Dock bounce animation** — migrated from Framer Motion spring to reference keyframe array pattern (`[0, -20, 0, -10, 0]`) for smooth, physics-accurate bounce.

## Files Changed

- `packages/shell/src/components/WindowFrame/TrafficLights.tsx`
- `packages/shell/src/components/WindowFrame/TrafficLights.module.css`
- `packages/shell/src/components/Dock/DockItem.tsx`
