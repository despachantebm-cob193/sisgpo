import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import ChartCard from '@/components/ui/ChartCard';

interface ChartData {
    name: string;
    value: number;
}

interface MilitarByCrbmChartProps {
    data: ChartData[];
    isLoading: boolean;
}

const MilitarByCrbmChart: React.FC<MilitarByCrbmChartProps> = ({ data, isLoading }) => {
    const totalMilitares = data ? data.reduce((acc, item) => acc + item.value, 0) : 0;

    return (
        <ChartCard
            isLoading={isLoading}
            hasData={data && data.length > 0}
        >
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-textMain">Quantidade de Militares por CRBM</h3>
                <span className="text-sm font-medium bg-tagBlue text-white whitespace-nowrap px-2 py-1 rounded">
                    Total: {totalMilitares}
                </span>
            </div>

            <div style={{ width: '100%', height: '400px' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={data}
                        margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                        barCategoryGap="20%"
                    >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis
                            dataKey="name"
                            tick={{ fontSize: 12 }}
                        />
                        <YAxis />
                        <Tooltip
                            formatter={(value) => [`${value} militares`, 'Efetivo']}
                            labelStyle={{ color: '#000' }}
                        />
                        <Legend verticalAlign="top" wrapperStyle={{ paddingBottom: '20px' }} />
                        <Bar dataKey="value" name="Efetivo por CRBM" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </ChartCard>
    );
};

export default MilitarByCrbmChart;
