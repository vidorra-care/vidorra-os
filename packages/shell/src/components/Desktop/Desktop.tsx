import { useState, useEffect, useCallback, useRef } from 'react'
import { ContextMenu } from '../ContextMenu/ContextMenu'
import type { ContextMenuEntry } from '../ContextMenu/ContextMenu'
import { useWindowStore } from '../../stores/useWindowStore'
import styles from './Desktop.module.css'

const DEFAULT_WALLPAPER = '/wallpapers/default.png'
const STORAGE_KEY = 'vidorra:wallpaper'

export function Desktop() {
  const [wallpaperUrl, setWallpaperUrl] = useState(DEFAULT_WALLPAPER)
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const unfocusAll = useWindowStore((s) => s.unfocusAll)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) setWallpaperUrl(stored)
  }, [])

  // React to wallpaper changes written by Settings iframe (storage event from same-origin iframe)
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        setWallpaperUrl(e.newValue)
      }
    }
    window.addEventListener('storage', handler)
    return () => window.removeEventListener('storage', handler)
  }, [])

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setMenu({ x: e.clientX, y: e.clientY })
  }, [])

  const handleClick = useCallback((e: React.MouseEvent) => {
    // Only unfocus if the click target is the desktop itself (not a child)
    if (e.target === e.currentTarget) unfocusAll()
  }, [unfocusAll])

  const handleWallpaperChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string
      if (!dataUrl) return
      setWallpaperUrl(dataUrl)
      localStorage.setItem(STORAGE_KEY, dataUrl)
    }
    reader.readAsDataURL(file)
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
      onClick={handleClick}
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
