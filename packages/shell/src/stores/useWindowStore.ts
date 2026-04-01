// packages/shell/src/stores/useWindowStore.ts
// STUB — full implementation comes in plan 02-01
// Satisfies the interface contract for App.tsx and App.test.tsx
import { create } from 'zustand'
import type { WindowDescriptor, WindowRect, WindowState } from '@vidorra/types'

interface OpenWindowParams {
  id: string
  appId: string
  title: string
  url: string
  icon: string
  rect: WindowRect
  state: WindowState
}

interface WindowStore {
  windows: WindowDescriptor[]
  openWindow: (params: OpenWindowParams) => void
  closeWindow: (id: string) => void
  focusWindow: (id: string) => void
  setWindowState: (id: string, state: WindowState) => void
  setWindowRect: (id: string, rect: WindowRect) => void
  toggleMaximize: (id: string) => void
}

let zCounter = 1

export const useWindowStore = create<WindowStore>((set, get) => ({
  windows: [],

  openWindow: (params) => {
    const win: WindowDescriptor = {
      ...params,
      focused: true,
      zIndex: zCounter++,
    }
    set((s) => ({
      windows: [...s.windows.map((w) => ({ ...w, focused: false })), win],
    }))
  },

  closeWindow: (id) => {
    set((s) => ({ windows: s.windows.filter((w) => w.id !== id) }))
  },

  focusWindow: (id) => {
    set((s) => ({
      windows: s.windows.map((w) =>
        w.id === id ? { ...w, focused: true, zIndex: zCounter++ } : { ...w, focused: false }
      ),
    }))
  },

  setWindowState: (id, state) => {
    set((s) => ({
      windows: s.windows.map((w) => (w.id === id ? { ...w, state } : w)),
    }))
  },

  setWindowRect: (id, rect) => {
    set((s) => ({
      windows: s.windows.map((w) => (w.id === id ? { ...w, rect } : w)),
    }))
  },

  toggleMaximize: (id) => {
    const win = get().windows.find((w) => w.id === id)
    if (!win) return
    const newState: WindowState = win.state === 'maximized' ? 'normal' : 'maximized'
    set((s) => ({
      windows: s.windows.map((w) => (w.id === id ? { ...w, state: newState } : w)),
    }))
  },
}))
