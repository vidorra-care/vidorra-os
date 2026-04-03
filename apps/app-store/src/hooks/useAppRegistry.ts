import { useState, useCallback } from 'react'
import { appRegistry } from '@vidorra/kernel'
import type { AppManifest } from '@vidorra/types'

export function useAppRegistry() {
  const [apps, setApps] = useState<AppManifest[]>(() => appRegistry.getAllApps())
  const [installing, setInstalling] = useState(false)
  const [installError, setInstallError] = useState<string | null>(null)

  const refresh = useCallback(() => {
    setApps(appRegistry.getAllApps())
  }, [])

  // Returns Promise<boolean> where true = error occurred, false = success.
  // Callers MUST use the return value to check success — do NOT read installError
  // after await, as the state update is async and the value will be stale.
  const install = useCallback(async (url: string): Promise<boolean> => {
    setInstalling(true)
    setInstallError(null)
    let hadError = false
    try {
      await appRegistry.install(url)
      refresh()
    } catch (err) {
      setInstallError(`Could not install: ${(err as Error).message}`)
      hadError = true
    } finally {
      setInstalling(false)
    }
    return hadError
  }, [refresh])

  const uninstall = useCallback(async (appId: string) => {
    await appRegistry.uninstall(appId)
    refresh()
    // appRegistry.persist() writes to localStorage['vidorra:registry']
    // → StorageEvent fires in Shell frame
    // → Dock.tsx storage listener (plan 01) re-reads getAllApps()
  }, [refresh])

  return { apps, installing, installError, install, uninstall, clearError: () => setInstallError(null) }
}
