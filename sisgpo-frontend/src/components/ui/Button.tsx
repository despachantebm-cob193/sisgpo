import React from 'react';

// Estende as propriedades padrão de um botão HTML.
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({ children, className = '', ...props }) => {
  return (
    <button
      // --- CORREÇÃO APLICADA AQUI ---
      // A classe `w-full` foi removida das classes padrão.
      // Adicionamos `whitespace-nowrap` para evitar que o texto do botão quebre em várias linhas.
      // As classes de largura agora devem ser passadas via `className` quando necessário.
      className={`inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 whitespace-nowrap ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
