import { ShellModeProvider } from '@dashway/app-sdk/react'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './app/App'
import './styles/globals.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ShellModeProvider appId="issue-tracker">
      <App />
    </ShellModeProvider>
  </StrictMode>,
)
