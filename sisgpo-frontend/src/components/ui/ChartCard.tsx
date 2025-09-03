// Arquivo: frontend/src/components/ui/ChartCard.tsx

import React from 'react';
import Spinner from './Spinner';

interface ChartCardProps {
  title: string;
  isLoading: boolean;
  hasData: boolean;
  children: React.ReactNode;
}

const ChartCard: React.FC<ChartCardProps> = ({ title, isLoading, hasData, children }) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow-md h-96 flex flex-col">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>
      <div className="flex-grow">
        {isLoading ? (
          <div className="h-full flex justify-center items-center">
            <Spinner className="h-10 w-10 text-gray-500" />
          </div>
        ) : !hasData ? (
          <div className="h-full flex justify-center items-center">
            <p className="text-gray-500">Nenhum dado disponível para exibir.</p>
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
};

export default ChartCard;
