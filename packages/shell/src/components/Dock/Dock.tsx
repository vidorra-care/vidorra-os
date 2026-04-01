import { useEffect, useState } from 'react'
import { useMotionValue } from 'framer-motion'
import type { AppManifest } from '@vidorra/types'
import { appRegistry } from '@vidorra/kernel'
import { useWindowStore } from '../../stores/useWindowStore'
import { DockItem } from './DockItem'
import styles from './Dock.module.css'

export function Dock() {
  const [apps, setApps] = useState<AppManifest[]>([])
  const mouseX = useMotionValue<number | null>(null)

  const windows = useWindowStore((s) => s.windows)
  const openWindow = useWindowStore((s) => s.openWindow)
  const focusWindow = useWindowStore((s) => s.focusWindow)

  useEffect(() => {
    setApps(appRegistry.getAllApps())
  }, [])

  const handleOpen = (app: AppManifest) => {
    const existing = windows.find((w) => w.appId === app.id)
    if (existing) {
      focusWindow(existing.id)
      return
    }
    openWindow({
      id: crypto.randomUUID(),
      appId: app.id,
      title: app.name,
      url: app.entry,
      icon: app.icon,
      rect: {
        x: Math.round((window.innerWidth - app.defaultSize.width) / 2),
        y: Math.round((window.innerHeight - app.defaultSize.height) / 2),
        width: app.defaultSize.width,
        height: app.defaultSize.height,
      },
      state: 'normal',
      minWidth: app.minSize?.width ?? 200,
      minHeight: app.minSize?.height ?? 150,
    })
  }

  return (
    <nav
      className={styles.dock}
      onMouseMove={(e) => mouseX.set(e.nativeEvent.x)}
      onMouseLeave={() => mouseX.set(null)}
    >
      {apps.map((app) => {
        const isRunning = windows.some((w) => w.appId === app.id)
        return (
          <DockItem
            key={app.id}
            app={app}
            mouseX={mouseX}
            isRunning={isRunning}
            onOpen={handleOpen}
          />
        )
      })}
    </nav>
  )
}
