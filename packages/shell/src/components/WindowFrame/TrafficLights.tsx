import { Icon } from '@iconify/react'
import { useWindowStore } from '../../stores/useWindowStore'
import styles from './TrafficLights.module.css'

interface TrafficLightsProps {
  windowId: string
  focused: boolean
}

export function TrafficLights({ windowId, focused }: TrafficLightsProps) {
  const closeWindow = useWindowStore((s) => s.closeWindow)
  const setWindowState = useWindowStore((s) => s.setWindowState)
  const toggleMaximize = useWindowStore((s) => s.toggleMaximize)

  const stopPropagation = (e: React.MouseEvent) => e.stopPropagation()

  const containerClass = [
    styles.container,
    !focused ? styles.unfocused : '',
  ].filter(Boolean).join(' ')

  return (
    <div className={containerClass} onMouseDown={stopPropagation}>
      <button
        className={styles.closeLight}
        aria-label="Close window"
        onClick={() => closeWindow(windowId)}
        onMouseDown={stopPropagation}
      >
        <Icon icon="ri:close-line" width={8} height={8} color="#4d0000" />
      </button>
      <button
        className={styles.minimizeLight}
        aria-label="Minimize window"
        onClick={() => setWindowState(windowId, 'minimized')}
        onMouseDown={stopPropagation}
      >
        <Icon icon="ri:subtract-line" width={8} height={8} color="#4d3400" />
      </button>
      <button
        className={styles.maximizeLight}
        aria-label="Maximize window"
        onClick={() => toggleMaximize(windowId)}
        onMouseDown={stopPropagation}
      >
        <Icon icon="ri:fullscreen-line" width={8} height={8} color="#004d00" />
      </button>
    </div>
  )
}
