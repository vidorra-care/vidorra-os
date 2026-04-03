import { useState } from 'react'
import styles from './WallpaperPanel.module.css'

const WALLPAPERS = [
  { id: 'default', path: '/wallpapers/default.png', label: 'Default' },
  { id: 'preset-1', path: '/wallpapers/preset-1.jpg', label: 'Preset 1' },
  { id: 'preset-2', path: '/wallpapers/preset-2.jpg', label: 'Preset 2' },
]

const WALLPAPER_KEY = 'vidorra:wallpaper'

function getInitialWallpaper(): string {
  return localStorage.getItem(WALLPAPER_KEY) ?? WALLPAPERS[0].path
}

export function WallpaperPanel() {
  const [selected, setSelected] = useState<string>(getInitialWallpaper)

  const handleSelect = (path: string) => {
    setSelected(path)
    localStorage.setItem(WALLPAPER_KEY, path)
    // StorageEvent fires in other browsing contexts (Shell's main frame)
    // Desktop.tsx listener (plan 01) receives it and updates wallpaper
  }

  return (
    <section className={styles.panel}>
      <h2 className={styles.heading}>Wallpaper</h2>
      <div className={styles.grid}>
        {WALLPAPERS.map(({ id, path, label }) => {
          const isSelected = selected === path
          return (
            <div key={id} className={styles.item}>
              <button
                className={[styles.thumbnail, isSelected ? styles.selected : ''].join(' ')}
                onClick={() => handleSelect(path)}
                aria-label={`Select wallpaper: ${label}`}
                aria-pressed={isSelected}
              >
                <img src={path} alt={label} className={styles.thumbnailImg} />
              </button>
              {isSelected && (
                <span className={styles.selectedLabel}>Selected</span>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
