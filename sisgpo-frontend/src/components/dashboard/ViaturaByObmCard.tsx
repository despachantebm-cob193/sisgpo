// Arquivo: frontend/src/components/dashboard/ViaturaByObmCard.tsx (Novo Arquivo)

import React from 'react';
import Spinner from '@/components/ui/Spinner';

// Interface para os dados que virão da nova API
interface ViaturaPorObmStat {
  id: number;
  nome: string;
  quantidade: number;
  prefixos: string[];
}

interface ViaturaByObmCardProps {
  data: ViaturaPorObmStat[];
  isLoading: boolean;
}

const ViaturaByObmCard: React.FC<ViaturaByObmCardProps> = ({ data, isLoading }) => {
  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md flex justify-center items-center min-h-[400px]">
        <Spinner className="h-12 w-12" />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md flex justify-center items-center min-h-[400px]">
        <p className="text-gray-500">Nenhum dado de OBM encontrado.</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-xl font-semibold text-gray-800 mb-6 text-center">
        Viaturas por Unidade
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {data.map((obm) => (
          <div key={obm.id} className="border border-gray-200 rounded-lg p-3">
            <h4 className="font-bold text-center border-b pb-2 mb-2">
              {obm.nome} ({obm.quantidade})
            </h4>
            {obm.prefixos.length > 0 ? (
              <p className="text-xs text-gray-600 text-center" style={{ wordBreak: 'break-word' }}>
                {obm.prefixos.join('; ')}
              </p>
            ) : (
              <p className="text-xs text-gray-400 text-center italic">
                Nenhuma viatura
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ViaturaByObmCard;
