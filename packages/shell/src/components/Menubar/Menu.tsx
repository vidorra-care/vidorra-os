import { useEffect, useRef } from 'react'
import type { MenuItemConfig } from '../../data/finder.menu.config'
import styles from './Menu.module.css'

interface MenuProps {
  items: Record<string, MenuItemConfig>
  onClose: () => void
}

export function Menu({ items, onClose }: MenuProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const itemKeys = Object.keys(items)

  // Close on outside click (small delay avoids the triggering click closing it immediately)
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        onClose()
      }
    }
    const timer = setTimeout(() => document.addEventListener('mousedown', handler), 0)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('mousedown', handler)
    }
  }, [onClose])

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    const buttons = containerRef.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')
    if (!buttons) return
    const arr = Array.from(buttons)
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      arr[(index + 1) % arr.length]?.focus()
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      arr[(index - 1 + arr.length) % arr.length]?.focus()
    }
  }

  let focusableIndex = 0

  return (
    <div className={styles.container} ref={containerRef} tabIndex={-1}>
      {itemKeys.map((key) => {
        const item = items[key]
        const currentIndex = focusableIndex
        if (!item.disabled) focusableIndex++

        return (
          <div key={key}>
            <button
              className={[styles.menuItem, item.disabled ? styles.disabled : ''].filter(Boolean).join(' ')}
              disabled={item.disabled}
              onKeyDown={(e) => handleKeyDown(e, currentIndex)}
            >
              {item.title}
            </button>
            {item.breakAfter && <div className={styles.divider} />}
          </div>
        )
      })}
    </div>
  )
}
