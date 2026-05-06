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
    // electron-forge plugin-vite + Vite 6의 dep-scanner가 라이프사이클 충돌로 "Request is outdated"
    // 에러를 일으키며 Vite 서버를 종료시킨다 → Electron 메인이 함께 죽는다.
    // include 목록만으로 pre-bundle을 결정하도록 dep-scanner를 비활성화.
    noDiscovery: true,
    exclude: [
      '@dashway/app-protocol',
      '@dashway/app-sdk',
      '@dashway/shell-runtime',
      '@dashway/config-schema',
      '@dashway/desktop-sdk',
      '@dashway/design-tokens',
      '@dashway/ui',
    ],
    include: [
      'zod',
      'react',
      'react-dom',
      'react/jsx-runtime',
      'react/jsx-dev-runtime',
      'react-dom/client',
      'react-router',
      'react-router-dom',
      'react-relay',
      'relay-runtime',
      'zustand',
    ],
  },
  build: {
    rollupOptions: {
      input: resolve(__dirname, 'renderer/index.html'),
    },
  },
})
