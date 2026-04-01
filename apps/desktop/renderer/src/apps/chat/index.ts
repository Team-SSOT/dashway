import { appRegistry } from '../../shell/registry/app-registry'
import { routes } from './routes'
import { ChatSidebar } from './sidebar'

appRegistry.register({
  manifest: {
    id: 'chat',
    title: 'Chat',
    icon: 'message-circle',
    routes: ['/chat'],
    hasLocalSidebar: true,
  },
  routes,
  sidebar: ChatSidebar,
})
