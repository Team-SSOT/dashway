import { appRegistry } from '../../shell/registry/app-registry'
import { routes } from './routes'
import { HomeSidebar } from './sidebar'

appRegistry.register({
  manifest: {
    id: 'home',
    title: 'Home',
    icon: 'house',
    routes: ['/home'],
    hasLocalSidebar: true,
  },
  routes,
  sidebar: HomeSidebar,
})
