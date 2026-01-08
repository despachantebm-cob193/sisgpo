// Arquivo: frontend/src/components/dashboard/ViaturaByObmTable.tsx

import React from 'react';
import Card from '../ui/Card';
import Spinner from '../ui/Spinner';

interface ViaturaPorObmStat {
  id: number | null;
  nome: string;
  quantidade: number;
  prefixos: string[];
  crbm?: string | null;
  abreviatura?: string | null;
}

interface ViaturaByObmTableProps {
  data: ViaturaPorObmStat[];
  isLoading: boolean;
  empenhadasViaturas: Set<string>;
}

const normalizarCrbm = (value: string | null | undefined): string => {
  const trimmedValue = value?.trim();
  if (!trimmedValue) return 'OUTRAS OBMS';

  // Se for apenas número ("1", "2"), transforma em "1º CRBM"
  if (/^\d+$/.test(trimmedValue)) {
    return `${trimmedValue}º CRBM`;
  }

  return trimmedValue
    .replace(/°/g, 'º')
    .replace(/CRMB/gi, 'CRBM')
    .toUpperCase()
    .replace(/\s+/g, ' ');
};

const ViaturaByObmTable: React.FC<ViaturaByObmTableProps> = ({ data, isLoading, empenhadasViaturas }) => {
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
      <div className="space-y-8 px-4 pt-4 pb-4">
        {sortedGroupKeys.map((crbmKey) => {
          const obmsInGroup = groupedByCrbm[crbmKey].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
          return (
            <div key={crbmKey} className="space-y-3">
              <h3 className="text-xl md:text-lg font-bold md:font-semibold text-tagBlue bg-cardSlate md:bg-transparent p-3 md:p-0 md:pl-2 rounded-lg md:rounded-none border-b-2 border-tagBlue md:border-b-0 md:border-l-4 md:border-tagBlue/50 text-center md:text-left shadow-sm md:shadow-none">
                {crbmKey === 'OUTRAS OBMS' ? 'Outras OBMs' : crbmKey}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {obmsInGroup.map((obm) => (
                  <div
                    key={obm.id ?? obm.nome}
                    className="relative flex flex-col rounded-lg border border-borderDark/60 bg-cardSlate/40 p-4 shadow-sm hover:border-tagBlue/30 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="text-base font-semibold text-textMain">{obm.abreviatura || obm.nome}</h4>
                      <div className="flex flex-col items-end">
                        <span className="text-2xl font-bold text-white">{obm.quantidade}</span>
                        <span className="text-[10px] text-textSecondary uppercase tracking-wider">Viaturas</span>
                      </div>
                    </div>

                    <div className="mt-auto pt-2 border-t border-borderDark/30">
                      <div className="flex flex-wrap gap-2">
                        {obm.prefixos
                          .slice()
                          .sort((a, b) => a.localeCompare(b))
                          .map((prefixo, i) => {
                            const isEmpenhada = empenhadasViaturas.has(prefixo.toUpperCase());
                            return (
                              <span
                                key={`${prefixo}-${i}`}
                                className={`px-2 py-0.5 rounded text-xs font-medium ${isEmpenhada ? 'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/40' : 'bg-background/80 text-textSecondary border border-borderDark/50'}`}
                              >
                                {prefixo}
                              </span>
                            );
                          })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};

export default ViaturaByObmTable;

