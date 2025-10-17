import React from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  hasError?: boolean;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = '', hasError = false, children, ...props }, ref) => {
    const baseClasses =
      'w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none sm:text-sm bg-white';
    const errorClasses = 'border-red-500 text-red-600 focus:ring-red-500 focus:border-red-500';
    const defaultClasses = 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500';

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
