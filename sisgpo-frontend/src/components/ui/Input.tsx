import React from 'react';

// Adicionamos a propriedade `hasError`
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', type = 'text', hasError = false, ...props }, ref) => {
    // Classe base para o input
    const baseClasses = 'w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none sm:text-sm';
    
    // Classes condicionais para o estado de erro
    const errorClasses = 'border-red-500 text-red-600 focus:ring-red-500 focus:border-red-500';
    const defaultClasses = 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500';

    return (
      <input
        type={type}
        className={`${baseClasses} ${hasError ? errorClasses : defaultClasses} ${className}`}
        ref={ref}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';

export default Input;
