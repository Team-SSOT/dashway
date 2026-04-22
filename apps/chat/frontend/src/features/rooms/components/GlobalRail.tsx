import { Home, Hash, Bell, Settings, Sun, Moon } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/ui/tooltip'
import { useUiStore } from '@/shared/store/uiStore'
import { cn } from '@/shared/lib/cn'

interface RailItem {
  icon: typeof Home
  label: string
  to?: string
}

const items: RailItem[] = [
  { icon: Home, label: 'Home' },
  { icon: Hash, label: 'Channels' },
  { icon: Bell, label: 'Activity' },
]

export function GlobalRail() {
  const theme = useUiStore((s) => s.theme)
  const toggleTheme = useUiStore((s) => s.toggleTheme)

  return (
    <div className="flex h-full flex-col items-center gap-1 py-3">
      {items.map(({ icon: Icon, label }) => (
        <Tooltip key={label}>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className={cn('h-10 w-10')} aria-label={label}>
              <Icon className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">{label}</TooltipContent>
        </Tooltip>
      ))}

      <div className="mt-auto flex flex-col gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10"
              aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
              onClick={toggleTheme}
            >
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            {theme === 'dark' ? 'Light mode' : 'Dark mode'}
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-10 w-10" aria-label="Settings">
              <Settings className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">Settings</TooltipContent>
        </Tooltip>
      </div>
    </div>
  )
}
