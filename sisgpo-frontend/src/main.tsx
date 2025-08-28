import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { Toaster } from 'react-hot-toast'; // Importa o Toaster

import { router } from './router'; // Importa o router do index.ts da pasta router
import './index.css'; // Importa os estilos do Tailwind

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error("Falha ao encontrar o elemento raiz. O 'index.html' deve conter um elemento com id 'root'.");
}

const root = ReactDOM.createRoot(rootElement);

root.render(
  <React.StrictMode>
    {/* O RouterProvider gerencia todas as rotas da aplicação */}
    <RouterProvider router={router} />
    
    {/* O Toaster gerencia todas as notificações */}
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
  </React.StrictMode>,
);
