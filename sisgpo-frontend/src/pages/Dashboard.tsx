// Arquivo: frontend/src/pages/Dashboard.tsx (CORRIGIDO)

import { useEffect, useState, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import api from '@/services/api';
import toast from 'react-hot-toast';

// Componentes de UI
import StatCard from '@/components/ui/StatCard';
import Button from '@/components/ui/Button';
import ShareModal from '@/components/ui/ShareModal';
import { Share2 } from 'lucide-react';

// Componentes de Gráficos e Tabelas
import ViaturaTypeChart from '@/components/charts/ViaturaTypeChart';
import MilitarRankChart from '@/components/charts/MilitarRankChart';
import ViaturaDetailTable from '@/components/dashboard/ViaturaDetailTable';
import ViaturaByObmCard from '@/components/dashboard/ViaturaByObmCard';
import ServicoDiaCard from '@/components/dashboard/ServicoDiaCard';
import AeronavesCard from '@/components/dashboard/AeronavesCard';
import CodecCard from '@/components/dashboard/CodecCard';

// Interfaces (sem alteração)
interface PaginationState { currentPage: number; totalPages: number; totalRecords: number; perPage: number; }
interface ApiResponse<T> { data: T[]; pagination: PaginationState | null; }
interface DashboardStats { total_militares_ativos: number; total_viaturas_disponiveis: number; total_obms: number; total_plantoes_mes: number; }
interface ChartStat { name: string; value: number; }
interface Obm { id: number; abreviatura: string; nome: string; }
interface ObmGrupo { nome: string; prefixos: string[]; }
interface ViaturaStatAgrupada { tipo: string; quantidade: number; obms: ObmGrupo[]; }
interface ViaturaPorObmStat { id: number; nome: string; quantidade: number; prefixos: string[]; }
interface ServicoInfo { funcao: string; nome_guerra: string | null; posto_graduacao: string | null; }
interface Aeronave { prefixo: string; tipo_asa: 'fixa' | 'rotativa'; status: string; primeiro_piloto: string; segundo_piloto: string; }
interface PlantonistaCodec { turno: 'diurno' | 'noturno'; ordem_plantonista: number; nome_plantonista: string; }

export default function Dashboard() {
  const location = useLocation();
  const isLoggedInArea = location.pathname.startsWith('/app');

  // Estados (sem alteração)
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [viaturaTipoStats, setViaturaTipoStats] = useState<ChartStat[]>([]);
  const [militarStats, setMilitarStats] = useState<ChartStat[]>([]);
  const [viaturaDetailStats, setViaturaDetailStats] = useState<ViaturaStatAgrupada[]>([]);
  const [viaturaPorObmStats, setViaturaPorObmStats] = useState<ViaturaPorObmStat[]>([]);
  const [servicoDia, setServicoDia] = useState<ServicoInfo[]>([]);
  const [escalaAeronaves, setEscalaAeronaves] = useState<Aeronave[]>([]);
  const [escalaCodec, setEscalaCodec] = useState<PlantonistaCodec[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [obms, setObms] = useState<Obm[]>([]);
  const [selectedObm, setSelectedObm] = useState<string>('');
  const [lastUpload, setLastUpload] = useState<string | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Funções de busca de dados (sem alteração)
  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    const apiPrefix = isLoggedInArea ? '/api/admin' : '/api/public';
    try {
      const params = new URLSearchParams();
      if (isLoggedInArea && selectedObm) params.append('obm_id', selectedObm);
      const queryString = params.toString();
      const [ statsRes, viaturaTipoRes, militarStatsRes, viaturaDetailRes, viaturaPorObmRes, servicoDiaRes, escalaAeronavesRes, escalaCodecRes ] = await Promise.all([
        api.get<DashboardStats>(`${apiPrefix}/dashboard/stats?${queryString}`),
        api.get<ChartStat[]>(`${apiPrefix}/dashboard/viatura-stats-por-tipo?${queryString}`),
        api.get<ChartStat[]>(`${apiPrefix}/dashboard/militar-stats?${queryString}`),
        api.get<ViaturaStatAgrupada[]>(`${apiPrefix}/dashboard/viatura-stats-detalhado?${queryString}`),
        api.get<ViaturaPorObmStat[]>(`${apiPrefix}/dashboard/viatura-stats-por-obm`),
        api.get<ServicoInfo[]>(`${apiPrefix}/dashboard/servico-dia`),
        api.get<Aeronave[]>(`${apiPrefix}/dashboard/escala-aeronaves`),
        api.get<PlantonistaCodec[]>(`${apiPrefix}/dashboard/escala-codec`)
      ]);
      setStats(statsRes.data);
      setViaturaTipoStats(viaturaTipoRes.data);
      setMilitarStats(militarStatsRes.data);
      setViaturaDetailStats(viaturaDetailRes.data);
      setViaturaPorObmStats(viaturaPorObmRes.data);
      setServicoDia(servicoDiaRes.data);
      setEscalaAeronaves(escalaAeronavesRes.data);
      setEscalaCodec(escalaCodecRes.data);
      setError(null);
    } catch (err) {
      setError('Não foi possível carregar os dados do dashboard.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedObm, isLoggedInArea]);

  useEffect(() => {
    if (isLoggedInArea) {
      const fetchAdminData = async () => {
        try {
          const [obmsRes, metadataRes] = await Promise.all([
            api.get<ApiResponse<Obm>>('/api/admin/obms?limit=500'),
            api.get('/api/admin/metadata/viaturas_last_upload')
          ]);
          setObms(obmsRes.data.data);
          setLastUpload(new Date(metadataRes.data.value).toLocaleString('pt-BR'));
        } catch (err) { /* Não mostra erro para dados opcionais */ }
      };
      fetchAdminData();
    }
    fetchDashboardData();
  }, [fetchDashboardData, isLoggedInArea]);

  const publicUrl = `${window.location.origin}`;
  const shareMessage = `Prezados Comandantes,\n\nSegue a atualização diária dos recursos operacionais do CBMGO, disponível para consulta em tempo real através do link abaixo.\n\nEste painel centraliza as informações sobre o poder operacional para auxiliar na tomada de decisões.\n\nLink: ${publicUrl}\n\nAgradecemos a atenção.`;

  if (error) return <div className="text-center text-red-600 bg-red-100 p-4 rounded-md">{error}</div>;

  return (
    <div className="space-y-8">
      <div>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-gray-900">Dashboard Operacional</h2>
            <p className="text-gray-600 mt-2">Visão geral do poder operacional em tempo real.</p>
          </div>
          {isLoggedInArea && (
            <div className="flex items-center gap-4 w-full md:w-auto">
              <select id="obm-filter" value={selectedObm} onChange={(e) => setSelectedObm(e.target.value)} className="w-full md:w-64 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                <option value="">Todas as OBMs</option>
                {obms.map((obm) => (<option key={obm.id} value={obm.id}>{obm.abreviatura} - {obm.nome}</option>))}
              </select>
              <Button onClick={() => setIsShareModalOpen(true)} className="!w-auto">
                <Share2 className="w-4 h-4 mr-2" />
                Compartilhar
              </Button>
            </div>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard title="Militares Ativos" value={stats?.total_militares_ativos ?? 0} description="Total de militares na ativa." isLoading={isLoading} />
          <StatCard title="Viaturas Disponíveis" value={stats?.total_viaturas_disponiveis ?? 0} description="Viaturas em condições de uso." isLoading={isLoading} />
          <StatCard title="OBMs Cadastradas" value={stats?.total_obms ?? 0} description="Total de unidades operacionais." isLoading={isLoading} />
          <StatCard title="Plantões no Mês" value={stats?.total_plantoes_mes ?? 0} description="Total de plantões no mês corrente." isLoading={isLoading} />
        </div>
      </div>

      <ServicoDiaCard data={servicoDia} isLoading={isLoading} />
      
      {/* --- INÍCIO DA CORREÇÃO DE ALINHAMENTO --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        <AeronavesCard data={escalaAeronaves} isLoading={isLoading} />
        <CodecCard data={escalaCodec} isLoading={isLoading} />
      </div>
      {/* --- FIM DA CORREÇÃO DE ALINHAMENTO --- */}

      <ViaturaByObmCard data={viaturaPorObmStats} isLoading={isLoading} />
      <ViaturaDetailTable data={viaturaDetailStats} isLoading={isLoading} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ViaturaTypeChart data={viaturaTipoStats} isLoading={isLoading} lastUpdated={lastUpload} />
        <MilitarRankChart data={militarStats} isLoading={isLoading} />
      </div>

      {isLoggedInArea && (
        <ShareModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          publicUrl={publicUrl}
          shareMessage={shareMessage}
        />
      )}
    </div>
  );
}
