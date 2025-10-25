import React from 'react';
import Card from '../ui/Card';
import Spinner from '../ui/Spinner';

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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.map((obm) => (
          <div key={obm.id} className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-lg font-semibold text-gray-800">{obm.nome}</h4>
              <span className="text-sm font-medium text-indigo-600">{obm.quantidade} viaturas</span>
            </div>
            {obm.prefixos.length > 0 ? (
              <p className="text-sm text-gray-600 leading-relaxed break-words">
                {obm.prefixos.join('; ')}
              </p>
            ) : (
              <p className="text-sm text-gray-400 italic">Sem prefixos cadastrados.</p>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
};

export default ViaturaByObmCard;
