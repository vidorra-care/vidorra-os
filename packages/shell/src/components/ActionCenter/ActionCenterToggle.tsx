import { useRef, useState, useEffect } from 'react'
import { Icon } from '@iconify/react'
import { ActionCenter } from './ActionCenter'
import styles from './ActionCenterToggle.module.css'

export function ActionCenterToggle() {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div className={styles.container} ref={containerRef}>
      <button
        className={styles.toggleButton}
        onClick={() => setOpen((v) => !v)}
        aria-label="Control Center"
        aria-expanded={open}
      >
        <Icon icon="ri:toggle-line" width={18} height={18} />
      </button>
      {open && (
        <div className={styles.panel}>
          <ActionCenter />
        </div>
      )}
    </div>
  )
}
