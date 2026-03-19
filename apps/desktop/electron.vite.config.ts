import { resolve } from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import relay from 'vite-plugin-relay'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    build: {
      rollupOptions: {
        input: {
          index: resolve(__dirname, 'electron/main/bootstrap.ts'),
        },
      },
    },
  },

  preload: {
    plugins: [externalizeDepsPlugin()],
    build: {
      rollupOptions: {
        input: {
          index: resolve(__dirname, 'electron/preload/index.ts'),
        },
      },
    },
  },

  renderer: {
    root: resolve(__dirname, 'renderer'),
    plugins: [react(), relay, tailwindcss()],
    build: {
      rollupOptions: {
        input: {
          index: resolve(__dirname, 'renderer/index.html'),
        },
      },
    },
    resolve: {
      alias: {
        '@': resolve(__dirname, 'renderer/src'),
      },
    },
  },
})
