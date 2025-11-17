import React from 'react';
import Spinner from '../ui/Spinner';

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  isLoading?: boolean;
  variant?: 'default' | 'highlight' | 'highlight-secondary' | 'transparent';
}

const StatCard: React.FC<StatCardProps> = ({ title, value, description, isLoading, variant = 'default' }) => {
  let cardClasses = `flex flex-col justify-between gap-3 p-6 rounded-lg shadow-sm`;
  let titleClasses = `text-sm font-medium uppercase tracking-wide text-center`;
  let valueClasses = `mt-1 text-3xl font-semibold text-center`;
  let spinnerClasses = ``;

  if (variant === 'highlight') {
    cardClasses += ' bg-tagBlue/20 border border-tagBlue text-white';
    titleClasses += ' text-white';
    valueClasses += ' text-white';
    spinnerClasses += ' text-white';
  } else if (variant === 'highlight-secondary') {
    cardClasses += ' bg-emerald-500/20 border border-emerald-500 text-white';
    titleClasses += ' text-white';
    valueClasses += ' text-white';
    spinnerClasses += ' text-white';
  } else if (variant === 'transparent') {
    cardClasses += ' bg-white/10 backdrop-blur-[2px] border border-white/20 text-white';
  }
  else { // default
    cardClasses += ' bg-cardSlate border border-borderDark/60';
    titleClasses += ' text-textSecondary';
    valueClasses += ' text-textMain';
    spinnerClasses += ' text-tagBlue';
  }

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