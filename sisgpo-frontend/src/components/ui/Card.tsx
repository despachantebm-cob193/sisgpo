import React from 'react';

interface CardProps {
  title: string;
  subtitle?: string; // Subtítulo opcional
  children: React.ReactNode;
  className?: string; // Adicionado para permitir classes customizadas (ex: 'relative')
}

const Card: React.FC<CardProps> = ({ title, subtitle, children, className = '' }) => {
  return (
    // ▼▼▼ INÍCIO DA MODIFICAÇÃO ▼▼▼
    // Removido o padding geral (p-6) e adicionado 'overflow-hidden'
    <div className={`bg-white shadow-md rounded-lg overflow-hidden ${className}`}>
      
      {/* Cabeçalho do Card */}
      <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
        {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
      </div>

      {/*          Corpo do Card (Children) 
         Removido 'mt-4'. O componente filho (children) 
         agora controla seu próprio padding.
      */}
      <div>
        {children}
      </div>
    
    </div>
    // ▲▲▲ FIM DA MODIFICAÇÃO ▲▲▲
  );
};

export default Card;