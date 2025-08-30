import { useEffect, useState } from 'react';
import api from '@/services/api';
import StatCard from '@/components/ui/StatCard';
import Spinner from '@/components/ui/Spinner';

interface DashboardStats {
  total_militares_ativos: number;
  total_viaturas_disponiveis: number;
  total_obms: number;
  total_plantoes_mes: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true);
        // CORREÇÃO: Adicionado '/api' ao caminho da rota
        const response = await api.get<DashboardStats>('/api/admin/dashboard/stats');
        setStats(response.data);
        setError(null);
      } catch (err) {
        setError('Não foi possível carregar as estatísticas.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (error) {
    return (
      <div className="text-center text-red-600 bg-red-100 p-4 rounded-md">
        {error}
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-3xl font-bold tracking-tight text-gray-900">Dashboard</h2>
      <p className="text-gray-600 mt-2">
        Visão geral do poder operacional em tempo real.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Militares Ativos"
          value={stats?.total_militares_ativos ?? 0}
          description="Total de militares na ativa."
          isLoading={isLoading}
        />
        <StatCard
          title="Viaturas Disponíveis"
          value={stats?.total_viaturas_disponiveis ?? 0}
          description="Viaturas em condições de uso."
          isLoading={isLoading}
        />
        <StatCard
          title="OBMs Cadastradas"
          value={stats?.total_obms ?? 0}
          description="Total de unidades operacionais."
          isLoading={isLoading}
        />
        <StatCard
          title="Plantões no Mês"
          value={stats?.total_plantoes_mes ?? 0}
          description="Total de plantões no mês corrente."
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
