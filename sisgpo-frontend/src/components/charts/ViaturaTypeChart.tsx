import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LabelList, Cell } from 'recharts';
import Spinner from '@/components/ui/Spinner';
import { Truck } from 'lucide-react';

interface ChartData {
  name: string;
  value: number;
}

interface ViaturaTypeChartProps {
  data: ChartData[];
  lastUpdated: string | null;
  isLoading: boolean;
}

const COLORS = ['#22d3ee', '#38bdf8', '#60a5fa', '#818cf8', '#a78bfa', '#c084fc', '#e879f9'];

const ViaturaTypeChart: React.FC<ViaturaTypeChartProps> = ({ data, lastUpdated, isLoading }) => {
  const alturaPorBarra = 40;
  const alturaMinima = 250;
  const safeData = Array.isArray(data) ? data : [];
  const alturaCalculada = Math.max(alturaMinima, safeData.length * alturaPorBarra);
  const totalDeViaturasNoGrafico = safeData.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="bg-[#0a0d14]/80 backdrop-blur-md p-6 rounded-2xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col relative overflow-hidden h-full">

      {/* Sci-Fi Decorative Header Line */}
      <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent pointer-events-none" />

      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div className="flex flex-col">
          <div className="flex items-center gap-2 mb-1">
            <Truck className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white tracking-widest uppercase font-mono">
              Viaturas por Tipo
            </h3>
          </div>
          <span className="text-[10px] text-slate-500 font-mono">
            Frota: {totalDeViaturasNoGrafico} unidades
          </span>
        </div>

        {/* Status Badge */}
        <div className="px-2 py-1 bg-cyan-950/40 border border-cyan-500/20 rounded text-[9px] font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-pulse" />
          ATIVO
        </div>
      </div>

      {isLoading ? (
        <div className="h-full flex justify-center items-center min-h-[200px]">
          <Spinner className="text-cyan-500 w-8 h-8" />
        </div>
      ) : !data || data.length === 0 ? (
        <div className="h-full flex justify-center items-center flex-col min-h-[200px]">
          <p className="text-slate-600 font-mono tracking-widest text-xs">SEM DADOS DE FROTA</p>
        </div>
      ) : (
        <div style={{ minHeight: `${alturaCalculada}px` }} className="w-full">
          <ResponsiveContainer width="100%" height={alturaCalculada}>
            <BarChart data={safeData} layout="vertical" margin={{ top: 0, right: 30, left: 0, bottom: 0 }} barCategoryGap="15%">
              <XAxis type="number" hide />
              <YAxis
                dataKey="name"
                type="category"
                axisLine={false}
                tickLine={false}
                width={80}
                tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600, fontFamily: 'monospace' }}
              />
              <Tooltip
                cursor={{ fill: 'rgba(34, 211, 238, 0.05)' }}
                contentStyle={{ backgroundColor: '#0f141e', borderColor: '#22d3ee33', borderRadius: '8px', color: '#fff' }}
                itemStyle={{ color: '#22d3ee', fontFamily: 'monospace' }}
                formatter={(value: number) => [`${value} Unidades`, 'Quantidade']}
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {safeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
                <LabelList dataKey="value" position="right" fill="#ffffff" fontSize={11} fontWeight="bold" fontFamily="monospace" />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default ViaturaTypeChart;
