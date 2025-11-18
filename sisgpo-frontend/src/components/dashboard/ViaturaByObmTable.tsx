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
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-borderDark/60">
          <thead className="bg-searchbar">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-textSecondary uppercase tracking-wider">CRBM</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-textSecondary uppercase tracking-wider">OBM</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-textSecondary uppercase tracking-wider">Qtd. Viaturas</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-textSecondary uppercase tracking-wider">Prefixos</th>
            </tr>
          </thead>
          <tbody className="bg-cardSlate divide-y divide-borderDark/60">
            {sortedGroupKeys.map((crbmKey) => {
              const obmsInGroup = groupedByCrbm[crbmKey].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
              return (
                <React.Fragment key={crbmKey}>
                  {obmsInGroup.map((obm, index) => (
                    <tr key={obm.id ?? obm.nome}>
                      {index === 0 && (
                        <td rowSpan={obmsInGroup.length} className="px-6 py-4 align-top whitespace-nowrap text-sm font-medium text-brightBlue border-r border-borderDark/60">
                          {crbmKey === 'OUTRAS OBMS' ? 'Outras OBMs' : crbmKey}
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-textMain">{obm.abreviatura || obm.nome}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-brightYellow">{obm.quantidade}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-2">
                          {obm.prefixos
                            .slice()
                            .sort((a, b) => a.localeCompare(b))
                            .map((prefixo, i) => {
                              const isEmpenhada = empenhadasViaturas.has(prefixo.toUpperCase());
                              return (
                                <span
                                  key={`${prefixo}-${i}`}
                                  className={`px-2 py-1 rounded text-xs font-medium ${isEmpenhada ? 'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/40' : 'bg-background text-textMain'}`}
                                >
                                  {prefixo}
                                </span>
                              );
                            })}
                        </div>
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
};

export default ViaturaByObmTable;

