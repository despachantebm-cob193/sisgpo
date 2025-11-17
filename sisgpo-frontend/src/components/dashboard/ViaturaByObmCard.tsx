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
  empenhadasViaturas: Set<string>;
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

const ViaturaByObmCard: React.FC<ViaturaByObmCardProps> = ({ data, isLoading, empenhadasViaturas }) => {
  console.log('ViaturaByObmCard: empenhadasViaturas prop received:', empenhadasViaturas); // Debug log
  if (isLoading) {
    return (
      <Card
        title="Viaturas por OBM"
        titleClassName="text-2xl font-bold text-tagBlue uppercase tracking-wide"
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
        titleClassName="text-2xl font-bold text-tagBlue uppercase tracking-wide"
      >
        <div className="flex justify-center items-center h-48 text-textSecondary">
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

  const totalViaturas = filteredData.reduce((acc, obm) => acc + obm.quantidade, 0);

  return (
    <Card
      title="Viaturas por OBM"
      subtitle={`Total: ${totalViaturas} viaturas`}
      titleClassName="text-2xl font-bold text-brightBlue uppercase tracking-wide"
    >
      <div className="space-y-6 p-4">
        {sortedGroupKeys.map((crbmKey) => (
          <div key={crbmKey}>
            <h3 className="text-lg font-bold text-brightBlue uppercase tracking-wide mb-3 border-b border-tagBlue/20 pb-2">
              {crbmKey === 'OUTRAS OBMS' ? 'Outras OBMs' : crbmKey}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {groupedByCrbm[crbmKey]
                .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
                .map((obm) => (
                  <div
                    key={obm.id ?? obm.nome}
                    className="border border-borderDark/60 rounded-lg p-4 bg-cardSlate shadow-sm flex flex-col"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-lg font-semibold text-textMain">{obm.nome}</h4>
                      <span className="text-sm font-medium bg-cardSlate text-brightYellow whitespace-nowrap px-2 py-1 rounded">
                        {obm.quantidade} {obm.quantidade === 1 ? 'viatura' : 'viaturas'}
                      </span>
                    </div>

                    {obm.prefixos.length > 0 ? (
                      <div className="flex flex-wrap gap-2 mt-3 flex-grow content-start">
                        {obm.prefixos
                          .slice()
                          .sort((a, b) => a.localeCompare(b))
                          .map((prefixo, index) => {
                            const isEmpenhada = empenhadasViaturas.has(prefixo.toUpperCase());
                            console.log(`ViaturaByObmCard: Checking prefixo '${prefixo}', isEmpenhada: ${isEmpenhada}`); // Debug log
                            return (
                              <span
                                key={`${prefixo}-${index}`}
                                className={`px-2 py-1 rounded text-xs font-medium ${isEmpenhada ? 'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/40' : 'bg-background text-textMain'}`}
                              >
                                {prefixo}
                              </span>
                            );
                          })}
                      </div>
                    ) : (
                      <p className="text-sm text-textSecondary italic mt-3 flex-grow">
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

