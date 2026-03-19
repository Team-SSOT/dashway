import type { DesktopAPI } from '@dashway/desktop-sdk'

declare global {
  interface Window {
    desktop: DesktopAPI
  }
}
