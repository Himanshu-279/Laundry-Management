import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import App from './App';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#141e33',
            color: '#e8eef8',
            border: '1px solid #1e2d4a',
            fontSize: '14px',
          },
          success: { iconTheme: { primary: '#10b981', secondary: '#141e33' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#141e33' } },
        }}
      />
    </QueryClientProvider>
  </React.StrictMode>
);
