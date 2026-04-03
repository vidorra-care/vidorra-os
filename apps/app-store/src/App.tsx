import { useState } from 'react'
import type { AppManifest } from '@vidorra/types'
import { AppGrid } from './components/AppGrid'
import { AppDetail } from './components/AppDetail'
import { InstallModal } from './components/InstallModal'
import { TrashZone } from './components/TrashZone'
import { useAppRegistry } from './hooks/useAppRegistry'
import styles from './App.module.css'

type View = 'grid' | 'detail'

export default function App() {
  const { apps, installing, installError, install, uninstall, clearError } = useAppRegistry()
  const [view, setView] = useState<View>('grid')
  const [selectedApp, setSelectedApp] = useState<AppManifest | null>(null)
  const [showInstallModal, setShowInstallModal] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  const handleCardClick = (app: AppManifest) => {
    setSelectedApp(app)
    setView('detail')
  }

  const handleBack = () => {
    setSelectedApp(null)
    setView('grid')
  }

  const handleUninstall = async (appId: string) => {
    await uninstall(appId)
    if (view === 'detail') handleBack()
  }

  const handleInstallSubmit = async (url: string) => {
    // Use the boolean return value from install() — do NOT check installError after
    // await, as React state updates are async and the value would be stale (checker issue).
    const hadError = await install(url)
    if (!hadError) setShowInstallModal(false)
  }

  return (
    <div
      className={styles.root}
      onDragStart={() => setIsDragging(true)}
      onDragEnd={() => setIsDragging(false)}
    >
      {/* Token system declared in App.module.css via :global(body) */}

      {/* Toolbar: 48px height */}
      <header className={styles.toolbar}>
        <h1 className={styles.toolbarTitle}>App Store</h1>
        <button
          className={styles.installBtn}
          onClick={() => setShowInstallModal(true)}
        >
          Install from URL
        </button>
      </header>

      {/* Content area */}
      <div className={styles.content}>
        {view === 'grid' && (
          <AppGrid
            apps={apps}
            onCardClick={handleCardClick}
            onUninstall={handleUninstall}
          />
        )}
        {view === 'detail' && selectedApp && (
          <AppDetail
            app={selectedApp}
            onBack={handleBack}
            onUninstall={handleUninstall}
          />
        )}
      </div>

      {/* TrashZone: visible only when dragging */}
      <TrashZone
        visible={isDragging}
        onDrop={handleUninstall}
      />

      {/* Install modal */}
      {showInstallModal && (
        <InstallModal
          installing={installing}
          error={installError}
          onInstall={handleInstallSubmit}
          onClose={() => { setShowInstallModal(false); clearError() }}
        />
      )}
    </div>
  )
}
