import { useState } from 'react'
import { themeEngine } from '@vidorra/kernel'
import type { ThemeMode } from '@vidorra/kernel'
import styles from './GeneralPanel.module.css'

const THEME_OPTIONS: { label: string; value: ThemeMode }[] = [
  { label: 'Light', value: 'light' },
  { label: 'Dark', value: 'dark' },
  { label: 'Auto', value: 'auto' },
]

export function GeneralPanel() {
  const [activeMode, setActiveMode] = useState<ThemeMode>(themeEngine.getMode())

  const handleThemeSelect = (mode: ThemeMode) => {
    setActiveMode(mode)
    themeEngine.setMode(mode)
    // themeEngine.setMode() automatically:
    // 1. Injects CSS vars onto Shell :root
    // 2. Fires notify() -> KernelBusHost pushes theme.changed to all trusted iframes
    // 3. plan 01's themeEngine.subscribe() bridge keeps useThemeStore in sync
  }

  return (
    <section className={styles.panel}>
      <h2 className={styles.heading}>Appearance</h2>
      <div className={styles.control}>
        <div className={styles.segmentedControl} role="group" aria-label="Theme selection">
          {THEME_OPTIONS.map(({ label, value }) => (
            <button
              key={value}
              className={[styles.segment, activeMode === value ? styles.segmentActive : ''].join(' ')}
              onClick={() => handleThemeSelect(value)}
              aria-pressed={activeMode === value}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
