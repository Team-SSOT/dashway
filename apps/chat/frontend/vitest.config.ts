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
      // More specific subpath must precede the bare specifier: Vite alias
      // matches `@dashway/rich-text` as a prefix of `@dashway/rich-text/react`.
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
})
