import { resolve } from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import relay from 'vite-plugin-relay'

export default defineConfig({
  root: resolve(__dirname, 'renderer'),
  plugins: [react(), relay, tailwindcss()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'renderer/src'),
    },
  },
  build: {
    rollupOptions: {
      input: resolve(__dirname, 'renderer/index.html'),
    },
  },
})
