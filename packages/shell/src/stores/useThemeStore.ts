import { create } from 'zustand'
import { themeEngine } from '@vidorra/kernel'

type Theme = 'light' | 'dark'

const STORAGE_KEY = 'vidorra:theme'

function getInitialTheme(): Theme {
  const stored = localStorage.getItem(STORAGE_KEY) as Theme | null
  if (stored === 'light' || stored === 'dark') return stored
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function applyTheme(theme: Theme) {
  document.body.classList.toggle('dark', theme === 'dark')
  themeEngine.setMode(theme === 'dark' ? 'dark' : 'light')
  localStorage.setItem(STORAGE_KEY, theme)
}

interface ThemeStore {
  theme: Theme
  setTheme: (t: Theme) => void
  toggleTheme: () => void
}

export const useThemeStore = create<ThemeStore>((set, get) => ({
  theme: getInitialTheme(),
  setTheme: (t) => {
    applyTheme(t)
    set({ theme: t })
  },
  toggleTheme: () => {
    const next: Theme = get().theme === 'light' ? 'dark' : 'light'
    applyTheme(next)
    set({ theme: next })
  },
}))
