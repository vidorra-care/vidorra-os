import { useRef, useEffect } from 'react'
import { useWindowStore } from '../../stores/useWindowStore'
import { useMenubarStore } from '../../stores/useMenubarStore'
import { defaultMenuConfig, type MenuConfig } from '../../data/finder.menu.config'
import { Menu } from './Menu'
import { MenubarClock } from './MenubarClock'
import styles from './Menubar.module.css'

function AppleIcon() {
  return (
    <svg width="13" height="16" viewBox="0 0 814 1000" fill="currentColor" aria-hidden="true">
      <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-43.4-150.3-109.6C27.8 766.4 1 637 1 524.3c0-221.1 144.4-338.2 285.7-338.2 75.5 0 138.5 49.9 185.5 49.9 44.9 0 118.1-52.7 203.7-52.7 32.4 0 117.6 1.3 177.3 64.3zm-158.3-81.4c31.1-36.9 53.1-88.1 53.1-139.3 0-7.1-.6-14.3-1.9-20.1-50.6 1.9-110.8 33.7-147.1 75.8-28.5 32.4-55.1 83.6-55.1 135.5 0 7.8 1.3 15.6 1.9 18.1 3.2.6 8.4 1.3 13.6 1.3 45.4 0 102.5-30.4 135.5-71.3z" />
    </svg>
  )
}

export function Menubar() {
  const { activeMenu, setActiveMenu, closeMenu } = useMenubarStore()
  const menubarRef = useRef<HTMLElement>(null)

  // focusedWindow kept for future Phase 4 dynamic menu injection
  const _focusedWindow = useWindowStore((s) =>
    s.windows.find((w) => w.focused) ?? null
  )

  const menuConfig: MenuConfig = defaultMenuConfig
  const menuIds = Object.keys(menuConfig)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!menubarRef.current?.contains(e.target as Node)) {
        closeMenu()
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [closeMenu])

  return (
    <header className={styles.menubar} ref={menubarRef}>
      <div className={styles.leftSection}>
        {menuIds.map((menuId) => {
          const menuDef = menuConfig[menuId]
          const isActive = activeMenu === menuId

          return (
            <div key={menuId} className={styles.menuWrapper}>
              <button
                className={[
                  styles.menuButton,
                  menuId === 'apple' ? styles.appleButton : '',
                  menuId === 'finder' ? styles.appNameButton : '',
                  isActive ? styles.active : '',
                ].filter(Boolean).join(' ')}
                onClick={() => setActiveMenu(isActive ? '' : menuId)}
                onMouseEnter={() => activeMenu && activeMenu !== menuId && setActiveMenu(menuId)}
                aria-haspopup="menu"
                aria-expanded={isActive}
              >
                {menuId === 'apple' ? <AppleIcon /> : menuDef.title}
              </button>

              {isActive && (
                <div className={styles.menuDropdown}>
                  <Menu
                    items={menuDef.items}
                    onClose={closeMenu}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className={styles.spacer} />

      <div className={styles.rightSection}>
        <MenubarClock />
      </div>
    </header>
  )
}
