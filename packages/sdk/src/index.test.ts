import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock @vidorra/bus BEFORE importing createApp
const mockSend = vi.fn().mockResolvedValue(undefined)
const mockSendReady = vi.fn()
const mockInit = vi.fn()
const mockOnPush = vi.fn().mockReturnValue(() => {})
const mockClientInstance = {
  init: mockInit,
  sendReady: mockSendReady,
  send: mockSend,
  onPush: mockOnPush,
}

vi.mock('@vidorra/bus', () => ({
  KernelBusClient: vi.fn(() => mockClientInstance),
}))

import { createApp } from './index'

describe('createApp()', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSend.mockResolvedValue(undefined)
    mockOnPush.mockReturnValue(() => {})
  })

  it('calls client.init() on creation', () => {
    createApp()
    expect(mockInit).toHaveBeenCalledTimes(1)
  })

  describe('app.ready()', () => {
    it('calls client.sendReady()', async () => {
      const app = createApp()
      await app.ready()
      expect(mockSendReady).toHaveBeenCalledTimes(1)
    })

    it('returns Promise<void> that resolves immediately', async () => {
      const app = createApp()
      await expect(app.ready()).resolves.toBeUndefined()
    })
  })

  describe('app.window.setTitle()', () => {
    it('calls client.send with method "window.setTitle" and { title } param', async () => {
      const app = createApp()
      await app.window.setTitle('My App')
      expect(mockSend).toHaveBeenCalledWith('window.setTitle', { title: 'My App' })
    })
  })

  describe('app.window.close()', () => {
    it('calls client.send with method "window.close" and no params', async () => {
      const app = createApp()
      await app.window.close()
      expect(mockSend).toHaveBeenCalledWith('window.close')
    })
  })

  describe('app.window.minimize()', () => {
    it('calls client.send with method "window.minimize" and no params', async () => {
      const app = createApp()
      await app.window.minimize()
      expect(mockSend).toHaveBeenCalledWith('window.minimize')
    })
  })

  describe('app.window.maximize()', () => {
    it('calls client.send with method "window.maximize" and no params', async () => {
      const app = createApp()
      await app.window.maximize()
      expect(mockSend).toHaveBeenCalledWith('window.maximize')
    })
  })

  describe('app.window.resize()', () => {
    it('calls client.send with method "window.resize" and { width, height }', async () => {
      const app = createApp()
      await app.window.resize(800, 600)
      expect(mockSend).toHaveBeenCalledWith('window.resize', { width: 800, height: 600 })
    })
  })

  describe('app.theme.get()', () => {
    it('calls client.send with method "theme.get"', async () => {
      mockSend.mockResolvedValueOnce('dark')
      const app = createApp()
      const result = await app.theme.get()
      expect(mockSend).toHaveBeenCalledWith('theme.get')
      expect(result).toBe('dark')
    })
  })

  describe('app.theme.onChange()', () => {
    it('calls client.onPush() and registers a handler', () => {
      const app = createApp()
      const cb = vi.fn()
      app.theme.onChange(cb)
      expect(mockOnPush).toHaveBeenCalledTimes(1)
    })

    it('the registered handler calls cb when push.method === "theme.changed"', () => {
      const app = createApp()
      const cb = vi.fn()
      app.theme.onChange(cb)

      // Extract the handler passed to onPush and invoke it
      const pushHandler = mockOnPush.mock.calls[0][0]
      pushHandler({ type: 'push', method: 'theme.changed', params: { mode: 'dark' } })

      expect(cb).toHaveBeenCalledWith('dark')
    })

    it('the registered handler does NOT call cb for other push methods', () => {
      const app = createApp()
      const cb = vi.fn()
      app.theme.onChange(cb)

      const pushHandler = mockOnPush.mock.calls[0][0]
      pushHandler({ type: 'push', method: 'some.other.push', params: {} })

      expect(cb).not.toHaveBeenCalled()
    })

    it('returns the unsubscribe function from client.onPush()', () => {
      const mockUnsub = vi.fn()
      mockOnPush.mockReturnValueOnce(mockUnsub)

      const app = createApp()
      const unsub = app.theme.onChange(vi.fn())
      expect(unsub).toBe(mockUnsub)
    })
  })
})
