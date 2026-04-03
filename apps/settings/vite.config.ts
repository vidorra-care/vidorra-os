import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/apps/settings/',
  server: { port: 3011 },
  build: {
    outDir: '../../packages/shell/public/apps/settings',
    emptyOutDir: true,
  },
})
