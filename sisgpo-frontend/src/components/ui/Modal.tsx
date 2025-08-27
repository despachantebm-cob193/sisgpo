import React from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  // Se o modal não estiver aberto, não renderiza nada.
  if (!isOpen) {
    return null;
  }

  return (
    // Fundo semi-transparente que cobre a tela inteira
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
      {/* Contêiner do modal */}
      <div className="relative mx-auto p-5 border w-full max-w-lg shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center pb-3 border-b">
          <h3 className="text-2xl font-bold">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-3xl font-bold"
            aria-label="Fechar"
          >
            &times;
          </button>
        </div>
        <div className="mt-5">
          {/* O conteúdo do formulário será renderizado aqui */}
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
