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
        stroke="#000"
        strokeWidth={1.2}
        strokeLinecap="round"
        d="M1.182 5.99L5.99 1.182m0 4.95L1.182 1.323"
      />
    </svg>
  )
}

function MinimizeIcon() {
  return (
    <svg width={6} height={1} fill="none" xmlns="http://www.w3.org/2000/svg">
      <path stroke="#000" strokeWidth={2} strokeLinecap="round" d="M.61.703h5.8" />
    </svg>
  )
}

function MaximizeIcon() {
  return (
    <svg
      viewBox="0 0 13 13"
      width={10}
      height={10}
      xmlns="http://www.w3.org/2000/svg"
      fillRule="evenodd"
      clipRule="evenodd"
      strokeLinejoin="round"
      strokeMiterlimit={2}
    >
      <path d="M4.871 3.553L9.37 8.098V3.553H4.871zm3.134 5.769L3.506 4.777v4.545h4.499z" />
      <circle cx={6.438} cy={6.438} r={6.438} fill="none" />
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
