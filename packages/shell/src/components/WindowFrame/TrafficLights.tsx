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

  const unfocusedBg = '#b6b6b7'
  const unfocusedShadow = '0 0 0 0.5px rgba(0,0,0,0.15)'

  const handleMouseDown = (e: React.MouseEvent) => e.stopPropagation()

  return (
    <div className={styles.container} onMouseDown={handleMouseDown}>
      <button
        className={styles.button}
        style={
          focused
            ? { background: '#ff5f56', boxShadow: '0 0 0 0.5px #e0443e' }
            : { background: unfocusedBg, boxShadow: unfocusedShadow }
        }
        tabIndex={0}
        aria-label="Close window"
        onClick={() => closeWindow(windowId)}
        onMouseDown={handleMouseDown}
      >
        {focused && <CloseIcon />}
      </button>
      <button
        className={styles.button}
        style={
          focused
            ? { background: '#ffbd2e', boxShadow: '0 0 0 0.5px #dea123' }
            : { background: unfocusedBg, boxShadow: unfocusedShadow }
        }
        tabIndex={0}
        aria-label="Minimize window"
        onClick={() => setWindowState(windowId, 'minimized')}
        onMouseDown={handleMouseDown}
      >
        {focused && <MinimizeIcon />}
      </button>
      <button
        className={styles.button}
        style={
          focused
            ? { background: '#27c93f', boxShadow: '0 0 0 0.5px #1aab29' }
            : { background: unfocusedBg, boxShadow: unfocusedShadow }
        }
        tabIndex={0}
        aria-label="Maximize window"
        onClick={() => toggleMaximize(windowId)}
        onMouseDown={handleMouseDown}
      >
        {focused && <MaximizeIcon />}
      </button>
    </div>
  )
}
