// Crie este arquivo em: src/components/dashboard/StatCard.tsx

import React from 'react';

interface StatCardProps {
  title: string;
  value: number | string;
  description: string;
  isLoading: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, description, isLoading }) => {
  return (
    <div className="surface-card p-6 text-center">
      <h3 className="text-lg font-medium text-textSecondary">{title}</h3>
      {isLoading ? (
        <div className="mx-auto mt-2 h-10 w-24 rounded-md bg-searchbar animate-pulse"></div>
      ) : (
        <p className="mt-2 text-4xl font-bold text-tagBlue">{value}</p>
      )}
      <p className="mt-1 text-sm text-textSecondary">{description}</p>
    </div>
  );
};

export default StatCard;
