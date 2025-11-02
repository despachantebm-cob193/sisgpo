// Arquivo: frontend/src/components/ui/ShareModal.tsx (NOVO ARQUIVO)

import React from 'react';
import toast from 'react-hot-toast';
import { Copy, X } from 'lucide-react';
import Button from './Button';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  publicUrl: string;
  shareMessage: string;
}

const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, publicUrl, shareMessage }) => {
  if (!isOpen) {
    return null;
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success('Copiado para a área de transferência!');
    }).catch(() => {
      toast.error('Falha ao copiar.');
    });
  };

  return (
    // Overlay do modal
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4">
      <div className="relative w-full max-w-2xl rounded-lg border border-borderDark/60 bg-cardSlate shadow-xl">
        {/* Cabeçalho do Modal */}
        <div className="flex items-center justify-between border-b border-borderDark/60 p-4">
          <h3 className="text-xl font-semibold text-textMain">Compartilhar Dashboard</h3>
          <button onClick={onClose} className="text-textSecondary hover:text-textSecondary">
            <X size={24} />
          </button>
        </div>

        {/* Corpo do Modal */}
        <div className="p-6 space-y-6">
          {/* Seção do Link Público */}
          <div>
            <label className="block text-sm font-medium text-textSecondary mb-1">
              Link Público do Dashboard
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                readOnly
                value={publicUrl}
                className="flex-grow px-3 py-2 bg-background border border-borderDark/60 rounded-md text-sm"
              />
              <Button
                onClick={() => copyToClipboard(publicUrl)}
                className="!w-auto bg-tagBlue hover:bg-tagBlue/80"
                title="Copiar Link"
              >
                <Copy size={16} />
              </Button>
            </div>
          </div>

          {/* Seção da Mensagem Formatada */}
          <div>
            <label className="block text-sm font-medium text-textSecondary mb-1">
              Mensagem para Compartilhamento
            </label>
            <div className="relative">
              <textarea
                readOnly
                value={shareMessage}
                rows={8}
                className="w-full p-3 bg-searchbar border border-borderDark/60 rounded-md text-sm text-textMain whitespace-pre-wrap"
              />
              <Button
                onClick={() => copyToClipboard(shareMessage)}
                className="absolute top-2 right-2 !w-auto bg-tagBlue hover:bg-tagBlue/80"
                title="Copiar Mensagem"
              >
                <Copy size={16} />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;

