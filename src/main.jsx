import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { AppProviders } from './contexts'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <AppProviders>
        <App />
      </AppProviders>
    </ErrorBoundary>
  </React.StrictMode>,
)
