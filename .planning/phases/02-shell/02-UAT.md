---
status: complete
phase: 02-shell
source: [02-00-SUMMARY.md, 02-01-SUMMARY.md, 02-02-SUMMARY.md, 02-03-SUMMARY.md, 02-04-SUMMARY.md, 02-05-SUMMARY.md]
started: 2026-04-01T23:05:00Z
updated: 2026-04-02T00:15:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Shell Cold Start
expected: Run `pnpm --filter @vidorra/shell dev`. Page loads without errors. You see a desktop wallpaper background, menubar at the top, dock at the bottom.
result: pass

### 2. Welcome Window on First Launch
expected: Clear localStorage, reload — Welcome window opens. Reload again — does not reopen.
result: pass

### 3. Window Drag and Resize
expected: Open any window (click a Dock icon). Drag it by the titlebar — it follows the cursor smoothly. Drag the bottom-right corner/edge to resize — window size updates live.
result: pass

### 4. Traffic Lights (Minimize / Maximize / Close)
expected: Every window has 3 colored buttons top-left: red (close), yellow (minimize), green (maximize). Red closes, yellow minimizes, green maximizes.
result: issue
reported: "三个按钮对窗口的动作表现正常，但是hover上去没有具体图标展示（×、−、⤢），参考 .reference 中的项目"
severity: cosmetic

### 5. Minimize and Restore
expected: Click yellow button — window minimizes with animation. Click Dock icon — window restores.
result: issue
reported: "可以最小化，有淡出缩放效果，但落点位置不对——缩到窗口正下方而非Dock栏对应图标的位置"
severity: minor

### 6. Dock Magnification
expected: Move mouse across Dock icons. Icons near cursor grow larger (spring magnification). Icons away shrink back.
result: issue
reported: "图标确实变大了，但dock背景条高度也跟着变高了（应保持不变），且背景条左上角有奇怪的视觉问题。建议完全套用reference中的项目代码"
severity: major

### 7. Dock Running Indicator
expected: When an app has an open window, a small white dot appears below its Dock icon. When the window is closed, the dot disappears.
result: pass

### 8. Dock Launch Bounce
expected: Click a Dock icon to open an app. The icon briefly bounces upward with a spring animation before settling back.
result: issue
reported: "动作正确但卡顿不丝滑，对比reference项目差距明显"
severity: minor

### 9. Menubar App Name
expected: Click a window to focus it. The menubar shows that window's title/app name to the right of the Apple icon. When no window is focused, it shows "Vidorra OS".
result: issue
reported: "打开app后菜单栏正确显示app名，但点击桌面不会失焦（除非关闭或最小化）；最小化后点击原窗口位置仍会聚焦并改变菜单栏名称（最小化窗口仍响应点击）"
severity: major

### 10. Menubar Clock
expected: The menubar shows the current time in HH:mm format on the right side. The time updates when the minute changes.
result: issue
reported: "时钟显示正常，但菜单栏整体字体颜色是黑色，应该是白色；右键菜单文字也是黑色"
severity: major

### 11. Desktop Right-Click Context Menu
expected: Right-click on the desktop background. A context menu appears with items: "关于 Vidorra OS", "更改壁纸...", a separator line, "强制刷新". Clicking outside dismisses it. Pressing Escape dismisses it.
result: pass

### 12. Change Wallpaper
expected: Right-click desktop → "更改壁纸...". A system file picker opens. Select an image file. The desktop wallpaper updates immediately and persists after reload.
result: issue
reported: "可以选择文件并替换壁纸，但刷新后白屏——壁纸消失了"
severity: major

### 13. Force Refresh
expected: Right-click desktop → "强制刷新". The page reloads.
result: pass

### 14. Dock Glass / Liquid Glass Effect
expected: The Dock has a frosted glass appearance with edge chromatic aberration from the SVG displacement filter.
result: issue
reported: "效果不满意，建议放弃液态玻璃，完全复制macos-web reference的Dock和ContextMenu CSS样式"
severity: major

### 15. Context Menu Glass Effect
expected: The right-click context menu has the frosted liquid glass appearance (same displacement-filter effect as the Dock).
result: issue
reported: "效果不好，没有高亮边缘，需要换成reference CSS样式"
severity: major

## Summary

total: 15
passed: 6
issues: 9
pending: 0
skipped: 0

## Gaps

- truth: "Dock and ContextMenu use CSS glass matching macos-web reference (no SVG liquid glass)"
  status: failed
  reason: "User reported: 液态玻璃效果不满意，要求放弃GlassPanel，完全复制macos-web reference的Dock和ContextMenu CSS"
  severity: major
  test: 14
  artifacts: [packages/shell/src/components/Dock/Dock.tsx, packages/shell/src/components/Dock/Dock.module.css, packages/shell/src/components/ContextMenu/ContextMenu.tsx, packages/shell/src/components/ContextMenu/ContextMenu.module.css]
  missing: [revert GlassPanel usage, restore pure CSS backdrop-filter glass matching .reference/macos-web-main Dock/ContextMenu styles]

- truth: "Selected wallpaper persists across page reloads"
  status: failed
  reason: "User reported: 可以选择文件并替换壁纸，但刷新后白屏——壁纸消失了"
  severity: major
  test: 12
  artifacts: [packages/shell/src/components/Desktop/Desktop.tsx]
  missing: [URL.createObjectURL produces a blob: URL revoked on page unload — must store image as base64 via FileReader and save to localStorage]

- truth: "Menubar text (app name, menu items, clock) and context menu text are white, not black"
  status: failed
  reason: "User reported: 菜单栏字体颜色是黑色应为白色，右键菜单文字也是黑色"
  severity: major
  test: 10
  artifacts: [packages/shell/src/components/Menubar/Menubar.module.css, packages/shell/src/components/ContextMenu/ContextMenu.module.css]
  missing: [color: white on menubar text, color: var(--color-text) or explicit white on context menu items]

- truth: "Clicking the desktop background unfocuses all windows and menubar reverts to 'Vidorra OS'; minimized windows do not respond to clicks at their previous position"
  status: failed
  reason: "User reported: 点击桌面不会失焦；最小化后点击原窗口位置仍触发聚焦并改变菜单栏名称"
  severity: major
  test: 9
  artifacts: [packages/shell/src/components/Desktop/Desktop.tsx, packages/shell/src/components/WindowFrame/WindowFrame.tsx, packages/shell/src/components/WindowManager/WindowManager.tsx]
  missing: [desktop click handler to clear focused window in store, minimized windows must have pointer-events:none so they cannot be clicked]

- truth: "Dock icon bounce animation is smooth and springy, matching macOS reference feel"
  status: failed
  reason: "User reported: 动作正确但卡顿不丝滑，对比reference项目差距明显"
  severity: minor
  test: 8
  artifacts: [packages/shell/src/components/Dock/DockItem.tsx]
  missing: [spring physics tuning — stiffness/damping values need calibration against reference]

- truth: "Dock background bar stays fixed height during magnification; icons grow upward from bottom baseline; no visual artifacts on the bar"
  status: failed
  reason: "User reported: dock背景条高度跟着图标放大变高了，左上角存在奇怪的视觉问题，建议完全套用reference中的项目代码"
  severity: major
  test: 6
  artifacts: [packages/shell/src/components/Dock/DockItem.tsx, packages/shell/src/components/Dock/Dock.module.css, packages/shell/src/components/Dock/Dock.tsx]
  missing: [align-items flex-end so icons grow upward, GlassPanel layout fix for corner artifact, full reference-parity Dock implementation]

- truth: "Minimize animation shrinks window toward the Dock icon position of the corresponding app"
  status: failed
  reason: "User reported: 落点位置不对——缩到窗口正下方而非Dock栏对应图标的位置"
  severity: minor
  test: 5
  artifacts: [packages/shell/src/components/WindowFrame/WindowFrame.tsx, packages/shell/src/components/Dock/DockItem.tsx]
  missing: [Dock icon position tracking, minimize target coordinates passed to WindowFrame animation]

- truth: "Traffic light buttons show hover icons (× for close, − for minimize, ⤢ for maximize) matching macOS reference"
  status: failed
  reason: "User reported: hover上去没有具体图标展示（×、−、⤢），参考 .reference 中的项目"
  severity: cosmetic
  test: 4
  artifacts: [packages/shell/src/components/WindowFrame/TrafficLights.tsx]
  missing: [hover icon SVGs on traffic light buttons]
