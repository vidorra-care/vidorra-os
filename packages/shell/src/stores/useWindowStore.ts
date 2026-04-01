import { create } from 'zustand'
import type { WindowDescriptor, WindowRect, WindowState } from '@vidorra/types'

export interface WindowStoreWindow extends WindowDescriptor {
  preMaximizeRect?: WindowRect
  minWidth: number
  minHeight: number
}

interface WindowStore {
  windows: WindowStoreWindow[]
  nextZIndex: number
  openWindow: (descriptor: Omit<WindowStoreWindow, 'zIndex' | 'focused'>) => void
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
    const offset = windows.filter((w) => w.state !== 'minimized').length * 20
    set((s) => ({
      windows: [
        ...s.windows,
        {
          ...descriptor,
          rect: {
            ...descriptor.rect,
            x: descriptor.rect.x + offset,
            y: descriptor.rect.y + offset,
          },
          zIndex: nextZIndex,
          focused: true,
        },
      ],
      nextZIndex: nextZIndex + 1,
    }))
  },
  closeWindow: (id) => set((s) => ({ windows: s.windows.filter((w) => w.id !== id) })),
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
  setWindowState: (id, state) =>
    set((s) => ({
      windows: s.windows.map((w) => (w.id === id ? { ...w, state } : w)),
    })),
  setWindowRect: (id, rect) =>
    set((s) => ({
      windows: s.windows.map((w) => (w.id === id ? { ...w, rect } : w)),
    })),
  toggleMaximize: (id) =>
    set((s) => ({
      windows: s.windows.map((w) => {
        if (w.id !== id) return w
        if (w.state === 'maximized') {
          return {
            ...w,
            state: 'normal' as WindowState,
            rect: w.preMaximizeRect ?? w.rect,
            preMaximizeRect: undefined,
          }
        }
        return {
          ...w,
          state: 'maximized' as WindowState,
          preMaximizeRect: w.rect,
        }
      }),
    })),
}))
