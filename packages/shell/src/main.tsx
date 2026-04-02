import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { themeEngine } from '@vidorra/kernel'
import './global.css'
import App from './App'

// Initialize theme from localStorage on startup — sync both CSS class and ThemeEngine
const storedTheme = localStorage.getItem('vidorra:theme')
if (storedTheme === 'dark') {
  document.body.classList.add('dark')
  themeEngine.setMode('dark')
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
