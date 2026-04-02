import { useWindowStore } from '../../stores/useWindowStore'
import styles from './TrafficLights.module.css'

interface TrafficLightsProps {
  windowId: string
  focused: boolean
}

function CloseIcon() {
  return (
    <svg width={7} height={7} fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        stroke="#4d0000"
        strokeWidth={1.2}
        strokeLinecap="round"
        d="M1.182 5.99L5.99 1.182m0 4.95L1.182 1.323"
      />
    </svg>
  )
}

function MinimizeIcon() {
  return (
    <svg width={6} height={2} fill="none" xmlns="http://www.w3.org/2000/svg">
      <path stroke="#4d3400" strokeWidth={2} strokeLinecap="round" d="M.61 1h5.8" />
    </svg>
  )
}

function MaximizeIcon() {
  return (
    <svg width={8} height={8} fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        stroke="#004d00"
        strokeWidth={1.2}
        strokeLinecap="round"
        d="M1.5 6.5L6.5 1.5M4.5 1.5H6.5V3.5M1.5 4.5V6.5H3.5"
      />
    </svg>
  )
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
        <CloseIcon />
      </button>
      <button
        className={styles.minimizeLight}
        aria-label="Minimize window"
        onClick={() => setWindowState(windowId, 'minimized')}
        onMouseDown={stopPropagation}
      >
        <MinimizeIcon />
      </button>
      <button
        className={styles.maximizeLight}
        aria-label="Maximize window"
        onClick={() => toggleMaximize(windowId)}
        onMouseDown={stopPropagation}
      >
        <MaximizeIcon />
      </button>
    </div>
  )
}
