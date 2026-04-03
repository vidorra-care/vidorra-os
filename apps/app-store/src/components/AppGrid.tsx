import type { AppManifest } from '@vidorra/types'
import { AppCard } from './AppCard'
import styles from './AppGrid.module.css'

interface AppGridProps {
  apps: AppManifest[]
  onCardClick: (app: AppManifest) => void
  onUninstall: (appId: string) => void
}

export function AppGrid({ apps, onCardClick, onUninstall }: AppGridProps) {
  if (apps.length === 0) {
    return (
      <div className={styles.empty}>
        <p className={styles.emptyHeading}>No apps installed</p>
        <p className={styles.emptyBody}>Install an app from a manifest URL to get started.</p>
      </div>
    )
  }

  return (
    <div className={styles.grid}>
      {apps.map((app) => (
        <AppCard
          key={app.id}
          app={app}
          onClick={onCardClick}
          onUninstall={onUninstall}
        />
      ))}
    </div>
  )
}
