import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { themeEngine, kernelBusHost } from '@vidorra/kernel'
import { useWindowStore } from './stores/useWindowStore'
import { useThemeStore } from './stores/useThemeStore'
import './global.css'
import App from './App'

// Initialize theme from localStorage on startup — sync both CSS class and ThemeEngine
const storedTheme = localStorage.getItem('vidorra:theme')
if (storedTheme === 'dark') {
  document.body.classList.add('dark')
  themeEngine.setMode('dark')
}

// Initialize KernelBusHost with store callbacks before any iframe mounts (D-01)
kernelBusHost.init({
  setWindowTitle: (windowId, title) => {
    useWindowStore.setState((s) => ({
      windows: s.windows.map((w) => w.id === windowId ? { ...w, title } : w),
    }))
  },
  closeWindow: (windowId) => {
    useWindowStore.getState().closeWindow(windowId)
  },
  setWindowMinimized: (windowId) => {
    useWindowStore.getState().setWindowState(windowId, 'minimized')
  },
  toggleMaximize: (windowId) => {
    useWindowStore.getState().toggleMaximize(windowId)
  },
  setWindowRect: (windowId, rect) => {
    useWindowStore.getState().setWindowRect(windowId, rect)
  },
  getWindowRect: (windowId) => {
    return useWindowStore.getState().windows.find((w) => w.id === windowId)?.rect
  },
  getResolvedTheme: () => {
    return themeEngine.getResolvedMode()
  },
})

// Keep useThemeStore in sync when themeEngine is called directly (e.g., from Settings iframe)
themeEngine.subscribe((mode) => {
  const resolved = themeEngine.getResolvedMode()
  useThemeStore.setState({ theme: resolved })
  // Sync body class (themeEngine.applyTheme handles CSS vars, but body.dark class may lag)
  document.body.classList.toggle('dark', resolved === 'dark')
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
