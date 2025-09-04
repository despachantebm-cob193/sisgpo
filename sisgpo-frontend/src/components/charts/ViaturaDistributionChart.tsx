// Arquivo: frontend/src/components/charts/ViaturaDistributionChart.tsx (Atualizado)

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import ChartCard from '@/components/ui/ChartCard';

interface ChartData {
  name: string;
  value: number;
}

interface ViaturaDistributionChartProps {
  data: ChartData[];
  isLoading: boolean;
}

const ViaturaDistributionChart: React.FC<ViaturaDistributionChartProps> = ({ data, isLoading }) => {
  return (
    <ChartCard
      title="Distribuição de Viaturas por OBM"
      isLoading={isLoading}
      hasData={data && data.length > 0}
    >
      <ResponsiveContainer width="100%" height="100%">
        {/* O layout="vertical" transforma o gráfico de barras em horizontal */}
        <BarChart
          data={data}
          layout="vertical" 
          margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          {/* O eixo X agora representa os valores (números) */}
          <XAxis type="number" allowDecimals={false} />
          {/* O eixo Y representa as categorias (nomes das OBMs) */}
          <YAxis dataKey="name" type="category" width={150} />
          <Tooltip formatter={(value) => [`${value} viaturas`, 'Quantidade']} />
          <Legend />
          <Bar dataKey="value" name="Total de Viaturas" fill="#3b82f6" />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
};

export default ViaturaDistributionChart;
