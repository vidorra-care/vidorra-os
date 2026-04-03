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
  const setWindowState = useWindowStore((s) => s.setWindowState)

  useEffect(() => {
    setApps(appRegistry.getAllApps())
  }, [])

  // Re-read registry when App Store (iframe) installs or uninstalls apps
  useEffect(() => {
    const refresh = () => setApps(appRegistry.getAllApps())
    window.addEventListener('storage', refresh)
    return () => window.removeEventListener('storage', refresh)
  }, [])

  const handleOpen = (app: AppManifest) => {
    const existing = windows.find((w) => w.appId === app.id)
    if (existing) {
      if (existing.state === 'minimized') setWindowState(existing.id, 'normal')
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
        y: Math.round((window.innerHeight - 24 - app.defaultSize.height) / 2) + 24,
        width: app.defaultSize.width,
        height: app.defaultSize.height,
      },
      state: 'normal',
      minWidth: app.minSize?.width ?? 200,
      minHeight: app.minSize?.height ?? 150,
    })
  }

  return (
    <section className={styles.container}>
      <div
        className={styles.dockEl}
        onMouseMove={(e) => mouseX.set(e.nativeEvent.x)}
        onMouseLeave={() => mouseX.set(null)}
      >
        {apps.map((app) => {
          const isRunning = windows.some((w) => w.appId === app.id)
          return (
            <div key={app.id} style={{ display: 'contents' }}>
              {app.dockBreaksBefore && (
                <div className={styles.divider} aria-hidden="true" />
              )}
              <DockItem
                app={app}
                mouseX={mouseX}
                isRunning={isRunning}
                onOpen={handleOpen}
              />
            </div>
          )
        })}
      </div>
    </section>
  )
}
