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
      '/apps/welcome': {
        target: 'http://localhost:3013',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/apps\/welcome/, ''),
      },
    },
  },
})
