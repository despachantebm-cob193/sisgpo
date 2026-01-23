import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', type = 'text', hasError = false, startIcon, endIcon, ...props }, ref) => {
    // Sci-Fi Base Classes
    // Bg: Dark blue/gray (almost black)
    // Border: Subtle white/10
    // Text: Mono or clean sans
    const baseClasses =
      'w-full rounded-md border py-2.5 shadow-[0_2px_10px_rgba(0,0,0,0.3)] focus:outline-none sm:text-sm bg-[#0f141e] text-slate-200 placeholder:text-slate-500/70 transition-all duration-300 font-mono tracking-wide';

    // Padding adjust based on icons
    const paddingLeft = startIcon ? 'pl-10' : 'px-3';
    const paddingRight = endIcon ? 'pr-10' : 'px-3';

    // Sci-Fi Error State
    const errorClasses =
      'border-red-500/50 text-red-400 focus:border-red-500 focus:shadow-[0_0_15px_rgba(239,68,68,0.4)]';

    // Sci-Fi Default State
    // Border: Subtle
    // Focus: Cyan Neon Glow
    const defaultClasses =
      'border-slate-700/50 hover:border-cyan-500/30 focus:border-cyan-500 focus:shadow-[0_0_15px_rgba(34,211,238,0.3)]';

    return (
      <div className="relative w-full group">
        {startIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-cyan-400 pointer-events-none transition-colors duration-300">
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
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-cyan-400 flex items-center transition-colors duration-300">
            {endIcon}
          </div>
        )}

        {/* Animated Bottom Line for Focus Effect (Optional subtle detail) */}
        <div className="absolute bottom-0 left-1 right-1 h-[1px] bg-cyan-500 scale-x-0 group-focus-within:scale-x-100 transition-transform duration-500 origin-center opacity-50" />
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
