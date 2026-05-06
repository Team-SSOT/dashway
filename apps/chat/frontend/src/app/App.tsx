import { RouterProvider } from 'react-router-dom'
import { TooltipProvider } from '@/shared/ui/tooltip'
import { DataSourceProvider } from './providers/DataSourceProvider'
import { QueryProvider } from './providers/QueryProvider'
import { ThemeProvider } from './providers/ThemeProvider'
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
