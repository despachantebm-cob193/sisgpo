import React from 'react';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'danger' | 'default' | 'success' | 'primary' | 'warning' | 'secondary' | 'icon';
  size?: 'sm' | 'md' | 'lg';
};

const Button: React.FC<ButtonProps> = ({ children, className, variant = 'default', size = 'md', ...props }) => {
  const baseClasses =
    'inline-flex items-center justify-center rounded-md font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background';

  const variantClasses = {
    default: 'bg-tagBlue text-background hover:bg-tagBlue/80 focus-visible:ring-tagBlue',
    primary: 'bg-tagBlue text-white hover:bg-tagBlue/80 focus-visible:ring-tagBlue',
    secondary: 'bg-gray-600 text-white hover:bg-gray-500 focus-visible:ring-gray-500',
    danger: 'bg-spamRed text-white hover:bg-spamRed/80 focus-visible:ring-spamRed',
    success: 'bg-cardGreen text-textMain hover:bg-cardGreen/80 focus-visible:ring-cardGreen',
    warning: 'bg-premiumOrange text-background hover:bg-premiumOrange/80 focus-visible:ring-premiumOrange',
    icon: 'bg-transparent hover:bg-gray-700/50 focus-visible:ring-gray-500 disabled:hover:bg-transparent',
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-5 py-2.5 text-base',
  };

  const iconSizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-9 w-9',
    lg: 'h-10 w-10',
  };

  const combinedClasses = `${baseClasses} ${
    variant === 'icon' ? iconSizeClasses[size] : sizeClasses[size]
  } ${variantClasses[variant]} ${className || ''}`;

  return (
    <button className={combinedClasses.trim()} {...props}>
      {children}
    </button>
  );
};

export default Button;


