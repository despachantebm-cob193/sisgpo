import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
// Correção: Importa diretamente do arquivo index.tsx para ser explícito.
import { router } from './router/index.tsx'; 
import './index.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error("Falha ao encontrar o elemento raiz. O 'index.html' deve conter um elemento com id 'root'.");
}

const root = ReactDOM.createRoot(rootElement);

root.render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);
