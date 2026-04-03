import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

export default defineConfig({
  build: {
    lib: {
      entry: 'src/index.ts',
      formats: ['es'],
      fileName: 'vidorra-sdk',
    },
    rollupOptions: {
      external: [],
    },
  },
  plugins: [
    dts({
      outDir: 'dist',
      insertTypesEntry: true,
    }),
  ],
})
