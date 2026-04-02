import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { themeEngine, kernelBusHost } from '@vidorra/kernel'
import { useWindowStore } from './stores/useWindowStore'
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

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
