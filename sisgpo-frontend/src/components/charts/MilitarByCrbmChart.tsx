import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
import Spinner from '@/components/ui/Spinner';
import { Map } from 'lucide-react';

interface ChartData {
    name: string;
    value: number;
}

interface MilitarByCrbmChartProps {
    data: ChartData[];
    isLoading: boolean;
    onBarClick?: (crbmName: string) => void;
}

const COLORS = ['#10b981', '#34d399', '#6ee7b7', '#a7f3d0'];

const MilitarByCrbmChart: React.FC<MilitarByCrbmChartProps> = ({ data, isLoading, onBarClick }) => {
    const safeData = Array.isArray(data) ? data : [];
    const totalMilitares = safeData.reduce((acc, item) => acc + item.value, 0);

    return (
        <div className="bg-[#0a0d14]/80 backdrop-blur-md p-6 rounded-2xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col relative overflow-hidden h-full min-h-[400px]">
            {/* Sci-Fi Decorative Header Line */}
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent pointer-events-none" />

            {/* Header */}
            <div className="flex justify-between items-start mb-6">
                <div className="flex flex-col">
                    <div className="flex items-center gap-2 mb-1">
                        <Map className="w-4 h-4 text-emerald-400" />
                        <h3 className="text-sm font-bold text-white tracking-widest uppercase font-mono">
                            Efetivo por CRBM
                        </h3>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">
                        Distribuição Regional
                    </span>
                </div>

                {/* Status Badge */}
                <div className="px-2 py-1 bg-emerald-950/40 border border-emerald-500/20 rounded text-[9px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    ATIVOS
                </div>
            </div>

            {isLoading ? (
                <div className="h-full flex justify-center items-center">
                    <Spinner className="text-emerald-500 w-8 h-8" />
                </div>
            ) : !data || data.length === 0 ? (
                <div className="h-full flex justify-center items-center flex-col">
                    <p className="text-slate-600 font-mono tracking-widest text-xs">SEM DADOS REGIONAIS</p>
                </div>
            ) : (
                <div className="w-full h-full min-h-[300px] flex-1">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={safeData}
                            margin={{ top: 20, right: 0, left: 0, bottom: 20 }}
                            barCategoryGap="20%"
                        >
                            <XAxis
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600, fontFamily: 'monospace' }}
                                dy={10}
                            />
                            <YAxis hide />
                            <Tooltip
                                cursor={{ fill: 'rgba(16, 185, 129, 0.05)' }}
                                contentStyle={{ backgroundColor: '#0f141e', borderColor: '#10b98133', borderRadius: '8px', color: '#fff' }}
                                itemStyle={{ color: '#10b981', fontFamily: 'monospace' }}
                                formatter={(value: number) => [`${value} Militares`, 'Efetivo']}
                            />
                            <Bar
                                dataKey="value"
                                name="Efetivo"
                                radius={[4, 4, 0, 0]}
                                onClick={(data) => {
                                    if (onBarClick && data && data.name) {
                                        onBarClick(data.name);
                                    }
                                }}
                                className="cursor-pointer hover:opacity-80 transition-opacity"
                            >
                                {safeData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                                <LabelList dataKey="value" position="top" fill="#ffffff" fontSize={12} fontWeight="bold" fontFamily="monospace" />
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    );
};

export default MilitarByCrbmChart;
