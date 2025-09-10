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
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl relative">
        {/* Cabeçalho do Modal */}
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-xl font-semibold text-gray-800">Compartilhar Dashboard</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        {/* Corpo do Modal */}
        <div className="p-6 space-y-6">
          {/* Seção do Link Público */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Link Público do Dashboard
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                readOnly
                value={publicUrl}
                className="flex-grow px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-sm"
              />
              <Button
                onClick={() => copyToClipboard(publicUrl)}
                className="!w-auto bg-gray-600 hover:bg-gray-700"
                title="Copiar Link"
              >
                <Copy size={16} />
              </Button>
            </div>
          </div>

          {/* Seção da Mensagem Formatada */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mensagem para Compartilhamento
            </label>
            <div className="relative">
              <textarea
                readOnly
                value={shareMessage}
                rows={8}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-800 whitespace-pre-wrap"
              />
              <Button
                onClick={() => copyToClipboard(shareMessage)}
                className="absolute top-2 right-2 !w-auto bg-gray-600 hover:bg-gray-700"
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
