import React from 'react'
import ReactDOM from 'react-dom/client'
import { App } from './app/App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
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
