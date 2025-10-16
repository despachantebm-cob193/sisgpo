// Arquivo: frontend/src/main.tsx

import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import router from './router'; // <<< CORREÇÃO AQUI: importe sem as chaves {}
import './index.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error("Falha ao encontrar o elemento raiz. O 'index.html' deve conter um elemento com id 'root'.");
}

// Cria uma instância do QueryClient
const queryClient = new QueryClient();

const root = ReactDOM.createRoot(rootElement);

root.render(
  <React.StrictMode>
    {/* Envolve a aplicação com o Provider */}
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 5000,
          style: {
            background: '#333',
            color: '#fff',
          },
        }}
      />
    </QueryClientProvider>
  </React.StrictMode>,
);