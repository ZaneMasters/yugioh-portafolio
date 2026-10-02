import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { Toaster } from 'react-hot-toast'
import { HelmetProvider } from 'react-helmet-async'
import App from './App.jsx'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Datos se consideran frescos por 60 segundos antes de re-fetchear
      staleTime: 60 * 1000,
      // Reintentar 1 vez en caso de error (por defecto son 3)
      retry: 1,
      // Evitar spam de peticiones al alternar entre pestañas
      refetchOnWindowFocus: false,
    },
  },
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <App />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 5000,
            style: {
              background: '#1f2937',
              color: '#f1f5f9',
              border: '1px solid #374151',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
            },
            success: {
              duration: 5000,
              iconTheme: { primary: '#22c55e', secondary: '#1f2937' },
            },
            error: {
              duration: 6000,
              iconTheme: { primary: '#ef4444', secondary: '#1f2937' },
            },
          }}
        />
        {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />}
      </QueryClientProvider>
    </HelmetProvider>
  </React.StrictMode>,
)
