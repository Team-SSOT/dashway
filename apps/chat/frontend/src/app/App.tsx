import { RouterProvider } from 'react-router-dom'
import { TooltipProvider } from '@/shared/ui/tooltip'
import { QueryProvider } from './providers/QueryProvider'
import { ThemeProvider } from './providers/ThemeProvider'
import { DataSourceProvider } from './providers/DataSourceProvider'
import { router } from './router'

export function App() {
  return (
    <ThemeProvider>
      <QueryProvider>
        <DataSourceProvider>
          <TooltipProvider delayDuration={200}>
            <RouterProvider router={router} />
          </TooltipProvider>
        </DataSourceProvider>
      </QueryProvider>
    </ThemeProvider>
  )
}
