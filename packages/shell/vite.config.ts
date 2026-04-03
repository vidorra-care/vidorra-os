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
        rewrite: (path) => path.replace(/^\/apps\/app-store/, ''),
      },
      '/apps/settings': {
        target: 'http://localhost:3011',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/apps\/settings/, ''),
      },
      '/apps/calculator': {
        target: 'http://localhost:3012',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/apps\/calculator/, ''),
      },
    },
  },
})
