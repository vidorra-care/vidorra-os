import { create } from 'zustand'
import type { WindowDescriptor, WindowRect, WindowState } from '@vidorra/types'

interface WindowStoreWindow extends WindowDescriptor {
  preMaximizeRect?: WindowRect
  minWidth: number
  minHeight: number
}

interface WindowStore {
  windows: WindowStoreWindow[]
  nextZIndex: number

  openWindow: (
    descriptor: Omit<WindowDescriptor, 'zIndex' | 'focused'> & {
      minWidth?: number
      minHeight?: number
    }
  ) => void
  closeWindow: (id: string) => void
  focusWindow: (id: string) => void
  setWindowState: (id: string, state: WindowState) => void
  setWindowRect: (id: string, rect: WindowRect) => void
  toggleMaximize: (id: string) => void
}

export const useWindowStore = create<WindowStore>((set, get) => ({
  windows: [],
  nextZIndex: 1,

  openWindow: (descriptor) => {
    const { nextZIndex, windows } = get()
    const nonMinimizedCount = windows.filter((w) => w.state !== 'minimized').length
    const offset = nonMinimizedCount * 20

    const newWindow: WindowStoreWindow = {
      ...descriptor,
      rect: {
        ...descriptor.rect,
        x: descriptor.rect.x + offset,
        y: descriptor.rect.y + offset,
      },
      zIndex: nextZIndex,
      focused: true,
      minWidth: descriptor.minWidth ?? 200,
      minHeight: descriptor.minHeight ?? 150,
    }

    set((s) => ({
      windows: [
        ...s.windows.map((w) => ({ ...w, focused: false })),
        newWindow,
      ],
      nextZIndex: nextZIndex + 1,
    }))
  },

  closeWindow: (id) => {
    const { windows } = get()
    const closedWindow = windows.find((w) => w.id === id)
    const remaining = windows.filter((w) => w.id !== id)

    let updatedWindows = remaining
    if (closedWindow?.focused && remaining.length > 0) {
      // Focus the window with the highest zIndex among remaining
      const topWindow = remaining.reduce((prev, curr) =>
        curr.zIndex > prev.zIndex ? curr : prev
      )
      updatedWindows = remaining.map((w) => ({
        ...w,
        focused: w.id === topWindow.id,
      }))
    }

    set({ windows: updatedWindows })
  },

  focusWindow: (id) => {
    const { nextZIndex } = get()
    set((s) => ({
      windows: s.windows.map((w) =>
        w.id === id
          ? { ...w, focused: true, zIndex: nextZIndex }
          : { ...w, focused: false }
      ),
      nextZIndex: nextZIndex + 1,
    }))
  },

  setWindowState: (id, state) => {
    const { windows, nextZIndex } = get()
    const targetWindow = windows.find((w) => w.id === id)
    if (!targetWindow) return

    if (state === 'maximized') {
      set((s) => ({
        windows: s.windows.map((w) =>
          w.id === id
            ? { ...w, state: 'maximized', preMaximizeRect: w.rect }
            : w
        ),
      }))
    } else if (state === 'normal') {
      set((s) => ({
        windows: s.windows.map((w) => {
          if (w.id !== id) return w
          const restoredRect = w.preMaximizeRect ?? w.rect
          return {
            ...w,
            state: 'normal',
            rect: restoredRect,
            preMaximizeRect: undefined,
          }
        }),
      }))
    } else if (state === 'minimized') {
      // When minimizing, unfocus and focus the next topmost window
      const remaining = windows.filter((w) => w.id !== id && w.state !== 'minimized')
      let nextFocusId: string | null = null
      if (targetWindow.focused && remaining.length > 0) {
        const topWindow = remaining.reduce((prev, curr) =>
          curr.zIndex > prev.zIndex ? curr : prev
        )
        nextFocusId = topWindow.id
      }

      set((s) => ({
        windows: s.windows.map((w) => {
          if (w.id === id) return { ...w, state: 'minimized', focused: false }
          if (nextFocusId && w.id === nextFocusId) {
            return { ...w, focused: true, zIndex: nextZIndex }
          }
          return w
        }),
        nextZIndex: nextFocusId ? nextZIndex + 1 : nextZIndex,
      }))
    }
  },

  setWindowRect: (id, rect) => {
    set((s) => ({
      windows: s.windows.map((w) => (w.id === id ? { ...w, rect } : w)),
    }))
  },

  toggleMaximize: (id) => {
    const { windows, setWindowState } = get()
    const win = windows.find((w) => w.id === id)
    if (!win) return

    if (win.state === 'maximized') {
      setWindowState(id, 'normal')
    } else {
      setWindowState(id, 'maximized')
    }
  },
}))
