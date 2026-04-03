import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    // Prevent SPA fallback for /apps/** paths so iframes get real 404s
    // instead of loading the shell's index.html
    fs: {
      strict: false,
    },
    proxy: {
      '/apps/app-store': {
        target: 'http://localhost:3010',
        changeOrigin: true,
      },
      '/apps/settings': {
        target: 'http://localhost:3011',
        changeOrigin: true,
      },
      '/apps/calculator': {
        target: 'http://localhost:3012',
        changeOrigin: true,
      },
      '/apps/welcome': {
        target: 'http://localhost:3013',
        changeOrigin: true,
      },
    },
  },
})
