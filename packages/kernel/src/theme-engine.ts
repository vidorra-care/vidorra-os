// packages/kernel/src/theme-engine.ts

export type ThemeMode = 'light' | 'dark' | 'auto'

const THEMES = {
  light: {
    '--color-bg': '#ffffff',
    '--color-surface': '#f5f5f5',
    '--color-text': '#1a1a1a',
    '--color-accent': '#0066cc',
    '--color-border': '#e0e0e0',
  },
  dark: {
    '--color-bg': '#1e1e2e',
    '--color-surface': '#313244',
    '--color-text': '#cdd6f4',
    '--color-accent': '#89b4fa',
    '--color-border': '#45475a',
  },
} as const

export class ThemeEngine {
  private mode: ThemeMode = 'light'
  private subscribers = new Set<(mode: ThemeMode) => void>()
  private mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
  private readonly STORAGE_KEY = 'vidorra:theme'

  constructor() {
    this.load()
    this.mediaQuery.addEventListener('change', this.onSystemChange)
    this.applyTheme()
  }

  setMode(mode: ThemeMode): void {
    this.mode = mode
    this.persist()
    this.applyTheme()
    this.notify()
  }

  getMode(): ThemeMode {
    return this.mode
  }

  getResolvedMode(): 'light' | 'dark' {
    if (this.mode !== 'auto') return this.mode
    return this.mediaQuery.matches ? 'dark' : 'light'
  }

  subscribe(cb: (mode: ThemeMode) => void): () => void {
    this.subscribers.add(cb)
    return () => this.subscribers.delete(cb)
  }

  destroy(): void {
    this.mediaQuery.removeEventListener('change', this.onSystemChange)
    this.subscribers.clear()
  }

  private applyTheme(): void {
    const resolved = this.getResolvedMode()
    const vars = THEMES[resolved]
    const root = document.documentElement
    for (const [key, value] of Object.entries(vars)) {
      root.style.setProperty(key, value)
    }
  }

  private notify(): void {
    for (const cb of this.subscribers) {
      cb(this.mode)
    }
  }

  private persist(): void {
    localStorage.setItem(this.STORAGE_KEY, this.mode)
  }

  private load(): void {
    const stored = localStorage.getItem(this.STORAGE_KEY)
    if (stored === 'light' || stored === 'dark' || stored === 'auto') {
      this.mode = stored
    }
  }

  private onSystemChange = (): void => {
    if (this.mode === 'auto') {
      this.applyTheme()
      this.notify()
    }
  }
}

export const themeEngine = new ThemeEngine()
