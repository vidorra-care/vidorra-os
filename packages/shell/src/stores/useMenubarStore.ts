import { create } from 'zustand'

interface MenubarStore {
  activeMenu: string
  setActiveMenu: (id: string) => void
  closeMenu: () => void
}

export const useMenubarStore = create<MenubarStore>((set) => ({
  activeMenu: '',
  setActiveMenu: (id) => set({ activeMenu: id }),
  closeMenu: () => set({ activeMenu: '' }),
}))
