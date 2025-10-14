// sisgpo-frontend/src/pages/EstatisticasExternas.tsx

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import Card from '../components/ui/Card';
import Spinner from '../components/ui/Spinner';
import StatCard from '../components/ui/StatCard';

interface EstatisticasData {
  totais: {
    total_plantoes: string;
    ultimo_plantao_inicio: string | null;
    total_militares_plantao?: string;
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
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3333';
      const response = await axios.get(`${API_BASE_URL}/api/public/estatisticas-externas`);
      return response.data;
    },
  });

  if (isLoading) {
    return (
      <div className="p-4 flex justify-center">
        <Spinner />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-4 text-red-600">
        Erro ao carregar dados externos: {(error as Error).message}
      </div>
    );
  }

  const { totais, escalas_recentes } = data!;

  const ultimoPlantaoTexto = totais.ultimo_plantao_inicio
    ? new Date(totais.ultimo_plantao_inicio).toLocaleDateString()
    : 'Sem registros';

  const totalMilitares = totais.total_militares_plantao ?? '0';

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Espelho Estatistico (Sistema Externo)</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard title="Total de Plantoes Registrados" value={totais.total_plantoes} icon="Calendar" />
        <StatCard title="Ultimo Plantao Iniciado" value={ultimoPlantaoTexto} icon="Clock" />
        <StatCard title="Militares em Plantao" value={totalMilitares} icon="Users" />
      </div>

      <Card title="Escalas Recentes - Detalhe">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nome da Escala
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Turno
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {escalas_recentes.map((escala, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {escala.nome}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {escala.turno}
                  </td>
                </tr>
              ))}
              {escalas_recentes.length === 0 && (
                <tr>
                  <td className="px-6 py-4 text-sm text-gray-500" colSpan={2}>
                    Nenhum registro encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default EstatisticasExternas;
