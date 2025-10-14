// sisgpo-frontend/src/pages/EstatisticasExternas.tsx

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import Card from '../components/ui/Card';
import Spinner from '../components/ui/Spinner';
import StatCard from '../components/ui/StatCard'; 

// Defina a interface de dados esperada do Backend
interface EstatisticasData {
    totais: {
        total_plantoes: string; // Knex retorna COUNT como string
        ultimo_plantao_inicio: string;
    };
    escalas_recentes: Array<{
        nome: string;
        turno: string;
    }>;
}

const EstatisticasExternas: React.FC = () => {
    const { data, isLoading, isError, error } = useQuery<EstatisticasData>({
        queryKey: ['estatisticasExternas'],
        queryFn: async () => {
            // Ajuste a URL base conforme o seu ambiente Vercel/localhost
            const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3333';
            const response = await axios.get(`${API_BASE_URL}/api/public/estatisticas-externas`);
            return response.data;
        },
    });

    if (isLoading) {
        return <div className="p-4 flex justify-center"><Spinner /></div>;
    }

    if (isError) {
        // Exibir erro de forma amigável
        return <div className="p-4 text-red-600">Erro ao carregar dados externos: {(error as Error).message}</div>;
    }

    const { totais, escalas_recentes } = data!;

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">📊 Espelho Estatístico (Sistema Externo)</h1>
            
            {/* Cards de Estatísticas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <StatCard 
                    title="Total de Plantoes Registrados" 
                    value={totais.total_plantoes} 
                    icon="Calendar" 
                />
                <StatCard 
                    title="Último Plantão Iniciado" 
                    value={new Date(totais.ultimo_plantao_inicio).toLocaleDateString()} 
                    icon="Clock" 
                />
                {/* Adicione outros cards aqui se necessário */}
            </div>

            {/* Tabela de Detalhes (Espelho da Página) */}
            <Card title="Escalas Recentes - Detalhe">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome da Escala</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Turno</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {escalas_recentes.map((escala, index) => (
                                <tr key={index}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{escala.nome}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{escala.turno}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};

export default EstatisticasExternas;