import { useEffect, useRef, useState } from 'react'
import { Rnd } from 'react-rnd'
import { motion } from 'framer-motion'
import { useWindowStore, type WindowStoreWindow } from '../../stores/useWindowStore'
import { TrafficLights } from './TrafficLights'
import styles from './WindowFrame.module.css'

interface WindowFrameProps {
  window: WindowStoreWindow
}

export function WindowFrame({ window: win }: WindowFrameProps) {
  const focusWindow = useWindowStore((s) => s.focusWindow)
  const setWindowRect = useWindowStore((s) => s.setWindowRect)
  const toggleMaximize = useWindowStore((s) => s.toggleMaximize)

  const isMaximized = win.state === 'maximized'
  const isMinimized = win.state === 'minimized'

  const [isHidden, setIsHidden] = useState(false)
  const prevStateRef = useRef(win.state)
  const [isDragging, setIsDragging] = useState(false)

  // Show window before restore animation when un-minimizing
  useEffect(() => {
    if (win.state !== 'minimized' && isHidden) {
      setIsHidden(false)
    }
  }, [win.state, isHidden])
  prevStateRef.current = win.state

  const position = isMaximized ? { x: 0, y: 0 } : { x: win.rect.x, y: win.rect.y }
  const size = isMaximized
    ? { width: window.innerWidth, height: window.innerHeight - 28 }
    : { width: win.rect.width, height: win.rect.height }

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
    ? { scale: 0.1, opacity: 0, y: 400 }
    : { scale: 1, opacity: 1, y: 0 }

  const transition = isMinimized
    ? { type: 'spring' as const, stiffness: 300, damping: 35 }
    : { duration: 0.18, ease: 'easeOut' as const }

  const handleAnimationComplete = () => {
    if (win.state === 'minimized') setIsHidden(true)
  }

  const frameClasses = [
    styles.windowFrame,
    isMaximized ? styles.maximized : '',
    isHidden ? styles.minimizedHidden : '',
    isDragging ? styles.dragging : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <Rnd
      position={position}
      size={size}
      bounds="parent"
      disableDragging={isMaximized}
      enableResizing={!isMaximized && !isMinimized}
      dragHandleClassName="window-drag-handle"
      minWidth={win.minWidth ?? 200}
      minHeight={win.minHeight ?? 150}
      style={{ zIndex: win.zIndex, pointerEvents: 'auto' }}
      onDragStart={() => setIsDragging(true)}
      onDragStop={(_e, d) => {
        setIsDragging(false)
        setWindowRect(win.id, { ...win.rect, x: d.x, y: d.y })
      }}
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
          {/* Overlay prevents iframe from stealing mouse events during drag */}
          {isDragging && <div className={styles.dragOverlay} />}
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
