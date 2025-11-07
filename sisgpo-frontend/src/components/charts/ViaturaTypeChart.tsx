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
    // A data já vem formatada do componente pai, então apenas a exibimos.
    return isoString;
  };

  return (
    // O contêiner principal agora é um div simples
    <div className="bg-cardSlate p-4 rounded-lg shadow-md flex flex-col">
      {/* Cabeçalho customizado para incluir o título e a data */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-textMain">Viaturas Disponíveis por Tipo</h3>
        <span className="text-sm font-medium bg-tagBlue text-white whitespace-nowrap px-2 py-1 rounded">
          Total: {totalDeViaturasNoGrafico}
        </span>
      </div>

      {isLoading ? (
        <div className="h-full flex justify-center items-center min-h-[200px]"><Spinner /></div>
      ) : !data || data.length === 0 ? (
        <div className="h-full flex justify-center items-center min-h-[200px]">
          <p className="text-textSecondary">Nenhuma viatura disponível encontrada.</p>
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
        </>
      )}
    </div>
  );
};

export default ViaturaTypeChart;
