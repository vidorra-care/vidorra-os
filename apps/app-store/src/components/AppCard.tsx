import { useState, useCallback } from 'react'
import type { AppManifest } from '@vidorra/types'
import styles from './AppCard.module.css'

interface AppCardProps {
  app: AppManifest
  onClick: (app: AppManifest) => void
  onUninstall: (appId: string) => void
}

interface ContextMenuState {
  x: number
  y: number
}

export function AppCard({ app, onClick, onUninstall }: AppCardProps) {
  const [menu, setMenu] = useState<ContextMenuState | null>(null)

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setMenu({ x: e.clientX, y: e.clientY })
  }, [])

  const closeMenu = useCallback(() => setMenu(null), [])

  return (
    <>
      <div
        className={styles.card}
        draggable
        onDragStart={(e) => e.dataTransfer.setData('text/plain', app.id)}
        onClick={() => onClick(app)}
        onContextMenu={handleContextMenu}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && onClick(app)}
        aria-label={`${app.name} version ${app.version}`}
      >
        <img
          src={app.icon}
          alt={app.name}
          className={styles.icon}
          width={56}
          height={56}
        />
        <p className={styles.name}>{app.name}</p>
        <p className={styles.version}>Version {app.version}</p>
      </div>

      {menu && (
        <div
          className={styles.contextOverlay}
          onClick={closeMenu}
          onContextMenu={(e) => { e.preventDefault(); closeMenu() }}
        >
          <ul
            className={styles.contextMenu}
            style={{ top: menu.y, left: menu.x }}
            role="menu"
          >
            <li role="menuitem">
              <button className={styles.contextItem} onClick={() => { closeMenu(); onClick(app) }}>
                Open
              </button>
            </li>
            <li role="menuitem">
              <button
                className={[styles.contextItem, styles.contextItemDestructive].join(' ')}
                onClick={() => { closeMenu(); onUninstall(app.id) }}
              >
                Uninstall App
              </button>
            </li>
          </ul>
        </div>
      )}
    </>
  )
}
