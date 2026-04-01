import { appRegistry } from '../../shell/registry/app-registry'
import { routes } from './routes'
import { TasksSidebar } from './sidebar'

appRegistry.register({
  manifest: {
    id: 'tasks',
    title: 'Tasks',
    icon: 'square-check-big',
    routes: ['/tasks'],
    hasLocalSidebar: true,
  },
  routes,
  sidebar: TasksSidebar,
})
