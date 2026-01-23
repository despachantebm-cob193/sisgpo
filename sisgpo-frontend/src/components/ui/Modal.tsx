import React, { useEffect, useState } from 'react';
import { X, Hexagon } from 'lucide-react';
import { createPortal } from 'react-dom';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl';
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, size = '5xl' }) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      setTimeout(() => setIsAnimating(true), 10);
    } else {
      setIsAnimating(false);
      const timer = setTimeout(() => setIsVisible(false), 300); // 300ms transition
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isVisible) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    '5xl': 'max-w-5xl',
  };

  return createPortal(
    <div className={`fixed inset-0 z-[9999] flex items-center justify-center p-4 transition-opacity duration-300 ${isAnimating ? 'opacity-100' : 'opacity-0'}`}>

      {/* Backdrop with Grid Pattern */}
      <div
        className="absolute inset-0 bg-[#000000]/80 backdrop-blur-sm"
        onClick={onClose}
      >
        <div className="absolute inset-0 bg-[linear-gradient(rgba(34,211,238,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,0.03)_1px,transparent_1px)] bg-[size:40px_40px] opacity-20" />
      </div>

      {/* Modal Container */}
      <div
        className={`
          relative w-full ${sizeClasses[size]} 
          bg-[#0a0d14]/95 backdrop-blur-xl 
          border border-white/10 rounded-xl 
          shadow-[0_0_50px_rgba(0,0,0,0.8),0_0_20px_rgba(34,211,238,0.1)] 
          flex flex-col max-h-[90vh] 
          transform transition-all duration-300 cubic-bezier(0.34, 1.56, 0.64, 1)
          ${isAnimating ? 'scale-100 translate-y-0' : 'scale-95 translate-y-8'}
        `}
      >
        {/* Decorative Top Border */}
        <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />

        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-white/5 shrink-0 relative overflow-hidden">
          {/* Tech Hexagon Icon */}
          <div className="absolute -left-6 -top-6 text-cyan-500/5 rotate-12">
            <Hexagon size={100} />
          </div>

          <div className="flex items-center gap-3 relative z-10">
            <div className="w-1 h-5 bg-cyan-500 rounded-full shadow-[0_0_8px_cyan]" />
            <h3 className="text-lg font-bold text-white uppercase tracking-widest font-mono text-shadow-glow">
              {title}
            </h3>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:bg-white/5 hover:text-white hover:border-white/20 border border-transparent transition-all duration-200 relative z-10 group"
            aria-label="Fechar modal"
          >
            <X size={20} className="group-hover:rotate-90 transition-transform duration-300" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto custom-scrollbar relative z-10">
          {children}
        </div>

        {/* Decorative Corners */}
        <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-cyan-500/30 rounded-bl" />
        <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-cyan-500/30 rounded-br" />
      </div>
    </div>,
    document.body
  );
};

export default Modal;
