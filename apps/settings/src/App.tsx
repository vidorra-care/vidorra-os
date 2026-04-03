import { useState } from 'react'
import { Sidebar } from './components/Sidebar'
import { GeneralPanel } from './components/panels/GeneralPanel'
import { WallpaperPanel } from './components/panels/WallpaperPanel'
import styles from './App.module.css'

type Panel = 'general' | 'wallpaper'

export default function App() {
  const [activePanel, setActivePanel] = useState<Panel>('general')

  return (
    <div className={styles.root}>
      <Sidebar activePanel={activePanel} onSelect={setActivePanel} />
      <main className={styles.content}>
        {activePanel === 'general' && <GeneralPanel />}
        {activePanel === 'wallpaper' && <WallpaperPanel />}
      </main>
    </div>
  )
}
