import React from 'react';

interface BaseProps {
  children: React.ReactNode;
  className?: string;
}

// Componente Card principal, com suporte opcional a título
interface CardProps extends BaseProps {
  title?: string;
}

const Card: React.FC<CardProps> = ({ children, className = '', title }) => {
  return (
    <div className={`bg-white shadow-md rounded-lg p-6 ${className}`}>
      {title && (
        <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-2">
          {title}
        </h2>
      )}
      {children}
    </div>
  );
};

// Wrappers compatíveis com a API usada nas páginas
const CardHeader: React.FC<BaseProps> = ({ children, className = '' }) => (
  <div className={`mb-4 ${className}`}>{children}</div>
);

const CardTitle: React.FC<BaseProps> = ({ children, className = '' }) => (
  <h3 className={`text-lg font-medium ${className}`}>{children}</h3>
);

const CardContent: React.FC<BaseProps> = ({ children, className = '' }) => (
  <div className={className}>{children}</div>
);

export { Card, CardHeader, CardTitle, CardContent };
export default Card;

