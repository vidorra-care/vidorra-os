import { KernelBusClient } from '@vidorra/bus'
import type { KernelBusPush } from '@vidorra/bus'

/** Vidorra OS window control API. */
export interface VidorraWindow {
  /** Update the window title bar text. */
  setTitle(title: string): Promise<void>
  /** Close this application window. */
  close(): Promise<void>
  /** Minimize this window to the Dock. */
  minimize(): Promise<void>
  /** Toggle maximize state for this window. */
  maximize(): Promise<void>
  /** Resize the window to the given dimensions (pixels). */
  resize(width: number, height: number): Promise<void>
}

/** Vidorra OS theme API. */
export interface VidorraTheme {
  /** Get the current resolved theme mode ('light' or 'dark'). */
  get(): Promise<'light' | 'dark'>
  /**
   * Subscribe to theme changes pushed by the Shell.
   * @returns Unsubscribe function — call it to stop receiving updates.
   */
  onChange(cb: (mode: 'light' | 'dark') => void): () => void
}

/** The Vidorra OS application API returned by createApp(). */
export interface VidorraApp {
  /**
   * Signal to the Shell that this app is ready to receive messages.
   * Must be called once on startup — marks the iframe as trusted.
   * Returns Promise<void> immediately after sending the signal.
   */
  ready(): Promise<void>
  /** Window control methods. */
  window: VidorraWindow
  /** Theme query and subscription methods. */
  theme: VidorraTheme
}

/**
 * Create a Vidorra OS app instance.
 * Call once per app context. Initialises the KernelBus communication channel.
 *
 * @example
 * ```typescript
 * import { createApp } from '@vidorra/sdk'
 * const app = createApp()
 * await app.ready()
 * await app.window.setTitle('My App')
 * ```
 */
export function createApp(): VidorraApp {
  const client = new KernelBusClient()
  client.init()

  const window_: VidorraWindow = {
    setTitle: (title: string): Promise<void> =>
      client.send('window.setTitle', { title }) as Promise<void>,
    close: (): Promise<void> =>
      client.send('window.close') as Promise<void>,
    minimize: (): Promise<void> =>
      client.send('window.minimize') as Promise<void>,
    maximize: (): Promise<void> =>
      client.send('window.maximize') as Promise<void>,
    resize: (width: number, height: number): Promise<void> =>
      client.send('window.resize', { width, height }) as Promise<void>,
  }

  const theme_: VidorraTheme = {
    get: (): Promise<'light' | 'dark'> =>
      client.send('theme.get') as Promise<'light' | 'dark'>,
    onChange: (cb: (mode: 'light' | 'dark') => void): (() => void) =>
      client.onPush((push: KernelBusPush): void => {
        if (push.method === 'theme.changed') {
          const params = push.params as { mode: 'light' | 'dark' }
          cb(params.mode)
        }
      }),
  }

  return {
    ready: (): Promise<void> => {
      client.sendReady()
      return Promise.resolve()
    },
    window: window_,
    theme: theme_,
  }
}
