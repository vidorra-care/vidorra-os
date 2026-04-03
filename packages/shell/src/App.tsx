import { useEffect } from 'react'
import { appRegistry } from '@vidorra/kernel'
import type { AppManifest } from '@vidorra/types'
import { useWindowStore } from './stores/useWindowStore'
import { Desktop } from './components/Desktop/Desktop'
import { Menubar } from './components/Menubar/Menubar'
import { WindowManager } from './components/WindowManager/WindowManager'
import { Dock } from './components/Dock/Dock'
import { BootScreen } from './components/BootScreen/BootScreen'
import styles from './App.module.css'

// Built-in apps to seed into appRegistry on first boot
import builtInApps from '../../../registry/built-in-apps.json'

const WELCOMED_KEY = 'vidorra:welcomed'

export default function App() {
  const openWindow = useWindowStore((s) => s.openWindow)

  // Seed built-in apps into appRegistry if not already present
  useEffect(() => {
    for (const app of builtInApps.apps) {
      appRegistry.registerLocal(app as unknown as AppManifest)
    }
  }, [])

  // Welcome window on first launch
  useEffect(() => {
    const welcomed = localStorage.getItem(WELCOMED_KEY)
    if (!welcomed) {
      openWindow({
        id: crypto.randomUUID(),
        appId: 'welcome',
        title: 'Welcome to Vidorra OS',
        url: '/apps/welcome/index.html',
        icon: '/app-icons/welcome.svg',
        rect: {
          x: Math.round((window.innerWidth - 600) / 2),
          y: Math.round((window.innerHeight - 400) / 2),
          width: 600,
          height: 400,
        },
        state: 'normal',
      })
      localStorage.setItem(WELCOMED_KEY, '1')
    }
  }, [openWindow])

  return (
    <div className={styles.shell}>
      <BootScreen />
      <Desktop />
      <Menubar />
      <WindowManager />
      <Dock />
    </div>
  )
}
