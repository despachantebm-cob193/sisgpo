// Arquivo: frontend/src/components/dashboard/ViaturaDetailTable.tsx (Código Completo e Responsivo)

import React from 'react';
import Spinner from '@/components/ui/Spinner';
import { MapPin } from 'lucide-react';

// Interfaces (sem alteração)
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
      <div className="bg-white p-4 rounded-lg shadow-md flex justify-center items-center min-h-[300px]">
        <Spinner className="h-10 w-10" />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white p-4 rounded-lg shadow-md flex justify-center items-center min-h-[300px]">
        <p className="text-gray-500">Nenhum dado de viatura disponível.</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow-md col-span-1 lg:col-span-2">
      <h3 className="text-xl font-semibold text-gray-800 mb-4">Detalhamento de Viaturas por Tipo</h3>
      
      {/* --- INÍCIO DA LÓGICA RESPONSIVA --- */}

      {/* Tabela para Telas Maiores (md e acima) */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="text-left font-bold bg-gray-50">
            <tr>
              <th className="p-3">Tipo</th>
              <th className="p-3 text-center">Quant.</th>
              <th className="p-3">Locais e Prefixos</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {data.map((item) => (
              <tr key={item.tipo}>
                <td className="p-3 font-bold align-top w-24">{item.tipo}</td>
                <td className="p-3 text-center font-semibold align-top w-20">{item.quantidade}</td>
                <td className="p-3 align-top">
                  <div className="space-y-2">
                    {item.obms.map((obmGrupo) => (
                      <div key={obmGrupo.nome} className="flex items-start gap-x-3">
                        <div className="flex items-center text-gray-700 whitespace-nowrap">
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
          <div key={item.tipo} className="border border-gray-200 rounded-lg p-4">
            <div className="flex justify-between items-center mb-3">
              <span className="font-bold text-lg text-gray-800">{item.tipo}</span>
              <span className="bg-indigo-100 text-indigo-800 text-sm font-semibold px-3 py-1 rounded-full">
                Total: {item.quantidade}
              </span>
            </div>
            <div className="space-y-3 border-t pt-3">
              {item.obms.map((obmGrupo) => (
                <div key={obmGrupo.nome}>
                  <div className="flex items-center text-gray-700 mb-1">
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
      {/* --- FIM DA LÓGICA RESPONSIVA --- */}

    </div>
  );
};

export default ViaturaDetailTable;
