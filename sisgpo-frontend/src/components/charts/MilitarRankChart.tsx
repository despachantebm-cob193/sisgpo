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
  const alturaCalculada = Math.max(alturaMinima, data.length * alturaPorBarra);
  // --- FIM DA LÓGICA ---

  return (
    <ChartCard
      title="Quantidade de Militares por Posto/Graduação"
      isLoading={isLoading}
      hasData={data && data.length > 0}
    >
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
            <Bar dataKey="value" name="Total de Militares" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
};

export default MilitarRankChart;
