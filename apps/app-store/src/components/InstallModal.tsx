import { useState } from 'react'
import styles from './InstallModal.module.css'

interface InstallModalProps {
  installing: boolean
  error: string | null
  onInstall: (url: string) => Promise<void>
  onClose: () => void
}

export function InstallModal({ installing, error, onInstall, onClose }: InstallModalProps) {
  const [url, setUrl] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!url.trim()) return
    await onInstall(url.trim())
  }

  return (
    // Overlay: fixed, full-screen, backdrop (CSS position:fixed — NOT showModal() per Pitfall #1)
    <div
      className={styles.overlay}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      role="dialog"
      aria-modal="true"
      aria-label="Install App"
    >
      <div className={styles.modal}>
        <h2 className={styles.title}>Install App</h2>

        <form onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="manifest-url">
              Manifest URL
            </label>
            <input
              id="manifest-url"
              type="url"
              className={styles.input}
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/app/manifest.json"
              disabled={installing}
              autoFocus
            />
            {error && (
              <p className={styles.error} role="alert">
                {error}
              </p>
            )}
          </div>

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={onClose}
              disabled={installing}
            >
              Don't Install
            </button>
            <button
              type="submit"
              className={styles.installBtn}
              disabled={installing || !url.trim()}
            >
              {installing ? 'Installing...' : 'Install'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
