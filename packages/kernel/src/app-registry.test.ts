// packages/kernel/src/app-registry.test.ts
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AppRegistry } from './app-registry'

describe('AppRegistry', () => {
  let registry: AppRegistry

  beforeEach(() => {
    localStorage.clear()
    registry = new AppRegistry()
  })

  describe('install', () => {
    it('fetches manifest and stores it', async () => {
      const manifest = {
        id: 'com.test.app',
        name: 'Test App',
        version: '1.0.0',
        entry: 'http://localhost:3001',
        icon: './icon.svg',
        category: 'utility',
        defaultSize: { width: 400, height: 300 },
      }

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => manifest,
      } as Response)

      await registry.install('http://localhost:3001/manifest.json')

      expect(registry.getApp('com.test.app')).toEqual(manifest)
    })

    it('persists manifest to localStorage', async () => {
      const manifest = {
        id: 'com.test.app',
        name: 'Test App',
        version: '1.0.0',
        entry: 'http://localhost:3001',
        icon: './icon.svg',
        category: 'utility',
        defaultSize: { width: 400, height: 300 },
      }

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => manifest,
      } as Response)

      await registry.install('http://localhost:3001/manifest.json')

      const stored = localStorage.getItem('vidorra:registry')
      expect(stored).not.toBeNull()
      const parsed = JSON.parse(stored!)
      expect(parsed['com.test.app']).toEqual(manifest)
    })

    it('overwrites existing app with same id (silent update)', async () => {
      const manifest = {
        id: 'com.test.app',
        name: 'Test App',
        version: '1.0.0',
        entry: 'http://localhost:3001',
        icon: './icon.svg',
        category: 'utility',
        defaultSize: { width: 400, height: 300 },
      }
      const updated = { ...manifest, version: '2.0.0' }

      global.fetch = vi.fn()
        .mockResolvedValueOnce({ ok: true, json: async () => manifest } as Response)
        .mockResolvedValueOnce({ ok: true, json: async () => updated } as Response)

      await registry.install('http://localhost:3001/manifest.json')
      await registry.install('http://localhost:3001/manifest.json')

      expect(registry.getApp('com.test.app')?.version).toBe('2.0.0')
      expect(registry.getAllApps()).toHaveLength(1)
    })

    it('throws when fetch fails', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
      } as Response)

      await expect(
        registry.install('http://localhost:3001/manifest.json'),
      ).rejects.toThrow('Failed to fetch manifest: http://localhost:3001/manifest.json')
    })

    it('throws when manifest is missing required field', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ id: 'com.test.app' }), // missing name, version, etc.
      } as Response)

      await expect(
        registry.install('http://localhost:3001/manifest.json'),
      ).rejects.toThrow('Invalid manifest: missing name')
    })

    it('throws when defaultSize is not an object with width and height', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          id: 'com.test.app',
          name: 'Test App',
          version: '1.0.0',
          entry: 'http://localhost:3001',
          icon: './icon.svg',
          category: 'utility',
          defaultSize: 'invalid',
        }),
      } as Response)

      await expect(
        registry.install('http://localhost:3001/manifest.json'),
      ).rejects.toThrow('Invalid manifest: defaultSize must have numeric width and height')
    })
  })

  describe('uninstall', () => {
    it('removes an installed app', async () => {
      const manifest = {
        id: 'com.test.app',
        name: 'Test App',
        version: '1.0.0',
        entry: 'http://localhost:3001',
        icon: './icon.svg',
        category: 'utility',
        defaultSize: { width: 400, height: 300 },
      }

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => manifest,
      } as Response)

      await registry.install('http://localhost:3001/manifest.json')
      await registry.uninstall('com.test.app')

      expect(registry.getApp('com.test.app')).toBeUndefined()
      expect(registry.getAllApps()).toHaveLength(0)
    })

    it('removes app from localStorage on uninstall', async () => {
      const manifest = {
        id: 'com.test.app',
        name: 'Test App',
        version: '1.0.0',
        entry: 'http://localhost:3001',
        icon: './icon.svg',
        category: 'utility',
        defaultSize: { width: 400, height: 300 },
      }

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => manifest,
      } as Response)

      await registry.install('http://localhost:3001/manifest.json')
      await registry.uninstall('com.test.app')

      const stored = localStorage.getItem('vidorra:registry')
      const parsed = JSON.parse(stored!)
      expect(parsed['com.test.app']).toBeUndefined()
    })

    it('silently ignores uninstalling non-existent app', async () => {
      await expect(registry.uninstall('com.nonexistent')).resolves.toBeUndefined()
    })
  })

  describe('persistence', () => {
    it('restores apps from localStorage on construction', async () => {
      const manifest = {
        id: 'com.test.app',
        name: 'Test App',
        version: '1.0.0',
        entry: 'http://localhost:3001',
        icon: './icon.svg',
        category: 'utility',
        defaultSize: { width: 400, height: 300 },
      }

      localStorage.setItem(
        'vidorra:registry',
        JSON.stringify({ 'com.test.app': manifest }),
      )

      const freshRegistry = new AppRegistry()
      expect(freshRegistry.getApp('com.test.app')).toEqual(manifest)
    })
  })

  describe('getAllApps', () => {
    it('returns empty array when no apps installed', () => {
      expect(registry.getAllApps()).toEqual([])
    })
  })
})
