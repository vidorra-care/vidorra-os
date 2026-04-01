import { useState, useEffect, useCallback, useRef } from 'react'
import { ContextMenu } from '../ContextMenu/ContextMenu'
import type { ContextMenuEntry } from '../ContextMenu/ContextMenu'
import styles from './Desktop.module.css'

const DEFAULT_WALLPAPER = '/wallpapers/default.jpg'
const STORAGE_KEY = 'vidorra:wallpaper'

export function Desktop() {
  const [wallpaperUrl, setWallpaperUrl] = useState(DEFAULT_WALLPAPER)
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) setWallpaperUrl(stored)
  }, [])

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setMenu({ x: e.clientX, y: e.clientY })
  }, [])

  const handleWallpaperChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    setWallpaperUrl(url)
    localStorage.setItem(STORAGE_KEY, url)
    // Reset input so the same file can be picked again
    e.target.value = ''
  }, [])

  const desktopMenuItems: ContextMenuEntry[] = [
    { label: '关于 Vidorra OS', action: () => { /* no-op Phase 2 */ } },
    { label: '更改壁纸...', action: () => fileInputRef.current?.click() },
    { separator: true },
    { label: '强制刷新', action: () => window.location.reload() },
  ]

  return (
    <div
      className={styles.desktop}
      style={{ backgroundImage: `url(${wallpaperUrl})` }}
      onContextMenu={handleContextMenu}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleWallpaperChange}
      />
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
