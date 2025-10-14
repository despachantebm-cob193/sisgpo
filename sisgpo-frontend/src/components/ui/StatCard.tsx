import React from 'react';
import Card from './Card';
import { LucideIcon, icons } from 'lucide-react'; // Adicionado import para ícones Lucide (assumindo que "Calendar" e "Clock" são Lucide)

interface StatCardProps {
  title: string;
  value: number | string;
  description?: string; // CORRIGIDO: Tornar opcional
  isLoading?: boolean; // CORRIGIDO: Tornar opcional
  icon?: string; // NOVO: Adiciona a propriedade opcional icon (nome do ícone Lucide)
}

const StatCard: React.FC<StatCardProps> = ({ title, value, description, isLoading = false, icon }) => {
  const IconComponent = icon ? (icons[icon as keyof typeof icons] as LucideIcon) : null;
  
  return (
    <Card className="text-center p-6 flex flex-col items-center">
      <div className="flex items-center justify-center mb-3">
          {IconComponent && (
            // NOVO: Renderiza o ícone
            <IconComponent className="h-6 w-6 text-indigo-500 mr-3" />
          )}
          <h3 className="text-sm font-medium text-gray-500">{title}</h3>
      </div>
      
      {isLoading ? (
        <div className="mt-2 h-10 w-24 mx-auto bg-gray-300 rounded-md animate-pulse"></div>
      ) : (
        <p className="mt-2 text-3xl font-bold text-indigo-600">{value}</p>
      )}
      {description && <p className="mt-1 text-xs text-gray-500">{description}</p>}
    </Card>
  );
};

export default StatCard;