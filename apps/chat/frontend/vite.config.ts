import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const workspaceRoot = path.resolve(__dirname, '../../..')

export default defineConfig({
  plugins: [react(), tailwindcss()],
  optimizeDeps: {
    exclude: ['@dashway/app-protocol', '@dashway/app-sdk', '@dashway/design-tokens'],
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
      '@dashway/rich-text/editor': path.resolve(
        workspaceRoot,
        './packages/rich-text/src/editor/index.ts',
      ),
      '@dashway/rich-text/react': path.resolve(workspaceRoot, './packages/rich-text/src/react.ts'),
      '@dashway/rich-text/render': path.resolve(
        workspaceRoot,
        './packages/rich-text/src/render/index.ts',
      ),
      '@dashway/rich-text': path.resolve(workspaceRoot, './packages/rich-text/src/index.ts'),
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
      '/graphql': {
        target: 'http://localhost:12001',
        changeOrigin: true,
      },
      '/ws/chat': {
        target: 'ws://localhost:12001',
        ws: true,
        changeOrigin: true,
      },
    },
  },
})
