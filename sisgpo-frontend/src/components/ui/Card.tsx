import React from 'react';

// Define as propriedades que o componente Card pode receber.
// `children` é o conteúdo que será renderizado dentro do card.
// `className` permite adicionar classes CSS customizadas de fora.
interface CardProps {
  children: React.ReactNode;
  className?: string;
}

const Card: React.FC<CardProps> = ({ children, className = '' }) => {
  return (
    // Concatena as classes padrão com quaisquer classes customizadas passadas via props.
    // bg-white: fundo branco
    // shadow-md: sombra média para dar profundidade
    // rounded-lg: bordas arredondadas
    // p-8: preenchimento (padding) interno
    <div className={`bg-white shadow-md rounded-lg p-8 ${className}`}>
      {children}
    </div>
  );
};

export default Card;
