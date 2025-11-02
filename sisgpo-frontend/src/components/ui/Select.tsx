import React from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  hasError?: boolean;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = '', hasError = false, children, ...props }, ref) => {
    const baseClasses =
      'w-full rounded-md border px-3 py-2 shadow-sm focus:outline-none sm:text-sm bg-inputField text-textMain';
    const errorClasses = 'border-spamRed/60 text-spamRed focus:border-spamRed focus-visible:ring-spamRed';
    const defaultClasses = 'border-borderDark/60 focus:border-tagBlue focus-visible:ring-tagBlue';

    return (
      <select
        className={`${baseClasses} ${hasError ? errorClasses : defaultClasses} ${className}`}
        ref={ref}
        {...props}
      >
        {children}
      </select>
    );
  }
);

Select.displayName = 'Select';

export default Select;

