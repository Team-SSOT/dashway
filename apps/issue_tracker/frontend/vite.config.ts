import { resolve } from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import relay from 'vite-plugin-relay'

export default defineConfig({
  plugins: [react(), relay, tailwindcss()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  optimizeDeps: {
    // 워크스페이스 패키지는 pre-bundle 캐시 제외(소스 변경 즉시 반영)
    exclude: [
      '@dashway/app-protocol',
      '@dashway/app-sdk',
      '@dashway/design-tokens',
    ],
    // 워크스페이스 패키지가 transitively 가져오는 deps는 첫 패스에서 미리 발견되도록 명시
    // (그래야 두번째 optimize 라운드가 발생해 hash가 churn 되는 걸 막음)
    include: ['zod', 'react', 'react-dom', 'react/jsx-runtime', 'react/jsx-dev-runtime'],
  },
  server: {
    host: '0.0.0.0',
    port: 5174,
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
})
