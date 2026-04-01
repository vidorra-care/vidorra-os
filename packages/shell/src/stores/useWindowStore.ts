import { create } from 'zustand'
import type { WindowDescriptor, WindowRect, WindowState } from '@vidorra/types'

export interface WindowStoreWindow extends WindowDescriptor {
  preMaximizeRect?: WindowRect
  minWidth?: number
  minHeight?: number
}

interface WindowStore {
  windows: WindowStoreWindow[]
  nextZIndex: number
  openWindow: (descriptor: Omit<WindowDescriptor, 'zIndex' | 'focused'> & { minWidth?: number; minHeight?: number }) => void
  closeWindow: (id: string) => void
  focusWindow: (id: string) => void
  unfocusAll: () => void
  setWindowState: (id: string, state: WindowState) => void
  setWindowRect: (id: string, rect: WindowRect) => void
  toggleMaximize: (id: string) => void
}

export const useWindowStore = create<WindowStore>((set, get) => ({
  windows: [],
  nextZIndex: 1,
  openWindow: (descriptor: Omit<WindowDescriptor, 'zIndex' | 'focused'> & { minWidth?: number; minHeight?: number }) => {
    const { nextZIndex, windows } = get()
    const offset = windows.filter((w) => w.state !== 'minimized').length * 20
    set((s) => ({
      windows: [
        ...s.windows.map((w) => ({ ...w, focused: false })),
        {
          ...descriptor,
          minWidth: descriptor.minWidth ?? 200,
          minHeight: descriptor.minHeight ?? 150,
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
  closeWindow: (id) => {
    set((s) => {
      const remaining = s.windows.filter((w) => w.id !== id)
      const wasClosedFocused = s.windows.find((w) => w.id === id)?.focused
      if (wasClosedFocused && remaining.length > 0) {
        const topmost = remaining.reduce((a, b) => (a.zIndex > b.zIndex ? a : b))
        return {
          windows: remaining.map((w) =>
            w.id === topmost.id ? { ...w, focused: true } : { ...w, focused: false }
          ),
        }
      }
      return { windows: remaining }
    })
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
  unfocusAll: () =>
    set((s) => ({
      windows: s.windows.map((w) => ({ ...w, focused: false })),
    })),
  setWindowState: (id, state) =>
    set((s) => ({
      windows: s.windows.map((w) => {
        if (w.id !== id) return w
        if (state === 'minimized') return { ...w, state, focused: false }
        if (state === 'maximized') return { ...w, state, preMaximizeRect: w.rect }
        if (state === 'normal' && w.preMaximizeRect)
          return { ...w, state, rect: w.preMaximizeRect, preMaximizeRect: undefined }
        return { ...w, state }
      }),
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
          rect: { x: 0, y: 0, width: window.innerWidth, height: window.innerHeight - 24 },
          preMaximizeRect: w.rect,
        }
      }),
    })),
}))
