import React from 'react';
import Spinner from '../ui/Spinner';

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  isLoading?: boolean;
  variant?: 'default' | 'highlight'; // Add variant prop
}

const StatCard: React.FC<StatCardProps> = ({ title, value, description, isLoading, variant = 'default' }) => {
  const cardClasses = `
    flex flex-col justify-between gap-3 p-6 rounded-lg shadow-sm
    ${variant === 'highlight' ? 'bg-tagBlue/20 border border-tagBlue text-white' : 'bg-cardSlate border border-borderDark/60'}
  `;

  const titleClasses = `
    text-sm font-medium uppercase tracking-wide text-center
    ${variant === 'highlight' ? 'text-white' : 'text-textSecondary'}
  `;

  const valueClasses = `
    mt-1 text-3xl font-semibold text-center
    ${variant === 'highlight' ? 'text-white' : 'text-textMain'}
  `;

  const spinnerClasses = `
    ${variant === 'highlight' ? 'text-white' : 'text-tagBlue'}
  `;

  return (
    <div className={cardClasses}>
      <div>
        <h3 className={titleClasses}>{title}</h3>
        {isLoading ? (
          <div className="mt-2 flex justify-center">
            <Spinner className={spinnerClasses} />
          </div>
        ) : (
          <p className={valueClasses}>{value}</p>
        )}
      </div>
      {description && <p className="text-sm text-textSecondary text-center">{description}</p>}
    </div>
  );
};

export default StatCard;