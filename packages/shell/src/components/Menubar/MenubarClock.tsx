import { useState, useEffect } from 'react'
import styles from './Menubar.module.css'

function formatTime(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

export function MenubarClock() {
  const [time, setTime] = useState(() => formatTime(new Date()))

  useEffect(() => {
    const tick = () => setTime(formatTime(new Date()))
    const now = new Date()
    const msToNext = (60 - now.getSeconds()) * 1000 - now.getMilliseconds()
    let intervalId: ReturnType<typeof setInterval>
    const timeoutId = setTimeout(() => {
      tick()
      intervalId = setInterval(tick, 60_000)
    }, msToNext)
    return () => {
      clearTimeout(timeoutId)
      clearInterval(intervalId)
    }
  }, [])

  return <span className={styles.clock}>{time}</span>
}
