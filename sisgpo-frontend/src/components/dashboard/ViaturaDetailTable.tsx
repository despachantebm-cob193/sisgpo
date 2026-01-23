import React, { useState } from 'react';
import Spinner from '@/components/ui/Spinner';
import { MapPin, ChevronDown } from 'lucide-react';

// Interfaces para tipagem dos dados
interface ObmGrupo {
  nome: string;
  prefixos: string[];
}

interface ViaturaStatAgrupada {
  tipo: string;
  quantidade: number;
  obms: ObmGrupo[];
}

interface ViaturaDetailTableProps {
  data: ViaturaStatAgrupada[];
  isLoading: boolean;
}

const ViaturaDetailTable: React.FC<ViaturaDetailTableProps> = ({ data, isLoading }) => {
  const [openTipos, setOpenTipos] = useState<Set<string>>(() => new Set());

  const toggleTipo = (tipo: string) => {
    setOpenTipos((prev) => {
      const next = new Set(prev);
      if (next.has(tipo)) {
        next.delete(tipo);
      } else {
        next.add(tipo);
      }
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className="bg-cardSlate p-4 rounded-lg shadow-md flex justify-center items-center min-h-[300px]">
        <Spinner className="h-10 w-10" />
      </div>
    );
  }

  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <div className="bg-cardSlate p-4 rounded-lg shadow-md flex justify-center items-center min-h-[300px]">
        <p className="text-textSecondary">Nenhum dado de viatura disponível.</p>
      </div>
    );
  }

  const totalViaturas = data.reduce((acc, item) => acc + item.quantidade, 0);

  return (
    <div className="bg-cardSlate p-4 rounded-lg shadow-md col-span-1 lg:col-span-2">
      <h3 className="text-xl font-semibold text-textMain mb-4 flex items-center justify-between">
        <span>Detalhamento de Viaturas por Tipo</span>
        <span className="text-sm font-medium bg-tagBlue text-white whitespace-nowrap px-2 py-1 rounded">
          Total Geral: {totalViaturas}
        </span>
      </h3>

      <div className="viaturas-detalhamento">
        {data.map((item) => {
          const isOpen = openTipos.has(item.tipo);
          return (
            <div
              key={item.tipo}
              className="rounded-lg border border-borderDark/60 bg-background/30 shadow-sm transition"
            >
              <button
                type="button"
                onClick={() => toggleTipo(item.tipo)}
                aria-expanded={isOpen}
                className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-searchbar/70"
              >
                <div>
                  <p className="text-base font-semibold text-textMain">{item.tipo}</p>
                  <p className="text-xs text-textSecondary">Clique para ver locais e prefixos</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-tagBlue/20 px-3 py-1 text-sm font-semibold text-tagBlue">
                    Total: {item.quantidade}
                  </span>
                  <ChevronDown
                    className={`h-5 w-5 text-textSecondary transition-transform ${isOpen ? 'rotate-180' : ''
                      }`}
                  />
                </div>
              </button>

              {isOpen && (
                <div className="border-t border-borderDark/60 bg-cardSlate/70 px-4 py-4">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {item.obms.map((obmGrupo) => (
                      <div
                        key={`${item.tipo}-${obmGrupo.nome}`}
                        className="rounded-lg border border-borderDark/40 bg-background/70 p-3 shadow-inner"
                      >
                        <div className="flex items-start gap-2">
                          <MapPin className="mt-1 h-4 w-4 text-red-500" />
                          <div>
                            <p className="font-semibold text-textMain">{obmGrupo.nome}</p>
                            <p className="text-xs text-textSecondary">
                              {obmGrupo.prefixos.length} {obmGrupo.prefixos.length === 1 ? 'prefixo' : 'prefixos'}
                            </p>
                          </div>
                        </div>
                        {obmGrupo.prefixos.length > 0 ? (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {obmGrupo.prefixos.map((prefixo) => (
                              <span
                                key={prefixo}
                                className="rounded bg-tagBlue/10 px-2 py-1 text-sm font-semibold text-tagBlue"
                              >
                                {prefixo}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="mt-3 text-sm text-textSecondary">Sem prefixos informados.</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ViaturaDetailTable;


