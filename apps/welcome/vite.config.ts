import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: { port: 3013 },
  build: {
    outDir: '../../packages/shell/public/apps/welcome',
    emptyOutDir: true,
  },
})
