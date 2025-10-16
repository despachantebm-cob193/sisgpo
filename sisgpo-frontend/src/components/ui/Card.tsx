import React from 'react';

// Adicione 'subtitle' aqui
interface CardProps {
  title: string;
  subtitle?: string; // Torna o subtítulo opcional
  children: React.ReactNode;
}

const Card: React.FC<CardProps> = ({ title, subtitle, children }) => {
  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
      {/* Adicione esta linha para renderizar o subtítulo se ele existir */}
      {subtitle && <p className="text-sm text-gray-500 mb-4">{subtitle}</p>}
      <div className="mt-4">{children}</div>
    </div>
  );
};

export default Card;