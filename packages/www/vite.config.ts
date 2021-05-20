import fs from 'fs'

import preact from '@preact/preset-vite'
import replace from '@rollup/plugin-replace'
import { defineConfig } from 'vite'

const isDesktop = !!process.env.IS_DESKTOP

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    replace({
      __LoadSearch__: JSON.stringify(
        isDesktop
          ? ''
          : fs.readFileSync('../nodejs/assets/search.yaml', 'utf-8'),
      ),
      __LoadImage__: JSON.stringify(
        isDesktop
          ? ''
          : fs.readFileSync('../nodejs/assets/image.yaml', 'utf-8'),
      ),
      preventAssignment: true,
    }),
    preact(),
  ],
  server: {
    port: 7466,
    proxy: {
      /**
       * Prevent copying of large files
       */
      '^/(img|font)/': 'http://localhost:5000',
    },
  },
  build: {
    outDir: isDesktop ? '../desktop/public' : './dist',
    emptyOutDir: true,
  },
})
