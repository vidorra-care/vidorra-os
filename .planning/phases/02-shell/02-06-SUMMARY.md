---
id: 02-06
phase: 02-shell
plan: 06
status: complete
completed: 2026-04-01T23:46:00Z
commit: 01b33ca
---

## What Was Done

Closed UAT gaps 9, 12, 14, 15:

1. **Dock/ContextMenu CSS glass** — reverted GlassPanel abstraction → pure CSS `backdrop-filter` matching reference `Dock.module.scss` and `ContextMenu.module.scss`. Also fixed Menubar + context menu text color (white, was black).
2. **Desktop unfocus** — clicking the desktop unfocuses all windows.
3. **Minimized window pointer-events** — `pointer-events: none` when minimized (prevented phantom clicks after genie animation).
4. **Wallpaper persistence** — `FileReader.readAsDataURL` encodes to base64 for localStorage persistence across reloads.

## Files Changed

- `packages/shell/src/components/Dock/Dock.module.css`
- `packages/shell/src/components/Dock/Dock.tsx`
- `packages/shell/src/components/ContextMenu/ContextMenu.module.css`
- `packages/shell/src/components/ContextMenu/ContextMenu.tsx`
- `packages/shell/src/components/Menubar/Menubar.module.css`
- `packages/shell/src/components/Desktop/Desktop.tsx`
- `packages/shell/src/components/WindowFrame/WindowFrame.tsx`
