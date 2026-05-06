import { defineConfig } from 'vitest/config'
import path from 'node:path'
import react from '@vitejs/plugin-react'

const workspaceRoot = path.resolve(__dirname, '../../..')

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.ts'],
    environmentOptions: {
      jsdom: {
        url: 'http://localhost/',
      },
    },
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
})
