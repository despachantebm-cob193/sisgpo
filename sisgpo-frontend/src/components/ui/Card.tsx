import React from 'react';

interface CardProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  titleClassName?: string;
  style?: React.CSSProperties;
}

const Card: React.FC<CardProps> = ({
  title,
  subtitle,
  children,
  className = '',
  titleClassName = 'text-lg font-semibold text-textMain',
  style,
}) => {
  return (
    <div className={`surface-card overflow-hidden ${className ?? ''}`} style={style}>
      {title && (
        <div className="border-borderDark/60 border-b px-4 py-5 sm:px-6">
          <h2 className={titleClassName}>{title}</h2>
          {subtitle && <p className="mt-1 text-sm text-textSecondary">{subtitle}</p>}
        </div>
      )}

      <div>{children}</div>
    </div>
  );
};

export default Card;

