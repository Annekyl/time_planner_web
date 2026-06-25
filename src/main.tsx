import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import './index.css'
import App from './App'
import { ThemeProvider } from './lib/theme'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <App />
        <Toaster 
          position="top-center" 
          toastOptions={{
            style: {
              background: 'var(--theme-bg-primary)',
              color: 'var(--theme-text-primary)',
              border: '1px solid var(--theme-border-default)',
            }
          }}
        />
      </ThemeProvider>
    </QueryClientProvider>
  </StrictMode>,
)
