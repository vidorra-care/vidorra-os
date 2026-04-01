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

  openWindow: (descriptor: Omit<WindowDescriptor, 'zIndex' | 'focused'> & {
    minWidth?: number
    minHeight?: number
  }) => void
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
    set((state) => {
      const nonMinimizedCount = state.windows.filter(w => w.state !== 'minimized').length
      const offset = nonMinimizedCount * 20

      const newWindow: WindowStoreWindow = {
        ...descriptor,
        rect: {
          ...descriptor.rect,
          x: descriptor.rect.x + offset,
          y: descriptor.rect.y + offset,
        },
        zIndex: state.nextZIndex,
        focused: true,
        minWidth: descriptor.minWidth ?? 200,
        minHeight: descriptor.minHeight ?? 150,
      }

      return {
        windows: state.windows.map(w => ({ ...w, focused: false })).concat(newWindow),
        nextZIndex: state.nextZIndex + 1,
      }
    })
  },

  closeWindow: (id) => {
    set((state) => {
      const windowToClose = state.windows.find(w => w.id === id)
      const remainingWindows = state.windows.filter(w => w.id !== id)

      if (windowToClose?.focused && remainingWindows.length > 0) {
        // Focus the window with the highest zIndex
        const topWindow = remainingWindows.reduce((top, w) => w.zIndex > top.zIndex ? w : top)
        return {
          windows: remainingWindows.map(w => ({
            ...w,
            focused: w.id === topWindow.id,
          })),
        }
      }

      return { windows: remainingWindows }
    })
  },

  focusWindow: (id) => {
    set((state) => ({
      windows: state.windows.map(w => ({
        ...w,
        focused: w.id === id,
        zIndex: w.id === id ? state.nextZIndex : w.zIndex,
      })),
      nextZIndex: state.nextZIndex + 1,
    }))
  },

  setWindowState: (id, windowState) => {
    set((state) => {
      if (windowState === 'minimized') {
        const updatedWindows = state.windows.map(w =>
          w.id === id ? { ...w, state: windowState, focused: false } : w
        )
        // Focus the next highest zIndex non-minimized window
        const nonMinimized = updatedWindows.filter(w => w.id !== id && w.state !== 'minimized')
        if (nonMinimized.length > 0) {
          const topWindow = nonMinimized.reduce((top, w) => w.zIndex > top.zIndex ? w : top)
          return {
            windows: updatedWindows.map(w => ({
              ...w,
              focused: w.id === topWindow.id,
            })),
          }
        }
        return { windows: updatedWindows }
      }

      if (windowState === 'maximized') {
        return {
          windows: state.windows.map(w =>
            w.id === id
              ? { ...w, state: windowState, preMaximizeRect: { ...w.rect } }
              : w
          ),
        }
      }

      if (windowState === 'normal') {
        return {
          windows: state.windows.map(w => {
            if (w.id !== id) return w
            const restored: WindowStoreWindow = {
              ...w,
              state: windowState,
            }
            if (w.preMaximizeRect) {
              restored.rect = { ...w.preMaximizeRect }
              delete restored.preMaximizeRect
            }
            return restored
          }),
        }
      }

      return {}
    })
  },

  setWindowRect: (id, rect) => {
    set((state) => ({
      windows: state.windows.map(w =>
        w.id === id ? { ...w, rect: { ...rect } } : w
      ),
    }))
  },

  toggleMaximize: (id) => {
    const { windows, setWindowState } = get()
    const window = windows.find(w => w.id === id)
    if (!window) return

    if (window.state === 'maximized') {
      setWindowState(id, 'normal')
    } else {
      setWindowState(id, 'maximized')
    }
  },
}))
