import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

const workspaceRoot = path.resolve(__dirname, '../../..')

export default defineConfig({
  plugins: [react(), tailwindcss()],
  optimizeDeps: {
    exclude: ['@dashway/design-tokens'],
  },
  resolve: {
    dedupe: [
      '@lexical/code',
      '@lexical/html',
      '@lexical/link',
      '@lexical/list',
      '@lexical/markdown',
      '@lexical/react',
      '@lexical/rich-text',
      'lexical',
      'react',
      'react-dom',
    ],
    alias: {
      '@dashway/chat-ui': path.resolve(workspaceRoot, './packages/chat-ui/src/index.ts'),
      '@dashway/ui': path.resolve(workspaceRoot, './packages/ui/src/index.ts'),
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:12001',
        changeOrigin: true,
      },
    },
  },
})
