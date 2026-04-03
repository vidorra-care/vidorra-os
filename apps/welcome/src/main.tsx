import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createApp } from '@vidorra/sdk'
import App from './App'

const app = createApp()

async function main() {
  await app.ready()

  // Apply initial theme
  const mode = await app.theme.get()
  document.body.classList.toggle('dark', mode === 'dark')

  // Subscribe to future theme changes pushed by Shell
  app.theme.onChange((m) => {
    document.body.classList.toggle('dark', m === 'dark')
  })

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App onGetStarted={() => app.window.close()} />
    </StrictMode>,
  )
}

main()
