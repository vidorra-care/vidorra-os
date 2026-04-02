import { useRef, useEffect } from 'react'
import { Icon } from '@iconify/react'
import { useWindowStore } from '../../stores/useWindowStore'
import { useMenubarStore } from '../../stores/useMenubarStore'
import { defaultMenuConfig, type MenuConfig } from '../../data/finder.menu.config'
import { Menu } from './Menu'
import { MenubarClock } from './MenubarClock'
import { ActionCenterToggle } from '../ActionCenter/ActionCenterToggle'
import styles from './Menubar.module.css'

function AppleIcon() {
  return <Icon icon="ri:apple-line" width={14} height={14} aria-hidden="true" />
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
                onClick={() => isActive ? closeMenu() : setActiveMenu(menuId)}
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
      <ActionCenterToggle />
      <div className={styles.rightSection}>
        <MenubarClock />
      </div>
    </header>
  )
}
