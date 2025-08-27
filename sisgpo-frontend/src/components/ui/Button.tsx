import React from 'react';

// Estende as propriedades padrão de um botão HTML.
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({ children, className = '', ...props }) => {
  return (
    <button
      // w-full: largura total
      // flex justify-center: centraliza o conteúdo
      // py-2 px-4: preenchimento
      // border-transparent: borda transparente
      // rounded-md shadow-sm: bordas arredondadas e sombra
      // text-sm font-medium text-white: estilos do texto
      // bg-indigo-600 hover:bg-indigo-700: cor de fundo e efeito hover
      // focus:*: estilos de foco para acessibilidade
      className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
