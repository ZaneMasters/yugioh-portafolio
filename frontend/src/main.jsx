import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { Toaster } from 'react-hot-toast'
import App from './App.jsx'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Datos se consideran frescos por 1 minuto antes de re-fetchear
      staleTime: 60 * 1000,
      // Reintentar 1 vez en caso de error (por defecto son 3)
      retry: 1,
      // No refetchear al re-enfocar ventana en desarrollo para no spamear
      refetchOnWindowFocus: import.meta.env.PROD,
    },
  },
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#1f2937',
            color: '#f1f5f9',
            border: '1px solid #374151',
            borderRadius: '0.5rem',
            fontSize: '0.875rem',
          },
          success: { iconTheme: { primary: '#22c55e', secondary: '#1f2937' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#1f2937' } },
        }}
      />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  </React.StrictMode>,
)
