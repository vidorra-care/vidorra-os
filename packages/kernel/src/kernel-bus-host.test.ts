// packages/kernel/src/kernel-bus-host.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { KernelBusHost } from './kernel-bus-host'
import type { KernelBusHostCallbacks } from './kernel-bus-host'

// vi.hoisted ensures these are initialized before vi.mock hoisting
const { mockSubscribe, mockGetResolvedMode } = vi.hoisted(() => {
  const mockSubscribe = vi.fn(() => vi.fn()) // returns unsubscribe fn
  const mockGetResolvedMode = vi.fn(() => 'light' as const)
  return { mockSubscribe, mockGetResolvedMode }
})

vi.mock('./theme-engine', () => ({
  themeEngine: { subscribe: mockSubscribe, getResolvedMode: mockGetResolvedMode },
}))

// Helper: create a fake WindowProxy with postMessage spy
function makeFakeWindow(): WindowProxy & { postMessage: ReturnType<typeof vi.fn> } {
  const proxy = {
    postMessage: vi.fn(),
  } as unknown as WindowProxy & { postMessage: ReturnType<typeof vi.fn> }
  return proxy
}

// Helper: dispatch a fake MessageEvent to the host's handler
function dispatchMessage(
  host: KernelBusHost,
  source: WindowProxy,
  data: unknown
): void {
  const event = new MessageEvent('message', { data, source: source as unknown as MessageEventSource })
  window.dispatchEvent(event)
}

describe('KernelBusHost', () => {
  let host: KernelBusHost
  let callbacks: KernelBusHostCallbacks

  beforeEach(() => {
    vi.clearAllMocks()

    callbacks = {
      setWindowTitle: vi.fn(),
      closeWindow: vi.fn(),
      setWindowMinimized: vi.fn(),
      toggleMaximize: vi.fn(),
      setWindowRect: vi.fn(),
      getWindowRect: vi.fn(() => ({ x: 10, y: 20, width: 400, height: 300 })),
      getResolvedTheme: vi.fn(() => 'light' as const),
    }

    host = new KernelBusHost()
    host.init(callbacks)
  })

  afterEach(() => {
    host.destroy()
  })

  // ─────────────────────────────────────────────────────────────────
  // Trust model (BUS-01)
  // ─────────────────────────────────────────────────────────────────

  describe('trust model', () => {
    it('drops message from unregistered contentWindow (no postMessage response)', () => {
      const unregisteredFrame = makeFakeWindow()

      dispatchMessage(host, unregisteredFrame, {
        requestId: 'req-1',
        method: 'theme.get',
      })

      expect(unregisteredFrame.postMessage).not.toHaveBeenCalled()
    })

    it('drops message sent before app.ready even if frame was registered', () => {
      const frame = makeFakeWindow()
      host.registerFrame('win-1', frame)

      // Send RPC without first sending app.ready
      dispatchMessage(host, frame, {
        requestId: 'req-1',
        method: 'theme.get',
      })

      expect(frame.postMessage).not.toHaveBeenCalled()
    })

    it('promotes frame to trusted after app.ready, subsequent messages are processed', () => {
      const frame = makeFakeWindow()
      host.registerFrame('win-1', frame)

      // Send app.ready to promote to trusted
      dispatchMessage(host, frame, { method: 'app.ready' })

      // Now send a real RPC
      dispatchMessage(host, frame, {
        requestId: 'req-1',
        method: 'theme.get',
      })

      expect(frame.postMessage).toHaveBeenCalledOnce()
      expect(frame.postMessage).toHaveBeenCalledWith(
        { requestId: 'req-1', result: 'light' },
        '*'
      )
    })

    it('unregisterFrame removes contentWindow; subsequent messages are dropped', () => {
      const frame = makeFakeWindow()
      host.registerFrame('win-1', frame)
      dispatchMessage(host, frame, { method: 'app.ready' })

      // Verify it was trusted first
      dispatchMessage(host, frame, { requestId: 'req-1', method: 'theme.get' })
      expect(frame.postMessage).toHaveBeenCalledOnce()
      frame.postMessage.mockClear()

      // Now unregister
      host.unregisterFrame('win-1')

      dispatchMessage(host, frame, { requestId: 'req-2', method: 'theme.get' })
      expect(frame.postMessage).not.toHaveBeenCalled()
    })
  })

  // ─────────────────────────────────────────────────────────────────
  // RPC dispatch (BUS-02, BUS-03)
  // ─────────────────────────────────────────────────────────────────

  describe('RPC dispatch', () => {
    let frame: WindowProxy & { postMessage: ReturnType<typeof vi.fn> }

    beforeEach(() => {
      frame = makeFakeWindow()
      host.registerFrame('win-1', frame)
      dispatchMessage(host, frame, { method: 'app.ready' })
      frame.postMessage.mockClear()
    })

    it('window.setTitle calls setWindowTitle callback and responds { requestId, result: undefined }', () => {
      dispatchMessage(host, frame, {
        requestId: 'req-setTitle',
        method: 'window.setTitle',
        params: { title: 'New Title' },
      })

      expect(callbacks.setWindowTitle).toHaveBeenCalledWith('win-1', 'New Title')
      expect(frame.postMessage).toHaveBeenCalledWith(
        { requestId: 'req-setTitle', result: undefined },
        '*'
      )
    })

    it('window.close calls closeWindow callback and responds { requestId, result: undefined }', () => {
      dispatchMessage(host, frame, {
        requestId: 'req-close',
        method: 'window.close',
      })

      expect(callbacks.closeWindow).toHaveBeenCalledWith('win-1')
      expect(frame.postMessage).toHaveBeenCalledWith(
        { requestId: 'req-close', result: undefined },
        '*'
      )
    })

    it('window.minimize calls setWindowMinimized callback and responds { requestId, result: undefined }', () => {
      dispatchMessage(host, frame, {
        requestId: 'req-min',
        method: 'window.minimize',
      })

      expect(callbacks.setWindowMinimized).toHaveBeenCalledWith('win-1')
      expect(frame.postMessage).toHaveBeenCalledWith(
        { requestId: 'req-min', result: undefined },
        '*'
      )
    })

    it('window.maximize calls toggleMaximize callback and responds { requestId, result: undefined }', () => {
      dispatchMessage(host, frame, {
        requestId: 'req-max',
        method: 'window.maximize',
      })

      expect(callbacks.toggleMaximize).toHaveBeenCalledWith('win-1')
      expect(frame.postMessage).toHaveBeenCalledWith(
        { requestId: 'req-max', result: undefined },
        '*'
      )
    })

    it('window.resize calls setWindowRect preserving current x/y and responds { requestId, result: undefined }', () => {
      ;(callbacks.getWindowRect as ReturnType<typeof vi.fn>).mockReturnValue({
        x: 10,
        y: 20,
        width: 400,
        height: 300,
      })

      dispatchMessage(host, frame, {
        requestId: 'req-resize',
        method: 'window.resize',
        params: { width: 800, height: 600 },
      })

      expect(callbacks.setWindowRect).toHaveBeenCalledWith('win-1', {
        x: 10,
        y: 20,
        width: 800,
        height: 600,
      })
      expect(frame.postMessage).toHaveBeenCalledWith(
        { requestId: 'req-resize', result: undefined },
        '*'
      )
    })

    it('window.resize uses default rect (0,0) when getWindowRect returns undefined', () => {
      ;(callbacks.getWindowRect as ReturnType<typeof vi.fn>).mockReturnValue(undefined)

      dispatchMessage(host, frame, {
        requestId: 'req-resize2',
        method: 'window.resize',
        params: { width: 500, height: 400 },
      })

      expect(callbacks.setWindowRect).toHaveBeenCalledWith('win-1', {
        x: 0,
        y: 0,
        width: 500,
        height: 400,
      })
    })

    it('theme.get responds { requestId, result: "light" } when mode is light', () => {
      ;(callbacks.getResolvedTheme as ReturnType<typeof vi.fn>).mockReturnValue('light')

      dispatchMessage(host, frame, {
        requestId: 'req-themeGet',
        method: 'theme.get',
      })

      expect(frame.postMessage).toHaveBeenCalledWith(
        { requestId: 'req-themeGet', result: 'light' },
        '*'
      )
    })

    it('theme.get responds { requestId, result: "dark" } when mode is dark', () => {
      ;(callbacks.getResolvedTheme as ReturnType<typeof vi.fn>).mockReturnValue('dark')

      dispatchMessage(host, frame, {
        requestId: 'req-themeGetDark',
        method: 'theme.get',
      })

      expect(frame.postMessage).toHaveBeenCalledWith(
        { requestId: 'req-themeGetDark', result: 'dark' },
        '*'
      )
    })

    it('unknown method responds { requestId, error: "Unknown method: <method>" }', () => {
      dispatchMessage(host, frame, {
        requestId: 'req-unknown',
        method: 'unknown.method',
      })

      expect(frame.postMessage).toHaveBeenCalledWith(
        { requestId: 'req-unknown', error: 'Unknown method: unknown.method' },
        '*'
      )
    })

    it('app.ready itself produces NO response postMessage call', () => {
      // Use a fresh frame to isolate app.ready response behavior
      const freshFrame = makeFakeWindow()
      host.registerFrame('win-fresh', freshFrame)

      dispatchMessage(host, freshFrame, { method: 'app.ready' })

      expect(freshFrame.postMessage).not.toHaveBeenCalled()
    })
  })

  // ─────────────────────────────────────────────────────────────────
  // Push notifications (BUS-02 extension)
  // ─────────────────────────────────────────────────────────────────

  describe('push notifications', () => {
    it('when themeEngine subscriber fires, all trusted iframes receive theme.changed push', () => {
      const frame1 = makeFakeWindow()
      const frame2 = makeFakeWindow()

      host.registerFrame('win-a', frame1)
      host.registerFrame('win-b', frame2)

      // Both frames call app.ready
      dispatchMessage(host, frame1, { method: 'app.ready' })
      dispatchMessage(host, frame2, { method: 'app.ready' })

      frame1.postMessage.mockClear()
      frame2.postMessage.mockClear()

      // Simulate themeEngine firing the subscriber
      expect(mockSubscribe).toHaveBeenCalled()
      const subscriberCb = mockSubscribe.mock.calls[0][0] as (mode: 'light' | 'dark') => void
      mockGetResolvedMode.mockReturnValue('dark')
      subscriberCb('dark')

      expect(frame1.postMessage).toHaveBeenCalledWith(
        { type: 'push', method: 'theme.changed', params: { mode: 'dark' } },
        '*'
      )
      expect(frame2.postMessage).toHaveBeenCalledWith(
        { type: 'push', method: 'theme.changed', params: { mode: 'dark' } },
        '*'
      )
    })

    it('iframe that has not called app.ready does NOT receive the theme push', () => {
      const trustedFrame = makeFakeWindow()
      const untrustedFrame = makeFakeWindow()

      host.registerFrame('win-trusted', trustedFrame)
      host.registerFrame('win-untrusted', untrustedFrame)

      // Only trustedFrame sends app.ready
      dispatchMessage(host, trustedFrame, { method: 'app.ready' })

      trustedFrame.postMessage.mockClear()
      untrustedFrame.postMessage.mockClear()

      // Fire theme subscriber
      const subscriberCb = mockSubscribe.mock.calls[0][0] as (mode: 'light' | 'dark') => void
      mockGetResolvedMode.mockReturnValue('light')
      subscriberCb('light')

      expect(trustedFrame.postMessage).toHaveBeenCalledOnce()
      expect(untrustedFrame.postMessage).not.toHaveBeenCalled()
    })
  })
})
