import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./test/test-setup.ts'],
    environmentOptions: {
      jsdom: {
        url: 'http://localhost/',
      },
    },
  },
  resolve: {
    // Mirror apps/chat/frontend/vitest.config.ts dedupe list so that a single
    // instance of Lexical (and React) is shared. Multiple Lexical instances
    // break `instanceof` checks used by node registration / mutation listeners.
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
  },
})
