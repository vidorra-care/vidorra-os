import type { AppManifest } from '@vidorra/types'
import styles from './AppDetail.module.css'

interface AppDetailProps {
  app: AppManifest
  onBack: () => void
  onUninstall: (appId: string) => void
}

export function AppDetail({ app, onBack, onUninstall }: AppDetailProps) {
  return (
    <div className={styles.detail}>
      {/* Back button: "All Apps" (UI-SPEC copywriting) */}
      <button className={styles.backBtn} onClick={onBack}>
        ← All Apps
      </button>

      {/* App info card */}
      <div className={styles.card}>
        <img
          src={app.icon}
          alt={app.name}
          className={styles.icon}
          width={72}
          height={72}
        />
        <div className={styles.meta}>
          <h2 className={styles.name}>{app.name}</h2>
          <p className={styles.version}>Version {app.version}</p>
          <p className={styles.description}>
            {/* Description placeholder — AppManifest has no description field in Phase 5 */}
            A Vidorra OS application.
          </p>
        </div>
      </div>

      {/* Uninstall button: destructive red (UI-SPEC color) */}
      <div className={styles.actions}>
        <button
          className={styles.uninstallBtn}
          onClick={() => onUninstall(app.id)}
        >
          Uninstall
        </button>
      </div>
    </div>
  )
}
