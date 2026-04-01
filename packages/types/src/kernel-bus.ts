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
