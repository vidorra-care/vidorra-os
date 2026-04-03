export interface KernelBusMessage {
  requestId: string
  method: string
  params?: unknown
}

export interface KernelBusResponse {
  requestId: string
  result?: unknown
  error?: string
}

/**
 * Push notification sent by KernelBusHost to all trusted iframes.
 * Distinguished from RPC responses by the absence of requestId.
 * type: 'push' — always present on push messages
 */
export interface KernelBusPush {
  type: 'push'
  method: string
  params?: unknown
}
