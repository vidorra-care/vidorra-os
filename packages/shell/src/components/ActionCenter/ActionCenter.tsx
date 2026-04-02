import { Icon } from '@iconify/react'
import { useThemeStore } from '../../stores/useThemeStore'
import styles from './ActionCenter.module.css'

interface ToggleProps {
  filled: boolean
  onClick?: () => void
  children: React.ReactNode
  label: string
}

function Toggle({ filled, onClick, children, label }: ToggleProps) {
  return (
    <button
      className={[styles.toggle, filled ? styles.toggleOn : styles.toggleOff].join(' ')}
      onClick={onClick}
      aria-label={label}
      aria-pressed={filled}
    >
      {children}
    </button>
  )
}

interface TileProps {
  label: string
  children: React.ReactNode
}

function Tile({ label, children }: TileProps) {
  return (
    <div className={styles.tile}>
      {children}
      <span className={styles.tileLabel}>{label}</span>
    </div>
  )
}

export function ActionCenter() {
  const { theme, toggleTheme } = useThemeStore()
  const isDark = theme === 'dark'

  return (
    <div className={styles.container}>
      <div className={styles.surface}>
        <Tile label="Wi-Fi">
          <Toggle filled label="Wi-Fi">
            <Icon icon="ri:wifi-line" width={16} height={16} />
          </Toggle>
        </Tile>
        <Tile label="Bluetooth">
          <Toggle filled label="Bluetooth">
            <Icon icon="ri:bluetooth-line" width={18} height={18} />
          </Toggle>
        </Tile>
        <Tile label="AirDrop">
          <Toggle filled={false} label="AirDrop">
            <Icon icon="ri:airplay-line" width={16} height={16} />
          </Toggle>
        </Tile>
      </div>

      <div className={styles.surfaceRow}>
        <div className={styles.surface}>
          <Tile label="Dark Mode">
            <Toggle filled={isDark} onClick={toggleTheme} label="Toggle dark mode">
              <Icon icon="ri:moon-line" width={16} height={16} />
            </Toggle>
          </Tile>
        </div>
      </div>
    </div>
  )
}
