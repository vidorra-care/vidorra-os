// packages/bus/src/client.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { KernelBusClient } from './client'

describe('KernelBusClient', () => {
  let client: KernelBusClient
  let mockPostMessage: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.useFakeTimers()
    mockPostMessage = vi.fn()
    // In happy-dom, window.parent is window itself; mock postMessage
    Object.defineProperty(window, 'parent', {
      value: { postMessage: mockPostMessage },
      writable: true,
      configurable: true,
    })
    client = new KernelBusClient()
    client.init()
  })

  afterEach(() => {
    client.destroy()
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  // Helper to fire a synthetic message event
  function fireMessage(data: unknown) {
    window.dispatchEvent(new MessageEvent('message', { data }))
  }

  describe('send() — core RPC (BUS-03)', () => {
    it('calls window.parent.postMessage with { requestId, method, params }', async () => {
      const promise = client.send('window.setTitle', { title: 'Test' })

      expect(mockPostMessage).toHaveBeenCalledTimes(1)
      const [message] = mockPostMessage.mock.calls[0]
      expect(message).toMatchObject({
        method: 'window.setTitle',
        params: { title: 'Test' },
      })
      expect(typeof message.requestId).toBe('string')
      expect(message.requestId.length).toBeGreaterThan(0)

      // Resolve to avoid unhandled rejection
      fireMessage({ requestId: message.requestId, result: undefined })
      await promise
    })

    it('requestId is a non-empty string', async () => {
      const promise = client.send('window.close')

      const [message] = mockPostMessage.mock.calls[0]
      expect(typeof message.requestId).toBe('string')
      expect(message.requestId).not.toBe('')

      fireMessage({ requestId: message.requestId, result: undefined })
      await promise
    })

    it('resolves Promise with result value when matching requestId arrives', async () => {
      const promise = client.send('theme.get')

      const [message] = mockPostMessage.mock.calls[0]
      fireMessage({ requestId: message.requestId, result: 'dark' })

      const result = await promise
      expect(result).toBe('dark')
    })

    it('rejects Promise with Error(error) when response has error field', async () => {
      const promise = client.send('unknown.method')

      const [message] = mockPostMessage.mock.calls[0]
      fireMessage({ requestId: message.requestId, error: 'Unknown method: unknown.method' })

      await expect(promise).rejects.toThrow('Unknown method: unknown.method')
    })

    it('does NOT resolve/reject pending requests when requestId does not match', async () => {
      const promise = client.send('window.setTitle', { title: 'Hello' })
      const [message] = mockPostMessage.mock.calls[0]

      // Fire response with different requestId — should NOT resolve our promise
      fireMessage({ requestId: 'wrong-id-00000', result: 'irrelevant' })

      // Advance time slightly but not enough for timeout
      vi.advanceTimersByTime(100)

      // Promise should still be pending — verify by racing against resolved flag
      let resolved = false
      promise.then(() => { resolved = true }).catch(() => {})

      await Promise.resolve() // flush microtasks
      expect(resolved).toBe(false)

      // Clean up: resolve with correct id
      fireMessage({ requestId: message.requestId, result: undefined })
      await promise
    })
  })

  describe('timeout (BUS-04)', () => {
    it('rejects with Error("KernelBus timeout: <method>") after 5000ms', async () => {
      const promise = client.send('window.setTitle', { title: 'Will Timeout' })

      vi.advanceTimersByTime(5001)

      await expect(promise).rejects.toThrow('KernelBus timeout: window.setTitle')
    })

    it('does NOT reject before 5000ms have elapsed', async () => {
      const promise = client.send('window.close')

      vi.advanceTimersByTime(4999)

      let rejected = false
      promise.catch(() => { rejected = true })

      await Promise.resolve() // flush microtasks
      expect(rejected).toBe(false)

      // Resolve so no unhandled rejection
      const [message] = mockPostMessage.mock.calls[0]
      fireMessage({ requestId: message.requestId, result: undefined })
      await promise
    })

    it('resolved request clears its timeout (no spurious rejection after resolution)', async () => {
      const promise = client.send('theme.get')
      const [message] = mockPostMessage.mock.calls[0]

      // Resolve before timeout
      fireMessage({ requestId: message.requestId, result: 'light' })
      await promise

      // Advance past timeout — should NOT cause unhandled rejection
      let rejectedAfter = false
      vi.advanceTimersByTime(6000)
      promise.catch(() => { rejectedAfter = true })

      await Promise.resolve()
      expect(rejectedAfter).toBe(false)
    })
  })

  describe('sendReady()', () => {
    it('calls window.parent.postMessage with { method: "app.ready" } and no requestId', () => {
      client.sendReady()

      expect(mockPostMessage).toHaveBeenCalledTimes(1)
      const [message] = mockPostMessage.mock.calls[0]
      expect(message).toEqual({ method: 'app.ready' })
      expect(message.requestId).toBeUndefined()
    })
  })

  describe('concurrent requests', () => {
    it('two concurrent sends each resolve independently', async () => {
      const promise1 = client.send('theme.get')
      const promise2 = client.send('window.setTitle', { title: 'Hello' })

      const [msg1] = mockPostMessage.mock.calls[0]
      const [msg2] = mockPostMessage.mock.calls[1]

      // Resolve in reverse order
      fireMessage({ requestId: msg2.requestId, result: 'title-set' })
      fireMessage({ requestId: msg1.requestId, result: 'dark' })

      const [result1, result2] = await Promise.all([promise1, promise2])
      expect(result1).toBe('dark')
      expect(result2).toBe('title-set')
    })
  })

  describe('push notification listener', () => {
    it('onPush callback is called when a message with type: "push" arrives', () => {
      const pushHandler = vi.fn()
      client.onPush(pushHandler)

      fireMessage({ type: 'push', method: 'theme.changed', params: { mode: 'dark' } })

      expect(pushHandler).toHaveBeenCalledWith({
        type: 'push',
        method: 'theme.changed',
        params: { mode: 'dark' },
      })
    })

    it('push messages do NOT interfere with pending RPC request resolution', async () => {
      const promise = client.send('theme.get')
      const [message] = mockPostMessage.mock.calls[0]

      // Fire a push first
      fireMessage({ type: 'push', method: 'theme.changed', params: { mode: 'dark' } })

      // Then the RPC response
      fireMessage({ requestId: message.requestId, result: 'light' })

      const result = await promise
      expect(result).toBe('light')
    })

    it('onPush returns an unsubscribe function that stops calling the handler', () => {
      const pushHandler = vi.fn()
      const unsubscribe = client.onPush(pushHandler)

      unsubscribe()
      fireMessage({ type: 'push', method: 'theme.changed', params: { mode: 'dark' } })

      expect(pushHandler).not.toHaveBeenCalled()
    })
  })
})
