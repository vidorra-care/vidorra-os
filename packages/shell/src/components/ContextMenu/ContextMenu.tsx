import { useEffect, useCallback } from 'react'
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

  return (
    <div
      className={styles.contextMenu}
      style={{ left: x, top: y }}
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
  )
}
