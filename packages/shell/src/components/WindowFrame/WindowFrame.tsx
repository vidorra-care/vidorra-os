import { useEffect, useRef, useState } from 'react'
import { Rnd } from 'react-rnd'
import { motion } from 'framer-motion'
import { useWindowStore } from '../../stores/useWindowStore'
import { TrafficLights } from './TrafficLights'
import styles from './WindowFrame.module.css'
import type { WindowDescriptor, WindowRect } from '@vidorra/types'

interface WindowStoreWindow extends WindowDescriptor {
  preMaximizeRect?: WindowRect
  minWidth: number
  minHeight: number
}

interface WindowFrameProps {
  window: WindowStoreWindow
}

export function WindowFrame({ window: win }: WindowFrameProps) {
  const focusWindow = useWindowStore((s) => s.focusWindow)
  const setWindowRect = useWindowStore((s) => s.setWindowRect)
  const toggleMaximize = useWindowStore((s) => s.toggleMaximize)

  const isMaximized = win.state === 'maximized'
  const isMinimized = win.state === 'minimized'

  // Track whether minimized window should be hidden (after animation completes)
  const [isHidden, setIsHidden] = useState(false)
  const prevStateRef = useRef(win.state)

  // When state changes from minimized to something else, show before animation starts
  useEffect(() => {
    const prevState = prevStateRef.current
    const currState = win.state

    if (prevState === 'minimized' && currState !== 'minimized') {
      // Show the window before restore animation
      setIsHidden(false)
    }

    prevStateRef.current = currState
  }, [win.state])

  const position = isMaximized
    ? { x: 0, y: 24 }
    : { x: win.rect.x, y: win.rect.y }

  const size = isMaximized
    ? {
        width: globalThis.innerWidth ?? '100vw',
        height: (globalThis.innerHeight ?? window.innerHeight) - 24,
      }
    : { width: win.rect.width, height: win.rect.height }

  const handleDragStop = (_: unknown, d: { x: number; y: number }) => {
    const viewportWidth = globalThis.innerWidth
    const viewportHeight = globalThis.innerHeight
    const MIN_VISIBLE = 80
    const TITLEBAR_HEIGHT = 28

    const clampedX = Math.max(
      MIN_VISIBLE - win.rect.width,
      Math.min(d.x, viewportWidth - MIN_VISIBLE)
    )
    const clampedY = Math.max(0, Math.min(d.y, viewportHeight - TITLEBAR_HEIGHT))

    setWindowRect(win.id, { ...win.rect, x: clampedX, y: clampedY })
  }

  const handleResizeStop = (
    _e: unknown,
    _direction: unknown,
    ref: HTMLElement,
    _delta: { width: number; height: number },
    pos: { x: number; y: number }
  ) => {
    setWindowRect(win.id, {
      x: pos.x,
      y: pos.y,
      width: parseInt(ref.style.width, 10),
      height: parseInt(ref.style.height, 10),
    })
  }

  const animateTarget = isMinimized
    ? { scale: 0.1, opacity: 0, y: 500 }
    : { scale: 1, opacity: 1, y: 0 }

  const transition = isMinimized
    ? { type: 'spring' as const, stiffness: 300, damping: 35 }
    : { duration: 0.2, ease: 'easeOut' as const }

  const handleAnimationComplete = () => {
    if (win.state === 'minimized') {
      setIsHidden(true)
    }
  }

  const frameClasses = [
    styles.windowFrame,
    isMaximized ? styles.maximized : '',
    isHidden ? styles.minimizedHidden : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <Rnd
      position={position}
      size={size}
      disableDragging={isMaximized}
      enableResizing={!isMaximized && !isMinimized}
      dragHandleClassName="window-drag-handle"
      minWidth={win.minWidth}
      minHeight={win.minHeight}
      style={{ zIndex: win.zIndex, pointerEvents: 'auto' }}
      onDragStop={handleDragStop}
      onResizeStop={handleResizeStop}
      onMouseDown={() => focusWindow(win.id)}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={animateTarget}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={transition}
        onAnimationComplete={handleAnimationComplete}
        data-focused={String(win.focused)}
        className={frameClasses}
        style={{ width: '100%', height: '100%' }}
      >
        <div
          className={`${styles.titlebar} window-drag-handle`}
          onDoubleClick={() => toggleMaximize(win.id)}
        >
          <TrafficLights windowId={win.id} focused={win.focused} />
          <span className={styles.title}>{win.title}</span>
        </div>
        <div className={styles.content}>
          <iframe
            src={win.url}
            title={win.title}
            sandbox="allow-scripts allow-same-origin"
          />
        </div>
      </motion.div>
    </Rnd>
  )
}
