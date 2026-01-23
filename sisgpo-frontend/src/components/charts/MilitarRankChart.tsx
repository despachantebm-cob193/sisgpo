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
  // --- LÓGICA DE ALTURA DINÂMICA ---
  const alturaPorBarra = 40; // Espaço vertical para cada barra (em pixels)
  const alturaMinima = 250; // Altura mínima do gráfico, mesmo com poucos dados

  // Calcula a altura total necessária
  const safeData = Array.isArray(data) ? data : [];
  // Calcula a altura total necessária
  const alturaCalculada = Math.max(alturaMinima, safeData.length * alturaPorBarra);
  // --- FIM DA LÓGICA ---

  const totalMilitares = safeData.reduce((acc, item) => acc + item.value, 0);

  return (
    <ChartCard
      isLoading={isLoading}
      hasData={data && data.length > 0}
    >
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-textMain">Efetivo Ativo por Posto/Graduação</h3>
        <span className="text-sm font-medium bg-tagBlue text-white whitespace-nowrap px-2 py-1 rounded">
          Total: {totalMilitares}
        </span>
      </div>
      {/* O contêiner agora usa a altura calculada dinamicamente */}
      <div style={{ width: '100%', height: `${alturaCalculada}px` }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            layout="vertical"
            // Adiciona espaçamento entre as barras para melhor legibilidade
            barCategoryGap="20%"
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis
              dataKey="name"
              type="category"
              width={120}
              tick={{ fontSize: 12 }}
              // Impede que os rótulos sejam cortados
              interval={0}
            />
            <Tooltip formatter={(value) => [`${value} militares`, 'Quantidade']} />
            <Legend wrapperStyle={{ fontSize: '12px' }} />
            <Bar dataKey="value" name="Efetivo" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
};

export default MilitarRankChart;
