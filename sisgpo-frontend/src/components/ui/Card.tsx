import React from 'react';

// Define as propriedades que o componente Card pode receber.
interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string; // NOVO: Adiciona a propriedade opcional title
}

const Card: React.FC<CardProps> = ({ children, className = '', title }) => {
  return (
    // Concatena as classes padrão com quaisquer classes customizadas passadas via props.
    <div className={`bg-white shadow-md rounded-lg p-8 ${className}`}>
      {title && ( // NOVO: Renderiza o título se ele for fornecido
        <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-2">
          {title}
        </h2>
      )}
      {children}
    </div>
  );
};

export default Card;