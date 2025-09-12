// Crie este arquivo em: src/components/charts/MilitarStatsChart.tsx

import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import Spinner from '@/components/ui/Spinner';

interface ChartData {
  name: string;
  value: number;
}

interface MilitarStatsChartProps {
  data: ChartData[];
  isLoading: boolean;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const MilitarStatsChart: React.FC<MilitarStatsChartProps> = ({ data, isLoading }) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow-md flex flex-col">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Efetivo por Posto/Grad.</h3>
      {isLoading ? (
        <div className="h-full flex justify-center items-center min-h-[200px]"><Spinner /></div>
      ) : !data || data.length === 0 ? (
        <div className="h-full flex justify-center items-center min-h-[200px]">
          <p className="text-gray-500">Nenhum dado encontrado.</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
              nameKey="name"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value: number) => [`${value} militares`, 'Quantidade']} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default MilitarStatsChart;
