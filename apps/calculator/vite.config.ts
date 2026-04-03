import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/apps/calculator/',
  server: { port: 3012 },
  build: {
    outDir: '../../packages/shell/public/apps/calculator',
    emptyOutDir: true,
  },
})
