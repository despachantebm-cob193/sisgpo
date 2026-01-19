import React from 'react';
import { X } from 'lucide-react';

// Define as propriedades que o componente Modal aceita
// Define as propriedades que o componente Modal aceita
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl';
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, size = '5xl' }) => {
  // Se o modal não estiver aberto, não renderiza nada.
  if (!isOpen) {
    return null;
  }

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

  return (
    // Fundo semi-transparente que cobre a tela inteira
    <div className="fixed inset-0 bg-searchbar bg-opacity-50 z-[9999] flex items-center justify-center p-4">
      {/* Contêiner do modal */}
      <div className={`relative mx-auto border w-full ${sizeClasses[size]} shadow-lg rounded-md bg-cardSlate flex flex-col max-h-[90vh]`}>
        <div className="flex justify-between items-center p-5 border-b border-borderDark/60 shrink-0">
          <h3 className="text-xl font-bold">{title}</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-gray-400 hover:bg-gray-700 hover:text-white transition-colors"
            aria-label="Fechar modal"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-5 overflow-y-auto">
          {/* O conteúdo (children) do modal será renderizado aqui */}
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
