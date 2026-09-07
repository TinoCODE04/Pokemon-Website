import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'
import { CompareProvider, FavoritesProvider } from './store/AppContext'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <FavoritesProvider>
        <CompareProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </CompareProvider>
      </FavoritesProvider>
    </QueryClientProvider>
  </StrictMode>,
)
