// packages/kernel/src/app-registry.ts
import type { AppManifest } from '@vidorra/types'

const REQUIRED_FIELDS: (keyof AppManifest)[] = [
  'id',
  'name',
  'version',
  'entry',
  'icon',
  'category',
  'defaultSize',
]

export class AppRegistry {
  private apps = new Map<string, AppManifest>()
  private readonly STORAGE_KEY = 'vidorra:registry'

  constructor() {
    this.load()
  }

  async install(manifestUrl: string): Promise<void> {
    const response = await fetch(manifestUrl)
    if (!response.ok) {
      throw new Error(`Failed to fetch manifest: ${manifestUrl}`)
    }
    const data: unknown = await response.json()
    const manifest = this.validate(data)
    this.apps.set(manifest.id, manifest)
    this.persist()
  }

  async uninstall(appId: string): Promise<void> {
    this.apps.delete(appId)
    this.persist()
  }

  getApp(appId: string): AppManifest | undefined {
    return this.apps.get(appId)
  }

  getAllApps(): AppManifest[] {
    return Array.from(this.apps.values())
  }

  private validate(data: unknown): AppManifest {
    if (typeof data !== 'object' || data === null) {
      throw new Error('Invalid manifest: not an object')
    }
    const obj = data as Record<string, unknown>
    for (const field of REQUIRED_FIELDS) {
      if (obj[field] === undefined || obj[field] === null) {
        throw new Error(`Invalid manifest: missing ${field}`)
      }
    }
    return obj as unknown as AppManifest
  }

  private persist(): void {
    const record: Record<string, AppManifest> = {}
    for (const [id, manifest] of this.apps) {
      record[id] = manifest
    }
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(record))
  }

  private load(): void {
    const stored = localStorage.getItem(this.STORAGE_KEY)
    if (!stored) return
    try {
      const record = JSON.parse(stored) as Record<string, AppManifest>
      for (const [id, manifest] of Object.entries(record)) {
        this.apps.set(id, manifest)
      }
    } catch {
      // corrupted storage — start fresh
      localStorage.removeItem(this.STORAGE_KEY)
    }
  }
}

export const appRegistry = new AppRegistry()
