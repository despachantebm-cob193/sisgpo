import React from 'react';
import Spinner from '@/components/ui/Spinner';
import { MapPin } from 'lucide-react';

// Novas interfaces para refletir a estrutura de dados da API
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
      <div className="overflow-x-auto">
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
                  {/* --- LÓGICA DE RENDERIZAÇÃO ATUALIZADA --- */}
                  <div className="space-y-2">
                    {item.obms.map((obmGrupo) => (
                      <div key={obmGrupo.nome} className="flex flex-col sm:flex-row sm:items-start gap-x-3">
                        <div className="flex items-center text-gray-700 whitespace-nowrap mb-1 sm:mb-0">
                          <MapPin className="w-4 h-4 mr-1.5 text-red-500 flex-shrink-0" />
                          <span className="font-medium">{obmGrupo.nome}:</span>
                        </div>
                        <div className="flex flex-wrap gap-x-3 gap-y-1 pl-6 sm:pl-0">
                          {obmGrupo.prefixos.map((prefixo) => (
                            <span key={prefixo} className="font-bold text-blue-600 whitespace-nowrap">
                              {prefixo}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* --- FIM DA ATUALIZAÇÃO --- */}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ViaturaDetailTable;
