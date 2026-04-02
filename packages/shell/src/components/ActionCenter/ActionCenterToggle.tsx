import { useRef, useState, useEffect } from 'react'
import { ActionCenter } from './ActionCenter'
import styles from './ActionCenterToggle.module.css'

function SwitchIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 351 348"
      fill="none"
      stroke="currentColor"
      strokeWidth="20"
    >
      <path d="M87.75 46.2C97.06 46.2 105.99 49.45 112.57 55.22 119.15 60.997 122.85 68.83 122.85 77c0 8.17-3.7 16-10.28 21.78C105.99 104.555 97.06 107.8 87.75 107.8c-9.31 0-18.24-3.245-24.82-9.02C56.348 93 52.65 85.17 52.65 77c0-8.17 3.698-16 10.28-21.78C69.51 49.445 78.44 46.2 87.75 46.2zM263.25 0c23.27 0 45.59 8.11 62.05 22.55C341.755 36.99 351 56.58 351 77c0 20.42-9.245 40.007-25.7 54.447C308.84 145.888 286.52 154 263.25 154H87.75C64.48 154 42.16 145.888 25.7 131.447 9.245 117.007 0 97.42 0 77 0 56.578 9.245 36.993 25.7 22.553 42.158 8.112 64.477 0 87.75 0h175.5zM87.75 30.8C73.786 30.8 60.395 35.668 50.52 44.332 40.647 52.996 35.1 64.747 35.1 77c0 12.253 5.547 24.004 15.42 32.668C60.395 118.332 73.786 123.2 87.75 123.2H263.25c13.964 0 27.355-4.867 37.229-13.532C310.353 101.004 315.9 89.253 315.9 77c0-12.253-5.547-24.004-15.421-32.668C290.605 35.667 277.214 30.8 263.25 30.8H87.75z" />
      <path d="M263.25 194H87.75C64.477 194 42.158 202.112 25.7 216.553 9.245 230.993 0 250.578 0 271c0 20.422 9.245 40.007 25.7 54.447C42.158 339.888 64.477 348 87.75 348H263.25c23.273 0 45.592-8.112 62.049-22.553C341.755 311.007 351 291.422 351 271c0-20.422-9.245-40.007-25.701-54.447C308.842 202.112 286.523 194 263.25 194zm0 123.2c-13.964 0-27.355-4.867-37.229-13.532C216.147 295.004 210.6 283.253 210.6 271c0-12.253 5.547-24.004 15.421-32.668C236.895 229.667 250.286 224.8 263.25 224.8c13.964 0 27.355 4.867 37.229 13.532C310.353 246.996 315.9 258.747 315.9 271c0 12.253-5.547 24.004-15.421 32.668C290.605 312.333 277.214 317.2 263.25 317.2z" />
    </svg>
  )
}

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
        <SwitchIcon />
      </button>
      {open && (
        <div className={styles.panel}>
          <ActionCenter />
        </div>
      )}
    </div>
  )
}
