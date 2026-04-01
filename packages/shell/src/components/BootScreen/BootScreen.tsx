import { useEffect, useState } from 'react'
import styles from './BootScreen.module.css'

export function BootScreen() {
  const [progress, setProgress] = useState(0)
  const [fadingOut, setFadingOut] = useState(false)
  const [gone, setGone] = useState(false)

  useEffect(() => {
    if (!import.meta.env.PROD) return
    const start = performance.now()
    const duration = 3000

    const frame = (now: number) => {
      const elapsed = now - start
      const p = Math.min(elapsed / duration, 1)
      setProgress(p * 100)
      if (p < 1) {
        requestAnimationFrame(frame)
      } else {
        setFadingOut(true)
        setTimeout(() => setGone(true), 600)
      }
    }
    requestAnimationFrame(frame)
  }, [])

  if (!import.meta.env.PROD || gone) return null

  return (
    <div
      className={styles.bootScreen}
      style={{ opacity: fadingOut ? 0 : 1 }}
    >
      <div className={styles.logo}>
        <svg width="60" height="72" viewBox="0 0 60 72" fill="white" aria-label="Vidorra">
          <path d="M30 4 L56 68 H4 Z" opacity="0.9" />
        </svg>
      </div>
      <div className={styles.progressTrack}>
        <div
          className={styles.progressBar}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}
