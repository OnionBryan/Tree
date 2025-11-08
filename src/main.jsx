import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { AppProviders } from './contexts'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import './index.css'

const rootElement = document.getElementById('root');

if (!rootElement) {
  document.body.innerHTML = '<div style="padding: 40px; color: red; font-family: monospace;">ERROR: Root element not found</div>';
  throw new Error('Root element #root not found in DOM');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <ErrorBoundary>
      <AppProviders>
        <App />
      </AppProviders>
    </ErrorBoundary>
  </React.StrictMode>,
)
