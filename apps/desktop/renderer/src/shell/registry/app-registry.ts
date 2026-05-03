import type { RegisteredAppManifest } from '@dashway/config-schema'
import type { ComponentType } from 'react'
import type { RouteObject } from 'react-router-dom'

export interface RegisteredApp {
  manifest: RegisteredAppManifest
  routes: () => RouteObject[]
  sidebar: ComponentType | null
}

class AppRegistry {
  private apps = new Map<string, RegisteredApp>()

  register(app: RegisteredApp): void {
    this.apps.set(app.manifest.id, app)
  }

  get(id: string): RegisteredApp | undefined {
    return this.apps.get(id)
  }

  list(): RegisteredApp[] {
    return Array.from(this.apps.values())
  }

  buildRoutes(): RouteObject[] {
    return this.list().flatMap((app) => app.routes())
  }

  getOrderedManifests(navOrder: string[]): RegisteredAppManifest[] {
    return navOrder
      .map((id) => this.apps.get(id)?.manifest)
      .filter((m): m is RegisteredAppManifest => m !== undefined)
  }
}

export const appRegistry = new AppRegistry()
