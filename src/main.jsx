import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { AppProviders } from './contexts'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import './index.css'

console.log('[main.jsx] Starting Tree Logic Builder...');
console.log('[main.jsx] React version:', React.version);
console.log('[main.jsx] Location:', window.location.href);

try {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    throw new Error('Root element not found!');
  }
  console.log('[main.jsx] Root element found');

  const root = ReactDOM.createRoot(rootElement);
  console.log('[main.jsx] React root created');

  root.render(
    <React.StrictMode>
      <ErrorBoundary>
        <AppProviders>
          <App />
        </AppProviders>
      </ErrorBoundary>
    </React.StrictMode>,
  );
  console.log('[main.jsx] App rendered successfully');
} catch (error) {
  console.error('[main.jsx] FATAL ERROR:', error);
  document.body.innerHTML = `
    <div style="padding: 40px; max-width: 800px; margin: 0 auto; font-family: system-ui;">
      <h1 style="color: #dc2626;">App Failed to Load</h1>
      <p><strong>Error:</strong> ${error.message}</p>
      <pre style="background: #1e293b; color: #e2e8f0; padding: 20px; border-radius: 8px; overflow-x: auto;">${error.stack}</pre>
      <p>Check the browser console for more details.</p>
      <a href="./test.html" style="color: #0039A6;">→ Go to test page</a>
    </div>
  `;
}
