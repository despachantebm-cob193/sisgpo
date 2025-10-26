import React from 'react';

interface CardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  titleClassName?: string;
}

const Card: React.FC<CardProps> = ({
  title,
  subtitle,
  children,
  className = '',
  titleClassName = 'text-lg font-semibold text-gray-800',
}) => {
  return (
    <div className={`bg-white shadow-md rounded-lg overflow-hidden ${className}`}>
      <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
        <h2 className={titleClassName}>{title}</h2>
        {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
      </div>

      <div>{children}</div>
    </div>
  );
};

export default Card;
