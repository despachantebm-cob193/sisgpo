import React from 'react';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'danger' | 'default' | 'success' | 'primary';
};

const Button: React.FC<ButtonProps> = ({ children, className, variant, ...props }) => {
  const baseClasses =
    'rounded px-4 py-2 font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background';

  const variantClasses = {
    default: 'bg-tagBlue text-background hover:bg-tagBlue/80 focus-visible:ring-tagBlue',
    danger: "bg-spamRed text-white hover:bg-spamRed/80 focus-visible:ring-spamRed",
    "success": "bg-cardGreen text-textMain hover:bg-cardGreen/80 focus-visible:ring-cardGreen",
    "warning": "bg-premiumOrange text-background hover:bg-premiumOrange/80 focus-visible:ring-premiumOrange",
    "primary": "bg-tagBlue text-white hover:bg-tagBlue/80 focus-visible:ring-tagBlue",
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


