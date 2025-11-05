import React from 'react';
import Modal from './Modal'; // Reutiliza o componente de Modal base
import Button from './Button';

// Define as propriedades para o modal de confirmação
interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void; // Renomeado de onCancel para onClose para consistência
  onConfirm: () => void;
  title: string;
  message: string;
  isLoading?: boolean;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  isLoading = false,
}) => {
  // Se não estiver aberto, não renderiza nada
  if (!isOpen) {
    return null;
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div>
        <p className="text-textSecondary mb-6">{message}</p>
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            onClick={onClose} // O botão "Cancelar" agora chama onClose
            variant="danger"
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            variant="danger" // Usando a prop 'variant' para o estilo de perigo
            disabled={isLoading}
          >
            {isLoading ? 'Excluindo...' : 'Confirmar'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmationModal;
