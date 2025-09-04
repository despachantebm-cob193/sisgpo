// Arquivo: frontend/src/components/charts/ViaturaTypeChart.tsx (Versão Final Corrigida)

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LabelList } from 'recharts';
import Spinner from '@/components/ui/Spinner';

interface ChartData {
  name: string;
  value: number;
}

interface ViaturaTypeChartProps {
  data: ChartData[];
  lastUpdated: string | null;
  isLoading: boolean;
}

const ViaturaTypeChart: React.FC<ViaturaTypeChartProps> = ({ data, lastUpdated, isLoading }) => {
  const alturaPorBarra = 40;
  const alturaMinima = 200;
  const alturaCalculada = Math.max(alturaMinima, data.length * alturaPorBarra);
  const totalDeViaturasNoGrafico = data.reduce((sum, item) => sum + item.value, 0);

  const formatarData = (isoString: string | null) => {
    if (!isoString) return 'Nunca atualizado';
    const data = new Date(isoString);
    return data.toLocaleDateString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    });
  };

  return (
    // O contêiner principal agora é um div simples
    <div className="bg-white p-4 rounded-lg shadow-md flex flex-col">
      {/* Cabeçalho customizado para incluir o título e a data */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Viaturas Disponíveis por Tipo</h3>
        {!isLoading && (
          <span className="text-xs text-gray-500">
            Atualizado em: {formatarData(lastUpdated)}
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="h-full flex justify-center items-center min-h-[200px]"><Spinner /></div>
      ) : !data || data.length === 0 ? (
        <div className="h-full flex justify-center items-center min-h-[200px]">
          <p className="text-gray-500">Nenhuma viatura disponível encontrada.</p>
        </div>
      ) : (
        <>
          <div style={{ minHeight: `${alturaCalculada}px` }}>
            <ResponsiveContainer width="100%" height={alturaCalculada}>
              <BarChart data={data} layout="vertical" margin={{ top: 5, right: 45, left: 10, bottom: 20 }} barCategoryGap="20%">
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={80} tick={{ fontSize: 12, fill: '#374151' }} />
                <Tooltip cursor={{ fill: 'transparent' }} formatter={(value: number) => [`${value} Viatura(s)`, 'Quantidade']} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} fill="#ff8c00">
                  <LabelList dataKey="value" position="right" fill="#374151" fontSize={12} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 pt-2 border-t border-gray-200 text-right">
            <p className="text-sm text-gray-600">
              Total no Gráfico: <span className="font-bold text-lg">{totalDeViaturasNoGrafico}</span>
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export default ViaturaTypeChart;
