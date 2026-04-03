// packages/kernel/src/kernel-bus-host.ts
import type { KernelBusMessage, KernelBusResponse, KernelBusPush } from '@vidorra/bus'
import { themeEngine } from './theme-engine'
import type { ThemeMode } from './theme-engine'

export interface KernelBusHostCallbacks {
  setWindowTitle: (windowId: string, title: string) => void
  closeWindow: (windowId: string) => void
  setWindowMinimized: (windowId: string) => void
  toggleMaximize: (windowId: string) => void
  setWindowRect: (
    windowId: string,
    rect: { x: number; y: number; width: number; height: number }
  ) => void
  getWindowRect: (
    windowId: string
  ) => { x: number; y: number; width: number; height: number } | undefined
  getResolvedTheme: () => 'light' | 'dark'
}

export class KernelBusHost {
  /** Map from trusted contentWindow -> windowId */
  private trustedFrames = new Map<WindowProxy, string>()

  /** Map from pending (registered but not yet app.ready) contentWindow -> windowId */
  private pendingFrames = new Map<WindowProxy, string>()

  private callbacks: KernelBusHostCallbacks | null = null
  private unsubscribeTheme: (() => void) | null = null

  init(callbacks: KernelBusHostCallbacks): void {
    this.callbacks = callbacks
    window.addEventListener('message', this.handleMessage)
    this.unsubscribeTheme = themeEngine.subscribe((mode: ThemeMode) => {
      const resolved = themeEngine.getResolvedMode()
      const push: KernelBusPush = {
        type: 'push',
        method: 'theme.changed',
        params: { mode: resolved },
      }
      for (const [frame] of this.trustedFrames) {
        frame.postMessage(push, '*')
      }
    })
  }

  destroy(): void {
    window.removeEventListener('message', this.handleMessage)
    this.unsubscribeTheme?.()
    this.unsubscribeTheme = null
    this.trustedFrames.clear()
    this.pendingFrames.clear()
    this.callbacks = null
  }

  /**
   * Register an iframe's contentWindow with its windowId.
   * The frame is pending (untrusted) until it sends app.ready.
   */
  registerFrame(windowId: string, contentWindow: WindowProxy): void {
    this.pendingFrames.set(contentWindow, windowId)
  }

  /**
   * Remove a frame from both trusted and pending maps.
   * Called when the window is closed.
   */
  unregisterFrame(windowId: string): void {
    for (const [frame, id] of this.trustedFrames) {
      if (id === windowId) {
        this.trustedFrames.delete(frame)
        break
      }
    }
    for (const [frame, id] of this.pendingFrames) {
      if (id === windowId) {
        this.pendingFrames.delete(frame)
        break
      }
    }
  }

  private handleMessage = (event: MessageEvent): void => {
    const data = event.data as (KernelBusMessage & { method?: string }) | null
    if (!data || typeof data !== 'object') return

    const source = event.source as WindowProxy | null
    if (!source) return

    // app.ready: one-way signal to promote pending -> trusted (D-01, D-12)
    if (data.method === 'app.ready') {
      const windowId = this.pendingFrames.get(source)
      if (windowId !== undefined) {
        this.trustedFrames.set(source, windowId)
        this.pendingFrames.delete(source)
      }
      return // no response for app.ready (D-12)
    }

    // All other methods: must be trusted (D-10)
    if (!this.trustedFrames.has(source)) return // silently drop

    const { requestId, method, params } = data as KernelBusMessage
    if (!requestId) return // malformed — silently drop

    const windowId = this.trustedFrames.get(source)!
    this.dispatch(source, requestId, method, params, windowId)
  }

  private dispatch(
    source: WindowProxy,
    requestId: string,
    method: string,
    params: unknown,
    windowId: string
  ): void {
    const cb = this.callbacks!
    try {
      switch (method) {
        case 'window.setTitle': {
          const { title } = params as { title: string }
          cb.setWindowTitle(windowId, title)
          this.respond(source, { requestId, result: undefined })
          break
        }
        case 'window.close': {
          cb.closeWindow(windowId)
          this.respond(source, { requestId, result: undefined })
          break
        }
        case 'window.minimize': {
          cb.setWindowMinimized(windowId)
          this.respond(source, { requestId, result: undefined })
          break
        }
        case 'window.maximize': {
          cb.toggleMaximize(windowId)
          this.respond(source, { requestId, result: undefined })
          break
        }
        case 'window.resize': {
          const { width, height } = params as { width: number; height: number }
          const currentRect = cb.getWindowRect(windowId) ?? { x: 0, y: 0, width: 400, height: 300 }
          cb.setWindowRect(windowId, { ...currentRect, width, height })
          this.respond(source, { requestId, result: undefined })
          break
        }
        case 'theme.get': {
          const mode = cb.getResolvedTheme()
          this.respond(source, { requestId, result: mode })
          break
        }
        default:
          // Unknown method (D-11)
          this.respond(source, { requestId, error: `Unknown method: ${method}` })
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      this.respond(source, { requestId, error: message })
    }
  }

  private respond(source: WindowProxy, response: KernelBusResponse): void {
    source.postMessage(response, '*')
  }
}

export const kernelBusHost = new KernelBusHost()
