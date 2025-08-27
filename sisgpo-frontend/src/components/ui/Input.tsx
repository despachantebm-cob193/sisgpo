import React from 'react';

// Estende as propriedades padrão de um input HTML.
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

// `React.forwardRef` permite que este componente receba uma `ref` e a encaminhe
// para o elemento <input> interno. Isso é útil para focar no campo programaticamente.
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', type = 'text', ...props }, ref) => {
    return (
      <input
        type={type}
        // w-full: largura total
        // px-3 py-2: preenchimento horizontal e vertical
        // border: adiciona uma borda
        // border-gray-300: cor da borda
        // rounded-md: bordas arredondadas
        // focus:*: estilos aplicados quando o campo está em foco
        className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${className}`}
        ref={ref}
        {...props}
      />
    );
  }
);

// Define um nome de exibição para o componente, útil para depuração.
Input.displayName = 'Input';

export default Input;
