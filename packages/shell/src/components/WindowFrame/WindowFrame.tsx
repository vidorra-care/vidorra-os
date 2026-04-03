import { useEffect, useRef, useState } from 'react'
import { Rnd } from 'react-rnd'
import { motion } from 'framer-motion'
import { kernelBusHost } from '@vidorra/kernel'
import { useWindowStore, type WindowStoreWindow } from '../../stores/useWindowStore'
import { useDockStore } from '../../stores/useDockStore'
import { TrafficLights } from './TrafficLights'
import styles from './WindowFrame.module.css'
interface WindowFrameProps {
  window: WindowStoreWindow
}

export function WindowFrame({ window: win }: WindowFrameProps) {
  const focusWindow = useWindowStore((s) => s.focusWindow)
  const setWindowRect = useWindowStore((s) => s.setWindowRect)
  const toggleMaximize = useWindowStore((s) => s.toggleMaximize)
  const iconPositions = useDockStore((s) => s.iconPositions)
  const dockTarget = iconPositions[win.appId]

  const isMaximized = win.state === 'maximized'
  const isMinimized = win.state === 'minimized'

  const [isHidden, setIsHidden] = useState(false)
  const prevStateRef = useRef(win.state)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const glassBgRef = useRef<HTMLDivElement>(null)

  // Sync the glass background div's transform to be the inverse of the window position.
  // Both transforms land on the compositor in the same frame — no layout, no paint.
  const syncGlassBg = (x: number, y: number) => {
    if (glassBgRef.current) {
      glassBgRef.current.style.transform = `translate(${-x}px, ${-y}px) scale(1.05)`
    }
  }

  // Initial sync and any state-driven position changes (e.g. maximize)
  useEffect(() => {
    syncGlassBg(win.rect.x, win.rect.y)
  })

  // Show window before restore animation when un-minimizing
  useEffect(() => {
    if (win.state !== 'minimized' && isHidden) {
      setIsHidden(false)
    }
  }, [win.state, isHidden])
  prevStateRef.current = win.state

  // Register/unregister iframe contentWindow with KernelBusHost
  useEffect(() => {
    const iframe = iframeRef.current
    if (!iframe) return
    const contentWindow = iframe.contentWindow
    if (!contentWindow) return
    kernelBusHost.registerFrame(win.id, contentWindow as WindowProxy)
    return () => {
      kernelBusHost.unregisterFrame(win.id)
    }
  }, [win.id])

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
    ? {
        scale: 0.1,
        opacity: 0,
        x: dockTarget ? dockTarget.x - (win.rect.x + win.rect.width / 2) : 0,
        y: dockTarget ? dockTarget.y - (win.rect.y + win.rect.height / 2) : 500,
      }
    : { scale: 1, opacity: 1, x: 0, y: 0 }

  const transition = isMinimized
    ? { type: 'spring' as const, stiffness: 300, damping: 35 }
    : { duration: 0.18, ease: 'easeOut' as const }

  const handleAnimationComplete = () => {
    if (win.state === 'minimized') setIsHidden(true)
  }

  const frameClasses = [
    styles.windowFrame,
    win.immersiveTitlebar ? styles.immersive : '',
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
      style={{ zIndex: win.zIndex, pointerEvents: isMinimized ? 'none' : 'auto' }}
      onDragStart={() => setIsDragging(true)}
      onDrag={(_e, d) => {
        syncGlassBg(d.x, d.y)
      }}
      onDragStop={(_e, d) => {
        setIsDragging(false)
        syncGlassBg(d.x, d.y)
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
        {win.immersiveTitlebar ? (
          <>
            {/* Immersive: traffic lights float over content, full-height iframe */}
            <div className={`${styles.immersiveControls} window-drag-handle`} onDoubleClick={() => toggleMaximize(win.id)}>
              <TrafficLights windowId={win.id} focused={win.focused} />
            </div>
            <div
              className={[
                styles.contentFull,
                win.windowStyle === 'glass-dark' ? styles.glassDark : '',
                win.windowStyle === 'glass-light' ? styles.glassLight : '',
              ].filter(Boolean).join(' ')}
              style={win.windowBackground ? { '--glass-tint': win.windowBackground } as React.CSSProperties : undefined}
            >
              {(win.windowStyle === 'glass-dark' || win.windowStyle === 'glass-light') && (
                <>
                  <div ref={glassBgRef} className={styles.glassBg} />
                  <div className={styles.glassTint} />
                </>
              )}
              {isDragging && <div className={styles.dragOverlay} />}
              <iframe
                ref={iframeRef}
                src={win.url}
                title={win.title}
                className={win.windowStyle && win.windowStyle !== 'solid' ? styles.transparentIframe : ''}
                sandbox="allow-scripts allow-same-origin"
              />
            </div>
          </>
        ) : (
          <>
            <div className={`${styles.titlebar} window-drag-handle`} onDoubleClick={() => toggleMaximize(win.id)}>
              <TrafficLights windowId={win.id} focused={win.focused} />
              <span className={styles.title}>{win.title}</span>
            </div>
            <div
              className={[
                styles.content,
                win.windowStyle === 'glass-dark' ? styles.glassDark : '',
                win.windowStyle === 'glass-light' ? styles.glassLight : '',
              ].filter(Boolean).join(' ')}
              style={win.windowBackground ? { '--glass-tint': win.windowBackground } as React.CSSProperties : undefined}
            >
              {(win.windowStyle === 'glass-dark' || win.windowStyle === 'glass-light') && (
                <>
                  <div ref={glassBgRef} className={styles.glassBg} />
                  <div className={styles.glassTint} />
                </>
              )}
              {isDragging && <div className={styles.dragOverlay} />}
              <iframe
                ref={iframeRef}
                src={win.url}
                title={win.title}
                className={win.windowStyle && win.windowStyle !== 'solid' ? styles.transparentIframe : ''}
                sandbox="allow-scripts allow-same-origin"
              />
            </div>
          </>
        )}
      </motion.div>
    </Rnd>
  )
}
