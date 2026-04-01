import { useEffect, useCallback } from 'react'
import type { CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { GlassPanel } from '../LiquidGlass'
import styles from './ContextMenu.module.css'

export interface ContextMenuItem {
  label: string
  action: () => void
  separator?: false
}

export interface ContextMenuSeparator {
  separator: true
}

export type ContextMenuEntry = ContextMenuItem | ContextMenuSeparator

interface ContextMenuProps {
  x: number
  y: number
  items: ContextMenuEntry[]
  onClose: () => void
}

export function ContextMenu({ x, y, items, onClose }: ContextMenuProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    },
    [onClose]
  )

  useEffect(() => {
    const handleClickOutside = () => onClose()
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose, handleKeyDown])

  return createPortal(
    <GlassPanel
      cornerRadius={10}
      padding="0"
      displacementScale={20}
      blurAmount={0.4}
      saturation={200}
      aberrationIntensity={1.2}
      style={{
        position: 'fixed',
        left: x,
        top: y,
        minWidth: 160,
        zIndex: 1002,
        userSelect: 'none',
        WebkitUserSelect: 'none',
        boxShadow:
          'inset 0 0.5px 0 rgba(255,255,255,0.8), inset 0 -0.5px 0 rgba(0,0,0,0.06), 0 0 0 0.5px rgba(0,0,0,0.14), 0 8px 32px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.1)',
      } as CSSProperties}
      className={styles.contextMenuPanel}
    >
      <div
        onMouseDown={(e) => e.stopPropagation()}
      >
        {items.map((item, index) =>
          'separator' in item && item.separator ? (
            <hr key={index} className={styles.separator} />
          ) : (
            <button
              key={index}
              className={styles.item}
              onClick={() => {
                ;(item as ContextMenuItem).action()
                onClose()
              }}
            >
              {(item as ContextMenuItem).label}
            </button>
          )
        )}
      </div>
    </GlassPanel>,
    document.body
  )
}
