import React from 'react';
import Spinner from '../ui/Spinner';

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string; // Tornar opcional
  isLoading?: boolean; // Tornar opcional
}

const StatCard: React.FC<StatCardProps> = ({ title, value, description, isLoading }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md flex flex-col justify-between">
      <div>
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        {isLoading ? (
          <div className="mt-2">
            <Spinner />
          </div>
        ) : (
          <p className="mt-1 text-3xl font-semibold text-gray-900">{value}</p>
        )}
      </div>
      {description && <p className="text-sm text-gray-500 mt-2">{description}</p>}
    </div>
  );
};

export default StatCard;