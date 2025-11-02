import React from 'react';
import Spinner from '@/components/ui/Spinner';
import { MapPin } from 'lucide-react';

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
  if (isLoading) {
    return (
      <div className="bg-cardSlate p-4 rounded-lg shadow-md flex justify-center items-center min-h-[300px]">
        <Spinner className="h-10 w-10" />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-cardSlate p-4 rounded-lg shadow-md flex justify-center items-center min-h-[300px]">
        <p className="text-textSecondary">Nenhum dado de viatura disponível.</p>
      </div>
    );
  }

  return (
    <div className="bg-cardSlate p-4 rounded-lg shadow-md col-span-1 lg:col-span-2">
      <h3 className="text-xl font-semibold text-textMain mb-4">Detalhamento de Viaturas por Tipo</h3>
      
      {/* Tabela para Telas Maiores (md e acima) */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="text-left font-bold bg-searchbar">
            <tr>
              <th className="p-3">Tipo</th>
              <th className="p-3 text-center">Quant.</th>
              <th className="p-3">Locais e Prefixos</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-borderDark/60">
            {data.map((item) => (
              <tr key={item.tipo}>
                <td className="p-3 font-bold align-top w-24">{item.tipo}</td>
                <td className="p-3 text-center font-semibold align-top w-20">{item.quantidade}</td>
                <td className="p-3 align-top">
                  <div className="space-y-2">
                    {item.obms.map((obmGrupo) => (
                      <div key={obmGrupo.nome} className="flex items-start gap-x-3">
                        <div className="flex items-center text-textSecondary whitespace-nowrap">
                          <MapPin className="w-4 h-4 mr-1.5 text-red-500 flex-shrink-0" />
                          <span className="font-medium">{obmGrupo.nome}:</span>
                        </div>
                        <div className="flex flex-wrap gap-x-3 gap-y-1">
                          {obmGrupo.prefixos.map((prefixo) => (
                            <span key={prefixo} className="font-bold text-blue-600 whitespace-nowrap">
                              {prefixo}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Lista de Cards para Telas Pequenas (abaixo de md) */}
      <div className="md:hidden space-y-4">
        {data.map((item) => (
          <div key={item.tipo} className="border border-borderDark/60 rounded-lg p-4">
            <div className="flex justify-between items-center mb-3">
              <span className="font-bold text-lg text-textMain">{item.tipo}</span>
              <span className="bg-tagBlue/20 text-tagBlue text-sm font-semibold px-3 py-1 rounded-full">
                Total: {item.quantidade}
              </span>
            </div>
            <div className="space-y-3 border-t pt-3">
              {item.obms.map((obmGrupo) => (
                <div key={obmGrupo.nome}>
                  <div className="flex items-center text-textSecondary mb-1">
                    <MapPin className="w-4 h-4 mr-1.5 text-red-500 flex-shrink-0" />
                    <span className="font-medium">{obmGrupo.nome}:</span>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 pl-6">
                    {obmGrupo.prefixos.map((prefixo) => (
                      <span key={prefixo} className="font-bold text-blue-600">
                        {prefixo}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ViaturaDetailTable;


