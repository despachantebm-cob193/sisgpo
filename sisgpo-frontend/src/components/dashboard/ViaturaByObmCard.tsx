// Arquivo: frontend/src/components/dashboard/ViaturaByObmCard.tsx

import React from 'react';
import Card from '../ui/Card';
import Spinner from '../ui/Spinner';

interface ViaturaPorObmStat {
  id: number;
  nome: string;
  quantidade: number;
  prefixos: string[];
  crbm: string | null;
}

interface ViaturaByObmCardProps {
  data: ViaturaPorObmStat[];
  isLoading: boolean;
}

const normalizarCrbm = (value: string | null | undefined): string => {
  if (!value) return 'OUTRAS OBMS';
  return value
    .replace(/°/g, 'º')
    .replace(/CRMB/gi, 'CRBM')
    .replace(/[\s\u00A0]+/g, ' ')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, ' ');
};

const ViaturaByObmCard: React.FC<ViaturaByObmCardProps> = ({ data, isLoading }) => {
  if (isLoading) {
    return (
      <Card
        title="Viaturas por OBM"
        titleClassName="text-2xl font-bold text-indigo-700 uppercase tracking-wide"
      >
        <div className="flex justify-center items-center h-48">
          <Spinner />
        </div>
      </Card>
    );
  }

  const filteredData = Array.isArray(data) ? data.filter((obm) => obm.quantidade > 0) : [];

  if (!filteredData || filteredData.length === 0) {
    return (
      <Card
        title="Viaturas por OBM"
        titleClassName="text-2xl font-bold text-indigo-700 uppercase tracking-wide"
      >
        <div className="flex justify-center items-center h-48 text-gray-500">
          Nenhuma viatura cadastrada para as OBMs.
        </div>
      </Card>
    );
  }

  const groupedByCrbm = filteredData.reduce<Record<string, ViaturaPorObmStat[]>>((acc, obm) => {
    const crbmKey = normalizarCrbm(obm.crbm);
    if (!acc[crbmKey]) {
      acc[crbmKey] = [];
    }
    acc[crbmKey].push(obm);
    return acc;
  }, {});

  const sortedGroupKeys = Object.keys(groupedByCrbm).sort((a, b) => {
    if (a === 'OUTRAS OBMS') return 1;
    if (b === 'OUTRAS OBMS') return -1;
    return a.localeCompare(b, 'pt-BR');
  });

  return (
    <Card
      title="Viaturas por OBM"
      titleClassName="text-2xl font-bold text-indigo-700 uppercase tracking-wide"
    >
      <div className="space-y-6 p-4">
        {sortedGroupKeys.map((crbmKey) => (
          <div key={crbmKey}>
            <h3 className="text-lg font-bold text-indigo-600 uppercase tracking-wide mb-3 border-b border-indigo-100 pb-2">
              {crbmKey === 'OUTRAS OBMS' ? 'Outras OBMs' : crbmKey}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {groupedByCrbm[crbmKey]
                .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
                .map((obm) => (
                  <div
                    key={obm.id}
                    className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm flex flex-col"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-lg font-semibold text-gray-800">{obm.nome}</h4>
                      <span className="text-sm font-medium text-indigo-600 whitespace-nowrap">
                        {obm.quantidade} {obm.quantidade === 1 ? 'viatura' : 'viaturas'}
                      </span>
                    </div>

                    {obm.prefixos.length > 0 ? (
                      <div className="flex flex-wrap gap-2 mt-3 flex-grow content-start">
                        {obm.prefixos
                          .slice()
                          .sort((a, b) => a.localeCompare(b))
                          .map((prefixo) => (
                            <span
                              key={prefixo}
                              className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800"
                            >
                              {prefixo}
                            </span>
                          ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400 italic mt-3 flex-grow">
                        Sem prefixos cadastrados.
                      </p>
                    )}
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default ViaturaByObmCard;
