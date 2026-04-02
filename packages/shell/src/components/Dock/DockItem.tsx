import { useRef, useState } from 'react'
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  type MotionValue,
} from 'framer-motion'
import type { AppManifest } from '@vidorra/types'
import { useWindowStore } from '../../stores/useWindowStore'
import { useDockStore } from '../../stores/useDockStore'
import { useRaf } from '../../hooks/useRaf'
import { ContextMenu } from '../ContextMenu/ContextMenu'
import type { ContextMenuEntry } from '../ContextMenu/ContextMenu'
import styles from './Dock.module.css'

const baseWidth = 57.6
const distanceLimit = baseWidth * 6
const beyondLimit = distanceLimit + 1

const distanceInput = [
  -distanceLimit,
  -distanceLimit / 1.25,
  -distanceLimit / 2,
  0,
  distanceLimit / 2,
  distanceLimit / 1.25,
  distanceLimit,
]
const widthOutput = [
  baseWidth,
  baseWidth * 1.1,
  baseWidth * 1.414,
  baseWidth * 2,
  baseWidth * 1.414,
  baseWidth * 1.1,
  baseWidth,
]

interface DockItemProps {
  app: AppManifest
  mouseX: MotionValue<number | null>
  isRunning: boolean
  onOpen: (app: AppManifest) => void
}

interface MenuState {
  x: number
  y: number
}

export function DockItem({ app, mouseX, isRunning, onOpen }: DockItemProps) {
  const imgRef = useRef<HTMLImageElement>(null)
  const [menu, setMenu] = useState<MenuState | null>(null)
  const [animateObj, setAnimateObj] = useState({ translateY: ['0%', '0%', '0%'] })

  const closeWindow = useWindowStore((s) => s.closeWindow)
  const focusWindow = useWindowStore((s) => s.focusWindow)
  const windows = useWindowStore((s) => s.windows)
  const setIconPosition = useDockStore((s) => s.setIconPosition)

  const distance = useMotionValue(beyondLimit)

  useRaf(() => {
    const el = imgRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    // Always update icon position for minimize target tracking
    setIconPosition(app.id, {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    })
    const mouseXVal = mouseX.get()
    if (mouseXVal !== null) {
      distance.set(mouseXVal - (rect.left + rect.width / 2))
      return
    }
    distance.set(beyondLimit)
  }, true)

  const widthPX = useSpring(useTransform(distance, distanceInput, widthOutput), {
    stiffness: 1300,
    damping: 82,
  })

  const width = useTransform(widthPX, (w) => `${w / 16}rem`)

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    setMenu({ x: e.clientX, y: e.clientY })
  }

  const closeAllWindowsForApp = (appId: string) => {
    windows.filter((w) => w.appId === appId).forEach((w) => closeWindow(w.id))
  }

  const focusExistingWindow = (appId: string) => {
    const win = windows.find((w) => w.appId === appId)
    if (win) focusWindow(win.id)
  }

  const menuItems: ContextMenuEntry[] = isRunning
    ? [
        { label: '在 Dock 中隐藏', action: () => {} },
        { label: '关闭', action: () => closeAllWindowsForApp(app.id) },
      ]
    : [{ label: '打开', action: () => onOpen(app) }]

  return (
    <>
      <button
        className={styles.dockItemButton}
        onClick={() => onOpen(app)}
        onContextMenu={handleContextMenu}
        title={app.name}
        aria-label={`Launch ${app.name}`}
      >
        <motion.span
          className={styles.iconWrapper}
          onTap={() => setAnimateObj({ translateY: ['0%', '-39.2%', '0%'] })}
          initial={false}
          animate={animateObj}
          transition={{ type: 'spring', duration: 0.7 }}
          transformTemplate={({ translateY }) => `translateY(${translateY})`}
        >
          <p className={styles.tooltip}>{app.name}</p>
          <motion.img
            ref={imgRef}
            src={app.icon}
            alt={app.name}
            className={styles.dockIcon}
            style={{ width, willChange: 'width' }}
            draggable={false}
          />
        </motion.span>
        <div
          className={styles.dot}
          data-testid="running-dot"
          style={{ '--opacity': +isRunning } as React.CSSProperties}
        />
      </button>
      {menu && (
        <ContextMenu
          x={menu.x}
          y={menu.y}
          items={menuItems}
          onClose={() => setMenu(null)}
        />
      )}
    </>
  )
}
