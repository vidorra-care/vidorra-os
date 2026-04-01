import { create } from 'zustand'
import type { WindowDescriptor, WindowRect, WindowState } from '@vidorra/types'

interface WindowStore {
  windows: WindowDescriptor[]
  nextZIndex: number
  openWindow: (descriptor: Omit<WindowDescriptor, 'zIndex' | 'focused'>) => void
  closeWindow: (id: string) => void
  focusWindow: (id: string) => void
  setWindowState: (id: string, state: WindowState) => void
  setWindowRect: (id: string, rect: WindowRect) => void
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
  closeWindow: (id) =>
    set((s) => ({ windows: s.windows.filter((w) => w.id !== id) })),
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
}))
