import type { KernelBusMessage, KernelBusResponse, KernelBusPush } from './types'

type PushHandler = (push: KernelBusPush) => void

interface PendingRequest {
  resolve: (result: unknown) => void
  reject: (err: Error) => void
  timer: ReturnType<typeof setTimeout>
}

export class KernelBusClient {
  private pending = new Map<string, PendingRequest>()
  private pushHandlers = new Set<PushHandler>()
  private idCounter = 0

  init(): void {
    window.addEventListener('message', this.handleMessage)
  }

  destroy(): void {
    window.removeEventListener('message', this.handleMessage)
    // Cancel all pending timers and reject outstanding requests
    for (const [, req] of this.pending) {
      clearTimeout(req.timer)
      req.reject(new Error('KernelBusClient destroyed'))
    }
    this.pending.clear()
    this.pushHandlers.clear()
  }

  sendReady(): void {
    window.parent.postMessage({ method: 'app.ready' }, '*')
  }

  send(method: string, params?: unknown): Promise<unknown> {
    return new Promise((resolve, reject) => {
      const requestId = this.generateId()
      const timer = setTimeout(() => {
        this.pending.delete(requestId)
        reject(new Error(`KernelBus timeout: ${method}`))
      }, 5000)

      this.pending.set(requestId, { resolve, reject, timer })

      const message: KernelBusMessage = { requestId, method, params }
      window.parent.postMessage(message, '*')
    })
  }

  onPush(handler: PushHandler): () => void {
    this.pushHandlers.add(handler)
    return () => this.pushHandlers.delete(handler)
  }

  private generateId(): string {
    // Use crypto.randomUUID if available, fall back to counter
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID()
    }
    return `req-${++this.idCounter}`
  }

  private handleMessage = (event: MessageEvent): void => {
    const data = event.data as KernelBusResponse & KernelBusPush

    if (!data || typeof data !== 'object') return

    // Push notification (no requestId, has type: 'push')
    if ((data as KernelBusPush).type === 'push') {
      for (const handler of this.pushHandlers) {
        handler(data as KernelBusPush)
      }
      return
    }

    // RPC response (has requestId)
    const { requestId, result, error } = data as KernelBusResponse
    if (!requestId) return

    const pending = this.pending.get(requestId)
    if (!pending) return

    clearTimeout(pending.timer)
    this.pending.delete(requestId)

    if (error !== undefined) {
      pending.reject(new Error(error))
    } else {
      pending.resolve(result)
    }
  }
}
