import { AnimatePresence } from 'framer-motion'
import { useWindowStore } from '../../stores/useWindowStore'
import { WindowFrame } from '../WindowFrame/WindowFrame'
import styles from './WindowManager.module.css'

export function WindowManager() {
  const windows = useWindowStore((s) => s.windows)

  return (
    <div className={styles.windowArea}>
      <AnimatePresence>
        {windows.map((win) => (
          <WindowFrame key={win.id} window={win} />
        ))}
      </AnimatePresence>
    </div>
  )
}
