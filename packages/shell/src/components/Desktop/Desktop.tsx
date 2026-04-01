import { useState, useEffect, useCallback } from 'react'
import { ContextMenu } from '../ContextMenu/ContextMenu'
import type { ContextMenuEntry } from '../ContextMenu/ContextMenu'
import styles from './Desktop.module.css'

const DEFAULT_WALLPAPER = '/wallpapers/default.jpg'
const STORAGE_KEY = 'vidorra:wallpaper'

export function Desktop() {
  const [wallpaperUrl, setWallpaperUrl] = useState(DEFAULT_WALLPAPER)
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) setWallpaperUrl(stored)
  }, [])

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setMenu({ x: e.clientX, y: e.clientY })
  }, [])

  const desktopMenuItems: ContextMenuEntry[] = [
    { label: '关于 Vidorra OS', action: () => { /* no-op Phase 2 */ } },
    { label: '更改壁纸...', action: () => { /* opens Settings app in Phase 5 */ } },
    { separator: true },
    { label: '强制刷新', action: () => window.location.reload() },
  ]

  return (
    <div
      className={styles.desktop}
      style={{ backgroundImage: `url(${wallpaperUrl})` }}
      onContextMenu={handleContextMenu}
    >
      {menu && (
        <ContextMenu
          x={menu.x}
          y={menu.y}
          items={desktopMenuItems}
          onClose={() => setMenu(null)}
        />
      )}
    </div>
  )
}
