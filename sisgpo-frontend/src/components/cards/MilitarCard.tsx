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
    <div className="rounded-lg border border-gray-200 bg-white shadow-sm transition-all">
      <div
        className="flex cursor-pointer items-center justify-between p-4"
        onClick={onToggle}
      >
        <div className="flex-1">
          <p className="font-semibold text-gray-800">{militar.nome_completo}</p>
          <p className="text-sm text-gray-500">
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
              className="text-indigo-600 hover:text-indigo-900"
            >
              <Edit size={18} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="text-red-600 hover:text-red-900"
            >
              <Trash2 size={18} />
            </button>
          </div>
          <ChevronDown
            size={20}
            className={`transform text-gray-500 transition-transform ${
              isExpanded ? 'rotate-180' : ''
            }`}
          />
        </div>
      </div>

      {isExpanded && (
        <div className="border-t border-gray-200 p-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase text-gray-500">
                Nome de Guerra
              </p>
              <p className="text-sm text-gray-900">
                {militar.nome_guerra || 'Não informado'}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-gray-500">
                Lotação (OBM)
              </p>
              <p className="text-sm text-gray-900">
                {militar.obm_nome || 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-gray-500">
                Status
              </p>
              <p className="text-sm text-gray-900">
                <span
                  className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                    militar.ativo
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {militar.ativo ? 'Ativo' : 'Inativo'}
                </span>
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-gray-500">
                Telefone
              </p>
              <p className="text-sm text-gray-900">
                {militar.telefone || 'Não informado'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MilitarCard;
