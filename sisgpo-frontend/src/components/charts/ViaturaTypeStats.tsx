// Arquivo: frontend/src/components/charts/ViaturaTypeStats.tsx (Novo Arquivo Completo)

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LabelList } from 'recharts';
import Spinner from '@/components/ui/Spinner';

// Interface para os dados que virão da API
interface ViaturaTipoStat {
  tipo: string;
  quantidade: number;
  locais: string[];
}

interface ViaturaTypeStatsProps {
  data: ViaturaTipoStat[];
  isLoading: boolean;
}

const ViaturaTypeStats: React.FC<ViaturaTypeStatsProps> = ({ data, isLoading }) => {
  // Prepara os dados apenas para o gráfico
  const chartData = data.map(item => ({
    name: item.tipo,
    value: item.quantidade,
  }));

  return (
    <div className="bg-white p-4 rounded-lg shadow-md col-span-1 lg:col-span-2">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Viaturas Disponíveis por Tipo</h3>
      
      {isLoading ? (
        <div className="h-96 flex justify-center items-center"><Spinner /></div>
      ) : !data || data.length === 0 ? (
        <div className="h-96 flex justify-center items-center">
          <p className="text-gray-500">Nenhuma viatura disponível encontrada.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Coluna da Tabela */}
          <div className="md:col-span-2 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-left font-bold border-b-2 border-gray-200">
                <tr>
                  <th className="p-2">Tipo</th>
                  <th className="p-2 text-center">Quant.</th>
                  <th className="p-2">Locais</th>
                </tr>
              </thead>
              <tbody>
                {data.map((item) => (
                  <tr key={item.tipo} className="border-b border-gray-100 last:border-b-0">
                    <td className="p-2 font-semibold align-top">{item.tipo}</td>
                    <td className="p-2 text-center align-top">{item.quantidade}</td>
                    <td className="p-2 text-gray-600 text-xs align-top" style={{ wordBreak: 'break-word' }}>
                      {item.locais.join('; ')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Coluna do Gráfico */}
          <div className="md:col-span-1 min-h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 35, left: 10, bottom: 5 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={50} />
                <Tooltip cursor={{ fill: 'transparent' }} />
                <Bar dataKey="value" barSize={20} radius={[0, 4, 4, 0]} fill="#ff8c00">
                   <LabelList dataKey="value" position="right" fill="#374151" fontSize={12} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViaturaTypeStats;
