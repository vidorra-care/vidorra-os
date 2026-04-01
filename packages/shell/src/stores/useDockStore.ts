import { create } from 'zustand'

interface DockStore {
  iconPositions: Record<string, { x: number; y: number }>
  setIconPosition: (appId: string, pos: { x: number; y: number }) => void
}

export const useDockStore = create<DockStore>((set) => ({
  iconPositions: {},
  setIconPosition: (appId, pos) =>
    set((s) => ({ iconPositions: { ...s.iconPositions, [appId]: pos } })),
}))
