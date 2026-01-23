import React from 'react';
import { ChevronDown } from 'lucide-react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  hasError?: boolean;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = '', hasError = false, children, ...props }, ref) => {
    // Sci-Fi Base Classes
    const baseClasses =
      'w-full appearance-none rounded-md border px-3 py-2 shadow-[0_2px_10px_rgba(0,0,0,0.3)] focus:outline-none sm:text-sm bg-[#0f141e] text-slate-200 transition-all duration-300 font-mono tracking-wide cursor-pointer';

    const errorClasses = 'border-red-500/50 text-red-400 focus:border-red-500 focus:shadow-[0_0_15px_rgba(239,68,68,0.4)]';

    // Default: Dark border, Cyan focus
    const defaultClasses = 'border-slate-700/50 hover:border-cyan-500/30 focus:border-cyan-500 focus:shadow-[0_0_15px_rgba(34,211,238,0.3)]';

    return (
      <div className="relative w-full group">
        <select
          className={`${baseClasses} ${hasError ? errorClasses : defaultClasses} ${className}`}
          ref={ref}
          {...props}
        >
          {children}
        </select>

        {/* Custom Chevron */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 group-hover:text-cyan-400 transition-colors duration-300">
          <ChevronDown className="w-4 h-4" />
        </div>

        {/* Focus Glow Line */}
        <div className="absolute bottom-0 left-1 right-1 h-[1px] bg-cyan-500 scale-x-0 group-focus-within:scale-x-100 transition-transform duration-500 origin-center opacity-50" />
      </div>
    );
  }
);

Select.displayName = 'Select';

export default Select;
