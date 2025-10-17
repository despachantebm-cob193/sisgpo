import React from 'react';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'danger' | 'default'; // Adicionando a propriedade 'variant'
};

const Button: React.FC<ButtonProps> = ({ children, className, variant, ...props }) => {
  const baseClasses =
    'py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-opacity-50';

  const variantClasses = {
    default: 'bg-blue-500 text-white hover:bg-blue-600 focus:ring-blue-500',
    danger: 'bg-red-500 text-white hover:bg-red-600 focus:ring-red-500',
  };

  const combinedClasses = `${baseClasses} ${
    variant ? variantClasses[variant] : variantClasses.default
  } ${className}`;

  return (
    <button className={combinedClasses} {...props}>
      {children}
    </button>
  );
};

export default Button;