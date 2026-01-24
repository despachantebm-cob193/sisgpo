import React from 'react';
import Spinner from '../ui/Spinner';

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  isLoading?: boolean;
  variant?: 'default' | 'highlight' | 'highlight-secondary' | 'transparent';
}

const StatCard: React.FC<StatCardProps> = ({ title, value, description, isLoading, variant = 'default' }) => {
  // Base Container - Metallic/Dark Industrial
  let containerClasses = `relative overflow-hidden rounded-xl transition-all duration-300 group hover:translate-y-[-2px] hover:shadow-[0_10px_30px_rgba(34,211,238,0.1)]`;

  // Inner Content
  let contentClasses = `relative z-10 flex flex-col items-center justify-center p-6 bg-[#0e121b]/90 backdrop-blur-sm border-t border-white/5 h-full`;

  // Dynamic Accents based on variant
  let accentColor = 'cyan'; // default
  let valueColorClass = 'text-cyan-400';
  let titleColorClass = 'text-slate-400';

  if (variant === 'highlight') {
    // Blue/Cyan Theme
    containerClasses += ` bg-gradient-to-br from-cyan-900/20 to-[#0b0f1a] border border-cyan-500/30`;
    valueColorClass = 'text-cyan-300 drop-shadow-[0_0_8px_rgba(34,211,238,0.6)]';
    accentColor = 'cyan';
  } else if (variant === 'highlight-secondary') {
    // Emerald/Green Theme (Success/Good Status)
    containerClasses += ` bg-gradient-to-br from-emerald-900/20 to-[#0b0f1a] border border-emerald-500/30`;
    valueColorClass = 'text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.6)]';
    accentColor = 'emerald';
  } else {
    // Default Metallic
    containerClasses += ` bg-[#0e121b] border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]`;
    valueColorClass = 'text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.3)]';
  }

  return (
    <div className={containerClasses}>
      {/* Top Metallic Highlight Line */}
      <div className={`absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-${accentColor}-500/50 to-transparent opacity-50`} />

      {/* Corner Accents (Sci-Fi brackets) */}
      <div className={`absolute top-0 left-0 w-2 h-2 border-t border-l border-${accentColor}-500/30 rounded-tl-sm`} />
      <div className={`absolute top-0 right-0 w-2 h-2 border-t border-r border-${accentColor}-500/30 rounded-tr-sm`} />
      <div className={`absolute bottom-0 left-0 w-2 h-2 border-b border-l border-${accentColor}-500/30 rounded-bl-sm`} />
      <div className={`absolute bottom-0 right-0 w-2 h-2 border-b border-r border-${accentColor}-500/30 rounded-br-sm`} />

      {/* Content */}
      <div className="p-5 flex flex-col items-center justify-between h-full relative z-10">
        <h3 className={`text-[9px] xs:text-[10px] uppercase tracking-[0.1em] xs:tracking-[0.25em] font-bold mb-3 ${titleColorClass} text-center whitespace-normal`}>
          {title}
        </h3>

        {/* Digital Readout Box */}
        <div className="bg-[#050608] rounded border border-white/5 w-full py-3 flex items-center justify-center shadow-inner relative overflow-hidden">
          {/* Scanline effect */}
          <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_50%,rgba(0,0,0,0.5)_50%)] bg-[size:100%_4px] opacity-20 pointer-events-none" />

          {isLoading ? (
            <Spinner className={`w-6 h-6 text-${accentColor}-500`} />
          ) : (
            <span className={`text-3xl md:text-4xl font-mono font-bold tracking-tighter ${valueColorClass}`}>
              {value}
            </span>
          )}
        </div>

        {description && (
          <p className="text-xs text-slate-500 mt-3 text-center font-mono tracking-tight">
            {description}
          </p>
        )}
      </div>

      {/* Background Glow */}
      <div className={`absolute -bottom-10 inset-x-0 h-20 bg-${accentColor}-500/5 blur-xl pointer-events-none`} />
    </div>
  );
};

export default StatCard;