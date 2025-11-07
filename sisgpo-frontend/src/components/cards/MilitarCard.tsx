import React from 'react';
import type { Militar } from '@/types/entities';
import { Edit, Trash2, ChevronDown } from 'lucide-react';

interface MilitarCardProps {
  militar: Militar;
  isExpanded: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const MilitarCard: React.FC<MilitarCardProps> = ({
  militar,
  isExpanded,
  onToggle,
  onEdit,
  onDelete,
}) => {
  return (
    <div className="surface-card transition-all">
      <div className="flex cursor-pointer items-center justify-between p-4" onClick={onToggle}>
        <div className="flex-1">
          <p className="font-semibold text-textMain">{militar.nome_completo}</p>
          <p className="text-sm text-textSecondary">
            {militar.posto_graduacao} - Mat. {militar.matricula}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-4 md:mt-0 md:justify-end">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="text-tagBlue hover:text-tagBlue/80"
            >
              <Edit size={18} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="text-spamRed hover:text-spamRed/80"
            >
              <Trash2 size={18} />
            </button>
          </div>
          <ChevronDown
            size={20}
            className={`transform text-textSecondary transition-transform ${
              isExpanded ? 'rotate-180' : ''
            }`}
          />
        </div>
      </div>

      {isExpanded && (
        <div className="border-t border-borderDark/60 p-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase text-textSecondary">Nome de Guerra</p>
              <p className="text-sm text-textMain">{militar.nome_guerra || 'Nao informado'}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-textSecondary">Lotacao (OBM)</p>
              <p className="text-sm text-textMain">{militar.obm_nome || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-textSecondary">Status</p>
              <p className="text-sm text-textMain">
                <span
                  className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold leading-5 ${
                    militar.ativo ? 'bg-cardGreen text-textMain' : 'bg-spamRed text-textMain'
                  }`}
                >
                  {militar.ativo ? 'Ativo' : 'Inativo'}
                </span>
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-textSecondary">Telefone</p>
              <p className="text-sm text-textMain">{militar.telefone || 'Nao informado'}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MilitarCard;
