// Arquivo: frontend/src/components/dashboard/ViaturaByObmCard.tsx

import React from 'react';
import Card from '../ui/Card';
import Spinner from '../ui/Spinner';

interface ViaturaPorObmStat {
  id: number;
  nome: string;
  quantidade: number; // Total de viaturas (ex: 3)
  prefixos: string[]; // Lista de prefixos (ex: ["ABTS-23", "ABT-32"])
}

interface ViaturaByObmCardProps {
  data: ViaturaPorObmStat[];
  isLoading: boolean;
}

const ViaturaByObmCard: React.FC<ViaturaByObmCardProps> = ({ data, isLoading }) => {
  if (isLoading) {
    return (
      <Card title="Viaturas por OBM">
        <div className="flex justify-center items-center h-48">
          <Spinner />
        </div>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card title="Viaturas por OBM">
        <div className="flex justify-center items-center h-48 text-gray-500">
          Nenhuma viatura cadastrada para as OBMs.
        </div>
      </Card>
    );
  }

  return (
    <Card title="Viaturas por OBM">
      {/* O padding 'p-4' do Card original foi removido, então o adicionamos aqui */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
        {data.map((obm) => (
          <div key={obm.id} className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-lg font-semibold text-gray-800">{obm.nome}</h4>
              
              {/* Requisito: Total de viaturas (ex: "3 viaturas") */}
              <span className="text-sm font-medium text-indigo-600 whitespace-nowrap">
                {obm.quantidade} {obm.quantidade === 1 ? 'viatura' : 'viaturas'}
              </span>
            </div>

            {/* ▼▼▼ INÍCIO DA MODIFICAÇÃO ▼▼▼ */}
            {obm.prefixos.length > 0 ? (
              // Requisito: Listar prefixos como badges individuais
              <div className="flex flex-wrap gap-2 mt-3 flex-grow content-start">
                {obm.prefixos.map((prefixo) => (
                  <span 
                    key={prefixo} 
                    // Nota: Não é possível colorir por status (ativo/inoperante)
                    // pois a API não envia essa informação neste endpoint.
                    className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800"
                  >
                    {prefixo}
                  </span>
                ))}
              </div>
            ) : (
              // Requisito: Mensagem de "sem prefixos"
              <p className="text-sm text-gray-400 italic mt-3 flex-grow">
                Sem prefixos cadastrados.
              </p>
            )}
            {/* ▲▲▲ FIM DA MODIFICAÇÃO ▲▲▲ */}
          </div>
        ))}
      </div>
    </Card>
  );
};

export default ViaturaByObmCard;