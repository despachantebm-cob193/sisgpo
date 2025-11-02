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
    <div className="surface-card flex flex-col justify-between gap-3 p-6">
      <div>
        <h3 className="text-sm font-medium uppercase tracking-wide text-textSecondary">{title}</h3>
        {isLoading ? (
          <div className="mt-2">
            <Spinner className="text-tagBlue" />
          </div>
        ) : (
          <p className="mt-1 text-3xl font-semibold text-textMain">{value}</p>
        )}
      </div>
      {description && <p className="text-sm text-textSecondary">{description}</p>}
    </div>
  );
};

export default StatCard;
