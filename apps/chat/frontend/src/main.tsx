import { ShellModeProvider } from '@dashway/app-sdk/react'
import React from 'react'
import ReactDOM from 'react-dom/client'
import { App } from './app/App'
import './index.css'

// V1.1 live mode is dev/staging only — enable after V1.2 app-protocol token injection (dashway:auth.token)
if (import.meta.env.PROD && import.meta.env.VITE_CHAT_DATA_SOURCE === 'live') {
  throw new Error('V1.1 live mode is dev/staging only. Enable after V1.2 app-protocol token injection.')
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ShellModeProvider appId="chat">
      <App />
    </ShellModeProvider>
  </React.StrictMode>,
)

if (import.meta.env.DEV) {
  void import('@axe-core/react').then(({ default: axe }) => {
    import('react').then((React) => {
      import('react-dom').then((ReactDOM) => {
        axe(React, ReactDOM, 1000)
      })
    })
  })
}
