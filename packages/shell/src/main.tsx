import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './global.css'
import App from './App'

// Initialize theme from localStorage on startup
const storedTheme = localStorage.getItem('vidorra:theme')
if (storedTheme === 'dark') {
  document.body.classList.add('dark')
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
