// Arquivo: frontend/src/components/charts/ViaturaDistributionChart.tsx (Corrigido)

import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import ChartCard from '@/components/ui/ChartCard'; // <-- CORREÇÃO: Usando alias de caminho

interface ChartData {
  name: string;
  value: number;
}

interface ViaturaDistributionChartProps {
  data: ChartData[];
  isLoading: boolean;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A239EA', '#FF5733', '#33FF57', '#3357FF'];

const ViaturaDistributionChart: React.FC<ViaturaDistributionChartProps> = ({ data, isLoading }) => {
  return (
    <ChartCard
      title="Distribuição de Viaturas por OBM"
      isLoading={isLoading}
      hasData={data && data.length > 0}
    >
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={110}
            fill="#8884d8"
            dataKey="value"
            nameKey="name"
            label={({ name, percent }) => {
              if (percent === undefined) return name;
              return `${name} (${(percent * 100).toFixed(0)}%)`;
            }}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => [`${value} viaturas`, 'Quantidade']} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  );
};

export default ViaturaDistributionChart;
