import { useThemeStore } from '../../stores/useThemeStore'
import styles from './ActionCenter.module.css'

function WifiIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M1 9l2 2c5.07-5.06 13.31-5.06 18.38 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3a4.237 4.237 0 00-6 0zm-4-4l2 2a7.074 7.074 0 0110 0l2-2C15.14 9.14 8.87 9.14 5 13z"/>
    </svg>
  )
}

function BluetoothIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.71 7.71L12 2h-1v7.59L6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 11 14.41V22h1l5.71-5.71-4.3-4.29 4.3-4.29zM13 5.83l1.88 1.88L13 9.59V5.83zm1.88 10.46L13 18.17v-3.76l1.88 1.88z"/>
    </svg>
  )
}

function AirDropIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 11c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm6 2c0-3.31-2.69-6-6-6s-6 2.69-6 6c0 2.22 1.21 4.15 3 5.19l1-1.74c-1.19-.7-2-1.97-2-3.45 0-2.21 1.79-4 4-4s4 1.79 4 4c0 1.48-.81 2.75-2 3.45l1 1.74c1.79-1.04 3-2.97 3-5.19zM12 3C6.48 3 2 7.48 2 13c0 3.7 2.01 6.92 4.99 8.65l1-1.73C5.61 18.53 4 15.96 4 13c0-4.42 3.58-8 8-8s8 3.58 8 8c0 2.96-1.61 5.53-4 6.92l1 1.73c2.99-1.73 5-4.95 5-8.65 0-5.52-4.48-10-10-10z"/>
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 512 512" fill="currentColor">
      <path d="M283.211 512c78.962 0 151.079-35.925 198.857-94.792 7.068-8.708-.639-21.43-11.562-19.35-124.203 23.654-238.262-71.576-238.262-196.954 0-72.222 38.662-138.635 101.498-174.394 9.686-5.512 7.25-20.197-3.756-22.23A258.156 258.156 0 00283.211 0c-141.309 0-256 114.511-256 256 0 141.309 114.511 256 256 256z" />
    </svg>
  )
}

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
            <WifiIcon />
          </Toggle>
        </Tile>
        <Tile label="Bluetooth">
          <Toggle filled label="Bluetooth">
            <BluetoothIcon />
          </Toggle>
        </Tile>
        <Tile label="AirDrop">
          <Toggle filled={false} label="AirDrop">
            <AirDropIcon />
          </Toggle>
        </Tile>
      </div>

      <div className={styles.surfaceRow}>
        <div className={styles.surface}>
          <Tile label="Dark Mode">
            <Toggle filled={isDark} onClick={toggleTheme} label="Toggle dark mode">
              <MoonIcon />
            </Toggle>
          </Tile>
        </div>
      </div>
    </div>
  )
}
