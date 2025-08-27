import React from 'react';
// Usando caminho relativo para importar o Card, que está no mesmo diretório 'ui'
import Card from './Card';

interface StatCardProps {
  title: string;
  value: number | string;
  description: string;
  isLoading: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, description, isLoading }) => {
  return (
    <Card className="text-center">
      <h3 className="text-lg font-medium text-gray-500">{title}</h3>
      {isLoading ? (
        <div className="mt-2 h-10 w-24 mx-auto bg-gray-300 rounded-md animate-pulse"></div>
      ) : (
        <p className="mt-2 text-4xl font-bold text-indigo-600">{value}</p>
      )}
      <p className="mt-1 text-sm text-gray-500">{description}</p>
    </Card>
  );
};

export default StatCard;
