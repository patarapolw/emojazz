import preact from '@preact/preset-vite'
import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [preact()],
  server: {
    port: 7466,
    proxy: {
      '/api': 'http://localhost:5000',
      '/img': 'http://localhost:5000',
    },
  },
})
