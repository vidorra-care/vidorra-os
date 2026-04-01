import { useWindowStore } from '../../stores/useWindowStore'

interface TrafficLightsProps {
  windowId: string
  focused: boolean
}

export function TrafficLights({ windowId, focused }: TrafficLightsProps) {
  const closeWindow = useWindowStore((s) => s.closeWindow)
  const setWindowState = useWindowStore((s) => s.setWindowState)
  const toggleMaximize = useWindowStore((s) => s.toggleMaximize)

  const unfocusedStyle = {
    background: '#b6b6b7',
    border: 'none',
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation()
  }

  const buttonBase: React.CSSProperties = {
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    cursor: 'default',
    outline: 'none',
    display: 'block',
    padding: 0,
    flexShrink: 0,
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        position: 'absolute',
        top: '8px',
        left: '12px',
      }}
      onMouseDown={handleMouseDown}
    >
      <button
        style={{
          ...buttonBase,
          ...(focused
            ? { background: '#ff5f56', border: '0.5px solid #e0443e' }
            : unfocusedStyle),
        }}
        tabIndex={0}
        aria-label="Close window"
        onClick={() => closeWindow(windowId)}
        onMouseDown={handleMouseDown}
      />
      <button
        style={{
          ...buttonBase,
          ...(focused
            ? { background: '#ffbd2e', border: '0.5px solid #dea123' }
            : unfocusedStyle),
        }}
        tabIndex={0}
        aria-label="Minimize window"
        onClick={() => setWindowState(windowId, 'minimized')}
        onMouseDown={handleMouseDown}
      />
      <button
        style={{
          ...buttonBase,
          ...(focused
            ? { background: '#27c93f', border: '0.5px solid #1aab29' }
            : unfocusedStyle),
        }}
        tabIndex={0}
        aria-label="Maximize window"
        onClick={() => toggleMaximize(windowId)}
        onMouseDown={handleMouseDown}
      />
    </div>
  )
}
