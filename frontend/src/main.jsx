import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider } from 'next-themes'
import { ErrorBoundary } from './components/error-boundary.jsx'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <ErrorBoundary>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ErrorBoundary>
    </ThemeProvider>
  </StrictMode>,
)
