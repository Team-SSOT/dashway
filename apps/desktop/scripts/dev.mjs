// Manual dev runner — bypasses electron-forge plugin-vite (broken under Vite 6).
// Starts the renderer Vite dev server, builds main + preload bundles with the
// dev URL injected, then spawns electron.exe pointed at the app directory.
import { spawn } from 'node:child_process'
import { mkdirSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { build, createServer } from 'vite'

const APP_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const REPO_ROOT = resolve(APP_DIR, '..', '..')
const RENDERER_PORT = Number(process.env.DASHWAY_RENDERER_PORT ?? 5173)
const VITE_DEV_URL = `http://localhost:${RENDERER_PORT}`
const RENDERER_NAME = 'main_window'

mkdirSync(join(APP_DIR, '.vite/build'), { recursive: true })

console.log('[dev] starting renderer Vite on', VITE_DEV_URL)
const renderer = await createServer({
  configFile: join(APP_DIR, 'vite.renderer.config.ts'),
  root: join(APP_DIR, 'renderer'),
  server: { port: RENDERER_PORT, strictPort: true },
})
await renderer.listen()
renderer.printUrls()

const buildElectronTarget = (entry, outFile) =>
  build({
    configFile: false,
    root: APP_DIR,
    build: {
      outDir: join(APP_DIR, '.vite/build'),
      emptyOutDir: false,
      minify: false,
      target: 'node22',
      ssr: entry,
      rollupOptions: {
        external: ['electron', /^node:/],
        output: { format: 'cjs', entryFileNames: outFile },
      },
    },
    define: {
      MAIN_WINDOW_VITE_DEV_SERVER_URL: JSON.stringify(VITE_DEV_URL),
      MAIN_WINDOW_VITE_NAME: JSON.stringify(RENDERER_NAME),
    },
  })

console.log('[dev] building electron main bundle')
await buildElectronTarget(join(APP_DIR, 'electron/main/bootstrap.ts'), 'bootstrap.js')

console.log('[dev] building electron preload bundle')
await buildElectronTarget(join(APP_DIR, 'electron/preload/index.ts'), 'index.js')

const electronBin = join(REPO_ROOT, 'node_modules', 'electron', 'dist', 'electron.exe')
console.log('[dev] spawning electron at', electronBin)
const electron = spawn(electronBin, [APP_DIR, '--enable-logging'], {
  cwd: APP_DIR,
  stdio: 'inherit',
  env: { ...process.env, ELECTRON_ENABLE_LOGGING: 'true' },
})

const shutdown = async () => {
  console.log('[dev] shutting down')
  if (!electron.killed) electron.kill()
  await renderer.close().catch(() => {})
  process.exit(0)
}

electron.on('exit', (code) => {
  console.log('[dev] electron exited with code', code)
  shutdown()
})
process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
