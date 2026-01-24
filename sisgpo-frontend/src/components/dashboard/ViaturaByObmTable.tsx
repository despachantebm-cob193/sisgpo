import React from 'react';
import Spinner from '@/components/ui/Spinner';
import { Truck } from 'lucide-react';

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
      <div className="bg-[#0a0d14]/80 backdrop-blur-md p-6 rounded-2xl border border-white/10 min-h-[300px] flex items-center justify-center">
        <Spinner className="text-cyan-500 w-10 h-10" />
      </div>
    );
  }

  const filteredData = Array.isArray(data) ? data.filter((obm) => obm.quantidade > 0) : [];

  if (!filteredData || filteredData.length === 0) {
    return (
      <div className="bg-[#0a0d14]/80 backdrop-blur-md p-6 rounded-2xl border border-white/10 flex flex-col items-center justify-center h-48">
        <p className="text-slate-500 font-mono tracking-widest text-sm">NENHUMA VIATURA CADASTRADA.</p>
      </div>
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
    <div className="bg-[#0a0d14]/80 backdrop-blur-md p-6 md:p-8 rounded-2xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative overflow-hidden">

      {/* Header */}
      <div className="flex flex-col mb-8 border-b border-cyan-500/10 pb-4">
        <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 uppercase tracking-[0.15em] font-mono">
          Viaturas por OBM
        </h3>
        <p className="text-xs text-cyan-500/70 uppercase tracking-widest font-bold mt-1">
          Total: {totalViaturas} viaturas ativas
        </p>
      </div>

      <div className="space-y-10">
        {sortedGroupKeys.map((crbmKey) => {
          const obmsInGroup = groupedByCrbm[crbmKey].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));

          return (
            <div key={crbmKey}>
              {/* CRBM Header (Neon Bar) */}
              <div className="flex items-center gap-3 mb-4">
                <div className="h-4 w-1 bg-cyan-500 rounded-full shadow-[0_0_8px_cyan]" />
                <h4 className="text-sm font-bold text-cyan-400 uppercase tracking-[0.2em] font-mono">
                  {crbmKey === 'OUTRAS OBMS' ? 'Outras OBMs' : crbmKey}
                </h4>
                <div className="h-[1px] flex-1 bg-gradient-to-r from-cyan-500/20 to-transparent" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {obmsInGroup.map((obm) => (
                  <div
                    key={obm.id ?? obm.nome}
                    className="relative group bg-[#0e121b] border border-white/5 rounded-xl p-4 hover:border-cyan-500/30 transition-all duration-300 hover:shadow-[0_0_20px_rgba(34,211,238,0.05)] hover:-translate-y-1"
                  >
                    {/* Corner Accent */}
                    <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-cyan-500/20 rounded-tr-lg opacity-0 group-hover:opacity-100 transition-opacity" />

                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-cyan-950/30 rounded border border-cyan-500/20">
                          <Truck className="w-4 h-4 text-cyan-400" />
                        </div>
                        <div className="min-w-0">
                          <h5
                            className="font-bold text-slate-200 text-sm tracking-wide leading-snug break-words max-w-full"
                            title={obm.nome}
                            style={{ wordBreak: 'break-word' }}
                          >
                            {obm.abreviatura || obm.nome}
                          </h5>
                        </div>
                      </div>

                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-mono font-bold text-white group-hover:text-cyan-300 transition-colors">
                          {obm.quantidade}
                        </span>
                        <span className="text-[9px] text-slate-500 uppercase font-bold">VTRs</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5 min-h-[30px] items-end content-end">
                      {obm.prefixos.sort().map((prefixo, i) => {
                        const isEmpenhada = empenhadasViaturas.has(prefixo);
                        return (
                          <span
                            key={`${prefixo}-${i}`}
                            className={`px-1.5 py-0.5 rounded text-[10px] font-mono border transition-colors
                              ${isEmpenhada
                                ? 'bg-amber-950/40 border-amber-500/40 text-amber-400 font-bold shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                                : 'bg-[#1a1f2e] text-slate-400 border-white/5 group-hover:border-cyan-500/20 group-hover:text-cyan-100'
                              }
                            `}
                            title={isEmpenhada ? 'Viatura Empenhada' : 'Disponível'}
                          >
                            {prefixo}
                          </span>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ViaturaByObmTable;
