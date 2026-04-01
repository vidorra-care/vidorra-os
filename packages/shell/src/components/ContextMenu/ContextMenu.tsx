import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
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
  const menuRef = useRef<HTMLDivElement>(null)
  const posRef = useRef({ left: x, top: y })

  // Clamp position to viewport after mount
  useEffect(() => {
    const el = menuRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    let left = x
    let top = y
    if (left + rect.width > window.innerWidth) {
      left = window.innerWidth - rect.width - 4
    }
    if (top + rect.height > window.innerHeight) {
      top = window.innerHeight - rect.height - 4
    }
    el.style.left = `${left}px`
    el.style.top = `${top}px`
  }, [x, y])

  // Click outside handler
  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleMouseDown)
    return () => document.removeEventListener('mousedown', handleMouseDown)
  }, [onClose])

  // Escape key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <motion.div
      ref={menuRef}
      className={styles.menu}
      style={{ left: posRef.current.left, top: posRef.current.top }}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.1, ease: 'easeOut' }}
    >
      {items.map((entry, index) => {
        if (entry.separator === true) {
          return <div key={index} className={styles.separator} />
        }
        return (
          <button
            key={index}
            className={styles.item}
            onClick={() => {
              entry.action()
              onClose()
            }}
          >
            {entry.label}
          </button>
        )
      })}
    </motion.div>
  )
}
