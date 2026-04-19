import { MakerDMG } from '@electron-forge/maker-dmg'
import { MakerZIP } from '@electron-forge/maker-zip'
import { VitePlugin } from '@electron-forge/plugin-vite'
import type { ForgeConfig } from '@electron-forge/shared-types'

const config: ForgeConfig = {
  packagerConfig: {
    asar: true,
    name: 'dashway-issue-tracker',
    executableName: 'dashway-issue-tracker',
  },
  makers: [new MakerZIP({}, ['darwin', 'linux']), new MakerDMG({ format: 'ULFO' })],
  plugins: [
    new VitePlugin({
      build: [
        {
          entry: 'electron/main/bootstrap.ts',
          config: 'vite.main.config.ts',
          target: 'main',
        },
        {
          entry: 'electron/preload/index.ts',
          config: 'vite.preload.config.ts',
          target: 'preload',
        },
      ],
      renderer: [
        {
          name: 'main_window',
          config: 'vite.renderer.config.ts',
        },
      ],
    }),
  ],
}

export default config
