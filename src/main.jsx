import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { registerSW } from 'virtual:pwa-register'

// Check for PWA updates every hour
registerSW({
  onNeedRefresh() {},
  onOfflineReady() {},
  onRegistered(r) {
    if (r) {
      setInterval(() => {
        r.update()
      }, 60 * 60 * 1000) // 1 Hour
    }
  }
})

// Hard reload when a new service worker takes control
let refreshing = false
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshing) return
    refreshing = true
    window.location.reload()
  })
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
