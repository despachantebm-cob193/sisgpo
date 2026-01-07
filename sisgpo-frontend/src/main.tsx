// Arquivo: frontend/src/main.tsx

import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { GoogleOAuthProvider } from '@react-oauth/google';
import { router } from './router';
import { SupabaseAuthStateListener } from './components/auth/SupabaseAuthStateListener';
import './index.css';
import { palette } from './theme/palette';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error("Falha ao encontrar o elemento raiz. O 'index.html' deve conter um elemento com id 'root'.");
}

// Cria uma instância do QueryClient
const queryClient = new QueryClient();

const root = ReactDOM.createRoot(rootElement);

root.render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId="1051946291439-3u8vm6u2ao40nslmf2k0rmgmna932qp5.apps.googleusercontent.com">
      {/* Envolve a aplicação com o Provider */}
      <QueryClientProvider client={queryClient}>
        <SupabaseAuthStateListener />
        <RouterProvider router={router} />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 5000,
            style: {
              background: palette.searchbar,
              color: palette.textMain,
              border: `1px solid ${palette.cardBlue}`,
            },
          }}
        />
      </QueryClientProvider>
    </GoogleOAuthProvider>
  </React.StrictMode>,
);

