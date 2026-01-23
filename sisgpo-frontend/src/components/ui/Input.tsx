import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', type = 'text', hasError = false, startIcon, endIcon, ...props }, ref) => {
    // Classes base
    const baseClasses =
      'w-full rounded-md border py-2.5 shadow-sm focus:outline-none sm:text-sm bg-inputField text-textMain placeholder:text-textSecondary/70 transition-all duration-200';

    // Padding adjust based on icons
    const paddingLeft = startIcon ? 'pl-10' : 'px-3';
    const paddingRight = endIcon ? 'pr-10' : 'px-3';

    const errorClasses =
      'border-spamRed/60 text-spamRed focus:border-spamRed focus-visible:ring-spamRed';
    const defaultClasses =
      'border-borderDark/60 focus:border-tagBlue focus-ring focus:ring-tagBlue/20'; // Added subtle ring

    return (
      <div className="relative w-full">
        {startIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-textSecondary pointer-events-none">
            {startIcon}
          </div>
        )}
        <input
          type={type}
          className={`${baseClasses} ${hasError ? errorClasses : defaultClasses} ${paddingLeft} ${paddingRight} ${className}`}
          ref={ref}
          {...props}
        />
        {endIcon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-textSecondary flex items-center">
            {endIcon}
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;

