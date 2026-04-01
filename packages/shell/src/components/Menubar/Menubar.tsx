import { useState } from 'react'
import { useWindowStore } from '../../stores/useWindowStore'
import { appRegistry } from '@vidorra/kernel'
import { ContextMenu } from '../ContextMenu/ContextMenu'
import type { ContextMenuEntry } from '../ContextMenu/ContextMenu'
import { MenubarClock } from './MenubarClock'
import styles from './Menubar.module.css'

function AppleIconSVG() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M11.17 7.47c-.02-1.89 1.55-2.8 1.62-2.84-0.88-1.29-2.26-1.47-2.75-1.49-1.17-.12-2.28.69-2.87.69-.59 0-1.51-.67-2.48-.65-1.28.02-2.46.74-3.12 1.89-1.33 2.3-.34 5.72.96 7.59.64.92 1.4 1.96 2.39 1.92.96-.04 1.32-.62 2.48-.62 1.16 0 1.49.62 2.5.6 1.03-.02 1.68-.94 2.31-1.87.73-1.07 1.03-2.1 1.05-2.16-.02-.01-2.07-.8-2.09-3.06zM9.19 2.13C9.73 1.47 10.1.55 9.99-.41c-.82.03-1.8.55-2.38 1.23-.52.6-.98 1.55-.85 2.47.9.07 1.82-.46 2.43-1.16z" />
    </svg>
  )
}

const DEFAULT_MENU_ITEMS = ['文件', '编辑', '窗口', '帮助']

export function Menubar() {
  const [showAppleMenu, setShowAppleMenu] = useState(false)

  const focusedWindow = useWindowStore((s) =>
    s.windows.find((w) => w.focused) ?? null
  )

  const manifest = focusedWindow
    ? appRegistry.getApp(focusedWindow.appId) ?? null
    : null

  const displayName = focusedWindow ? focusedWindow.title : 'Vidorra OS'

  const menuItems: string[] = manifest?.menubar
    ? Object.keys(manifest.menubar)
    : focusedWindow
      ? []
      : DEFAULT_MENU_ITEMS

  const appleMenuItems: ContextMenuEntry[] = [
    { label: '关于 Vidorra OS', action: () => { /* no-op in Phase 2 */ } },
    { label: '系统设置...', action: () => { /* open Settings app window in Phase 5 */ } },
  ]

  const toggleAppleMenu = () => setShowAppleMenu((v) => !v)

  return (
    <header className={styles.menubar}>
      <div className={styles.leftSection}>
        <div
          className={styles.appleIcon}
          onClick={toggleAppleMenu}
          aria-label="Apple 菜单"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleAppleMenu() }}
        >
          <AppleIconSVG />
        </div>
        <span className={styles.appName}>{displayName}</span>
        {menuItems.map((item) => (
          <button key={item} className={styles.menuItem}>
            {item}
          </button>
        ))}
      </div>
      <div className={styles.rightSection}>
        <MenubarClock />
      </div>
      {showAppleMenu && (
        <ContextMenu
          x={0}
          y={24}
          items={appleMenuItems}
          onClose={() => setShowAppleMenu(false)}
        />
      )}
    </header>
  )
}
