import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/apps/app-store/',
  server: { port: 3010 },
  build: {
    outDir: '../../packages/shell/public/apps/app-store',
    emptyOutDir: true,
  },
})
