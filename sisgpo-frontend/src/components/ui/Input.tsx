import React from 'react';

// Adicionamos a propriedade `hasError`
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', type = 'text', hasError = false, ...props }, ref) => {
    // Classe base para o input
    const baseClasses =
      'w-full rounded-md border px-3 py-2 shadow-sm focus:outline-none sm:text-sm bg-inputField text-textMain placeholder:text-textSecondary/70 transition-colors';

    const errorClasses =
      'border-spamRed/60 text-spamRed focus:border-spamRed focus-visible:ring-spamRed';
    const defaultClasses =
      'border-borderDark/60 focus:border-tagBlue focus-visible:ring-tagBlue';

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

