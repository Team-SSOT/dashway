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
  // 워크스페이스 패키지는 dev 중 빈번히 수정되므로 pre-bundle 캐시 제외 → 항상 source 그대로 서빙
  optimizeDeps: {
    exclude: [
      '@dashway/app-protocol',
      '@dashway/app-sdk',
      '@dashway/shell-runtime',
      '@dashway/config-schema',
      '@dashway/desktop-sdk',
      '@dashway/design-tokens',
      '@dashway/ui',
    ],
    // 워크스페이스 패키지가 transitively 가져오는 deps 미리 발견(2차 optimize churn 방지)
    include: ['zod', 'react', 'react-dom', 'react/jsx-runtime', 'react/jsx-dev-runtime'],
  },
  build: {
    rollupOptions: {
      input: resolve(__dirname, 'renderer/index.html'),
    },
  },
})
