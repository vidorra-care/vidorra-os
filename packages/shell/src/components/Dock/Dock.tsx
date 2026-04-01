import { useEffect, useState } from 'react'
import { useMotionValue } from 'framer-motion'
import type { AppManifest } from '@vidorra/types'
import { appRegistry } from '@vidorra/kernel'
import { useWindowStore } from '../../stores/useWindowStore'
import { DockItem } from './DockItem'
import { GlassPanel } from '../LiquidGlass'
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

  const handleOpen = (app: AppManifest) => {
    const existing = windows.find((w) => w.appId === app.id)
    if (existing) {
      if (existing.state === 'minimized') {
        setWindowState(existing.id, 'normal')
      }
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
    <div className={styles.dockWrapper}>
      <GlassPanel
        cornerRadius={20}
        padding="0"
        displacementScale={30}
        blurAmount={0.3}
        saturation={190}
        aberrationIntensity={1.5}
        style={{ boxShadow: 'inset 0 0.5px 0 rgba(255,255,255,0.7), inset 0 -0.5px 0 rgba(0,0,0,0.08), 0 0 0 0.5px rgba(0,0,0,0.18), 0 4px 24px rgba(0,0,0,0.22), 0 1px 4px rgba(0,0,0,0.12)' }}
      >
        <nav
          className={styles.dockInner}
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
      </GlassPanel>
    </div>
  )
}
