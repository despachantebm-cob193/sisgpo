import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import ChartCard from '@/components/ui/ChartCard';

interface ChartData {
  name: string;
  value: number;
}

interface MilitarRankChartProps {
  data: ChartData[];
  isLoading: boolean;
}

const MilitarRankChart: React.FC<MilitarRankChartProps> = ({ data, isLoading }) => {
  return (
    <ChartCard
      title="Quantidade de Militares por Posto/Graduação"
      isLoading={isLoading}
      hasData={data && data.length > 0}
    >
      {/* --- CORREÇÃO APLICADA AQUI --- */}
      {/* Adicionamos uma altura mínima (min-h-[300px]) ao contêiner do gráfico. */}
      {/* Isso garante que ele tenha espaço para renderizar mesmo em telas pequenas. */}
      <div style={{ width: '100%', height: '100%', minHeight: '300px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            layout="vertical"
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 12 }} />
            <Tooltip formatter={(value) => [`${value} militares`, 'Quantidade']} />
            <Legend wrapperStyle={{ fontSize: '12px' }} />
            <Bar dataKey="value" name="Total de Militares" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      {/* --- FIM DA CORREÇÃO --- */}
    </ChartCard>
  );
};

export default MilitarRankChart;
