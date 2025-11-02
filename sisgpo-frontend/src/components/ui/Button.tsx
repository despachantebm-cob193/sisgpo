import React from 'react';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'danger' | 'default'; // Adicionando a propriedade 'variant'
};

const Button: React.FC<ButtonProps> = ({ children, className, variant, ...props }) => {
  const baseClasses =
    'rounded px-4 py-2 font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background';

  const variantClasses = {
    default: 'bg-tagBlue text-background hover:bg-tagBlue/80 focus-visible:ring-tagBlue',
    danger: 'bg-spamRed text-textMain hover:bg-spamRed/80 focus-visible:ring-spamRed',
  };

  const combinedClasses = `${baseClasses} ${
    variant ? variantClasses[variant] : variantClasses.default
  }${className ? ` ${className}` : ''}`;

  return (
    <button className={combinedClasses} {...props}>
      {children}
    </button>
  );
};

export default Button;


