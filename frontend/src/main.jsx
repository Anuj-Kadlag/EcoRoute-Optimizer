import React from 'react'
import ReactDOM from 'react-dom/client'
import L from 'leaflet'

// Ensure Leaflet global is attached for Leaflet plugins
if (typeof window !== 'undefined') {
  window.L = L;
}

import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)
