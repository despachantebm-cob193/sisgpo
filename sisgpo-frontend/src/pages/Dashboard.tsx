// Arquivo: frontend/src/pages/Dashboard.tsx (Completo)

import { useEffect, useState, useCallback } from 'react';
import api from '@/services/api';
import StatCard from '@/components/ui/StatCard';
import ViaturaTypeChart from '@/components/charts/ViaturaTypeChart';
import MilitarRankChart from '@/components/charts/MilitarRankChart';
import toast from 'react-hot-toast';

// Interfaces
interface DashboardStats {
  total_militares_ativos: number;
  total_viaturas_disponiveis: number;
  total_obms: number;
  total_plantoes_mes: number;
}
interface ChartStat {
  name: string;
  value: number;
}
interface Obm {
  id: number;
  abreviatura: string;
  nome: string;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [viaturaTipoStats, setViaturaTipoStats] = useState<ChartStat[]>([]);
  const [militarStats, setMilitarStats] = useState<ChartStat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [obms, setObms] = useState<Obm[]>([]);
  const [selectedObm, setSelectedObm] = useState<string>('');
  const [lastUpload, setLastUpload] = useState<string | null>(null);

  const fetchLastUpload = useCallback(async () => {
    try {
      const response = await api.get('/api/admin/metadata/viaturas_last_upload');
      const date = new Date(response.data.value);
      setLastUpload(date.toLocaleString('pt-BR'));
    } catch (error) {
      console.error("Não foi possível buscar a data da última atualização.");
      setLastUpload(null);
    }
  }, []);

  const fetchObms = useCallback(async () => {
    try {
      const response = await api.get('/api/admin/obms?limit=500');
      setObms(response.data.data);
    } catch (err) {
      toast.error('Não foi possível carregar a lista de OBMs para o filtro.');
    }
  }, []);

  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedObm) {
        params.append('obm_id', selectedObm);
      }
      const queryString = params.toString();

      const [statsRes, viaturaTipoRes, militarStatsRes] = await Promise.all([
        api.get<DashboardStats>(`/api/admin/dashboard/stats?${queryString}`),
        api.get<ChartStat[]>(`/api/admin/dashboard/viatura-stats-por-tipo?${queryString}`),
        api.get<ChartStat[]>(`/api/admin/dashboard/militar-stats?${queryString}`)
      ]);
      
      setStats(statsRes.data);
      setViaturaTipoStats(viaturaTipoRes.data);
      setMilitarStats(militarStatsRes.data);
      setError(null);
    } catch (err) {
      setError('Não foi possível carregar os dados do dashboard.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedObm]);

  useEffect(() => {
    fetchObms();
    fetchLastUpload();
  }, [fetchObms, fetchLastUpload]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  if (error) {
    return (
      <div className="text-center text-red-600 bg-red-100 p-4 rounded-md">
        {error}
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">Dashboard</h2>
          <p className="text-gray-600 mt-2">
            Visão geral do poder operacional em tempo real.
          </p>
        </div>
        
        <div className="w-full md:w-auto">
          <label htmlFor="obm-filter" className="sr-only">Filtrar por OBM</label>
          <select
            id="obm-filter"
            value={selectedObm}
            onChange={(e) => setSelectedObm(e.target.value)}
            className="w-full md:w-64 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          >
            <option value="">Todas as OBMs</option>
            {obms.map((obm) => (
              <option key={obm.id} value={obm.id}>
                {obm.abreviatura} - {obm.nome}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Militares Ativos" value={stats?.total_militares_ativos ?? 0} description="Total de militares na ativa." isLoading={isLoading} />
        <StatCard title="Viaturas Disponíveis" value={stats?.total_viaturas_disponiveis ?? 0} description="Viaturas em condições de uso." isLoading={isLoading} />
        <StatCard title="OBMs Cadastradas" value={stats?.total_obms ?? 0} description="Total de unidades operacionais." isLoading={isLoading} />
        <StatCard title="Plantões no Mês" value={stats?.total_plantoes_mes ?? 0} description="Total de plantões no mês corrente." isLoading={isLoading} />
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ViaturaTypeChart 
          data={viaturaTipoStats} 
          isLoading={isLoading} 
          lastUpdated={lastUpload}
        />
        
        <MilitarRankChart data={militarStats} isLoading={isLoading} />
      </div>
    </div>
  );
}
