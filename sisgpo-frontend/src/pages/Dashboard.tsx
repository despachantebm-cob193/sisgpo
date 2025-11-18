import { useEffect, useState, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import api from '@/services/api';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Importação do store de UI para gerenciar o título da página
import { useUiStore } from '@/store/uiStore';

// Componentes de UI
import StatCard from '@/components/ui/StatCard';
import Button from '@/components/ui/Button';
import ShareModal from '@/components/ui/ShareModal';
import { Share2 } from 'lucide-react';

// Componentes de Gráficos e Tabelas
import ViaturaTypeChart from '@/components/charts/ViaturaTypeChart';
import MilitarRankChart from '@/components/charts/MilitarRankChart';
import ViaturaDetailTable from '@/components/dashboard/ViaturaDetailTable';
import ViaturaByObmTable from '@/components/dashboard/ViaturaByObmTable';
import ServicoDiaCard from '@/components/dashboard/ServicoDiaCard';
import AeronavesCard from '@/components/dashboard/AeronavesCard';
import CodecCard from '@/components/dashboard/CodecCard';
import TopFleetSummary from '@/components/dashboard/TopFleetSummary'; // Import the new component

// Interfaces
interface Viatura { id: number; prefixo: string; ativa: boolean; }
interface Plantao { viatura_prefixo: string | null; data_plantao: string; }
interface PaginationState { currentPage: number; totalPages: number; totalRecords: number; perPage: number; }
interface ApiResponse<T> { data: T[]; pagination: PaginationState | null; }
interface DashboardStats { total_militares_ativos: number; total_viaturas_disponiveis: number; total_obms: number; }
interface ChartStat { name: string; value: number; }
interface Obm { id: number; abreviatura: string; nome: string; }
interface ObmGrupo { nome: string; prefixos: string[]; }
interface ViaturaStatAgrupada { tipo: string; quantidade: number; obms: ObmGrupo[]; }
interface ViaturaPorObmStat {
  id: number;
  nome: string;
  quantidade: number;
  prefixos: string[];
  crbm: string | null;
  abreviatura?: string | null;
}
interface ServicoInfo {funcao: string; nome_guerra: string | null; posto_graduacao: string | null; telefone: string | null; }
interface Aeronave { prefixo: string; tipo_asa: 'fixa' | 'rotativa'; status: string; primeiro_piloto: string; segundo_piloto: string; }
interface PlantonistaCodec { turno: 'diurno' | 'noturno'; ordem_plantonista: number; nome_plantonista: string; }

export default function Dashboard() {
  const location = useLocation();
  const isLoggedInArea = location.pathname.startsWith('/app');
  const { setPageTitle, setLastUpdate: setUiLastUpdate } = useUiStore();

  // States for the new TopFleetSummary component
  const [totalViaturasAtivas, setTotalViaturasAtivas] = useState<number | null>(null);
  const [totalViaturasEmpenhadas, setTotalViaturasEmpenhadas] = useState<number | null>(null);
  const [empenhadasViaturasSet, setEmpenhadasViaturasSet] = useState<Set<string>>(new Set());
  // const [lastUpdate, setLastUpdate] = useState<string | null>(null);

  // New state for militares escalados
  const [militaresEscaladosCount, setMilitaresEscaladosCount] = useState<number | null>(null);
  const [isLoadingMilitaresEscalados, setIsLoadingMilitaresEscalados] = useState(true);

  // Existing states
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

  useEffect(() => {
    setPageTitle('Dashboard Operacional');
  }, [setPageTitle]);

  const fetchFleetSummaryData = useCallback(async () => {
    try {
      // Fetch all active viaturas
      const viaturasRes = await api.get<ApiResponse<Viatura>>('/api/admin/viaturas?ativa=true&limit=1000');
      const ativas = viaturasRes.data.data.length;
      setTotalViaturasAtivas(ativas);

      // Fetch all plantoes to find engaged viaturas
      const engaged = new Set<string>();
      let page = 1;
      const limit = 100;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      while (true) {
        const plantoesParams = new URLSearchParams({ page: String(page), limit: String(limit) });
        const response = await api.get<ApiResponse<Plantao>>(`/api/admin/plantoes?${plantoesParams.toString()}`);
        const plantoes = response.data.data ?? [];
        plantoes.forEach((plantao) => {
          const normalizedPrefix = plantao.viatura_prefixo?.trim().toUpperCase();
          if (!normalizedPrefix) return;
          const plantaoDate = new Date(plantao.data_plantao);
          plantaoDate.setHours(0, 0, 0, 0);
          if (!Number.isNaN(plantaoDate.getTime()) && plantaoDate >= today) {
            engaged.add(normalizedPrefix);
          }
        });
        const paginationInfo = response.data.pagination;
        if (!paginationInfo || paginationInfo.currentPage >= paginationInfo.totalPages) {
          break;
        }
        page += 1;
                }
            setTotalViaturasEmpenhadas(engaged.size);
            setEmpenhadasViaturasSet(engaged); // Store the set
            console.log('Dashboard: engaged set populated:', engaged); // Debug log
            setUiLastUpdate(formatDistanceToNow(new Date(), { addSuffix: true, locale: ptBR }));
          } catch (err) {
            toast.error('Não foi possível carregar o resumo da frota.');
          }
        }, [setUiLastUpdate]);
  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    const apiPrefix = isLoggedInArea ? '/api/dashboard' : '/api/public';
    try {
      const params = new URLSearchParams();
      if (isLoggedInArea && selectedObm) {
        params.append('obm_id', selectedObm);
      }
      const queryString = params.toString();
      const qs = queryString ? `?${queryString}` : '';
      const [
        statsRes,
        viaturaTipoRes,
        militarStatsRes,
        viaturaDetailRes,
        viaturaPorObmRes,
        servicoDiaRes,
        escalaAeronavesRes,
        escalaCodecRes,
        militaresEscaladosRes, // New API call
      ] = await Promise.all([
        api.get<DashboardStats>(`${apiPrefix}/stats${qs}`),
        api.get<ChartStat[]>(`${apiPrefix}/viatura-stats-por-tipo${qs}`),
        api.get<ChartStat[]>(`${apiPrefix}/militar-stats${qs}`),
        api.get<ViaturaStatAgrupada[]>(`${apiPrefix}/viatura-stats-detalhado${qs}`),
        api.get<ViaturaPorObmStat[]>(`${apiPrefix}/viatura-stats-por-obm${qs}`),
        api.get<ServicoInfo[]>(`${apiPrefix}/servico-dia${qs}`),
        api.get<Aeronave[]>(`${apiPrefix}/escala-aeronaves${qs}`),
        api.get<PlantonistaCodec[]>(`${apiPrefix}/escala-codec${qs}`),
        api.get<{ count: number }>(`${apiPrefix}/militares-escalados-count${qs}`), // Fetch new count
      ]);
      setStats(statsRes.data || null);
      setViaturaTipoStats(Array.isArray(viaturaTipoRes.data) ? viaturaTipoRes.data : []);
      setMilitarStats(Array.isArray(militarStatsRes.data) ? militarStatsRes.data : []);
      setViaturaDetailStats(Array.isArray(viaturaDetailRes.data) ? viaturaDetailRes.data : []);
      setViaturaPorObmStats(Array.isArray(viaturaPorObmRes.data) ? viaturaPorObmRes.data : []);
      setServicoDia(Array.isArray(servicoDiaRes.data) ? servicoDiaRes.data : []);
      setEscalaAeronaves(Array.isArray(escalaAeronavesRes.data) ? escalaAeronavesRes.data : []);
      setEscalaCodec(Array.isArray(escalaCodecRes.data) ? escalaCodecRes.data : []);
      setMilitaresEscaladosCount(militaresEscaladosRes.data.count); // Set new count
      setError(null);
    } catch (err) {
      setError('Não foi possível carregar os dados do dashboard.');
      console.error(err);
    } finally {
      setIsLoading(false);
      setIsLoadingMilitaresEscalados(false); // Set loading to false
    }
  }, [selectedObm, isLoggedInArea]);

  useEffect(() => {
    fetchFleetSummaryData(); // Fetch summary data
    if (isLoggedInArea) {
      const fetchAdminData = async () => {
        try {
          const [obmsRes, metadataRes] = await Promise.all([
            api.get<ApiResponse<Obm>>('/api/dashboard/obms?limit=500'),
            api.get('/api/dashboard/metadata/viaturas_last_upload')
          ]);
          setObms(obmsRes.data && Array.isArray(obmsRes.data.data) ? obmsRes.data.data : []);
          setLastUpload(new Date(metadataRes.data.value).toLocaleString('pt-BR'));
        } catch (err) { /* Não mostra erro para dados opcionais */ }
      };
      fetchAdminData();
    }
    fetchDashboardData();
  }, [fetchDashboardData, isLoggedInArea, fetchFleetSummaryData]);

  const publicUrl = `${window.location.origin}`;
  const shareMessage = `Prezados Comandantes,\n\nSegue a atualização diária dos recursos operacionais do CBMGO, disponível para consulta em tempo real através do link abaixo.\n\nEste painel centraliza as informações sobre o poder operacional para auxiliar na tomada de decisões.\n\nLink: ${publicUrl}\n\nAgradecemos a atenção.`;

  if (error) return <div className="text-center text-red-600 bg-red-100 p-4 rounded-md">{error}</div>;

  return (
    <div className="space-y-8">
      <div>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <p className="text-white mt-2">Visão geral do poder operacional em tempo real.</p>
          </div>
          {isLoggedInArea && (
            <div className="flex items-center gap-4 w-full md:w-auto">
              <select id="obm-filter" value={selectedObm} onChange={(e) => setSelectedObm(e.target.value)} className="w-full md:w-64 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                <option value="">Todas as OBMs</option>
                {obms.map((obm) => (<option key={obm.id} value={obm.id}>{obm.abreviatura} - {obm.nome}</option>))}
              </select>
              <Button onClick={() => setIsShareModalOpen(true)} className="!w-auto !bg-emerald-500 hover:!bg-emerald-600 text-white">
                <Share2 className="w-4 h-4 mr-2" />
                Compartilhar
              </Button>
          </div>
          )}
        </div>
        
        {/* Render the new component here */}
                                <TopFleetSummary
                                  ativas={totalViaturasAtivas}
                                  empenhadas={totalViaturasEmpenhadas}
                                />        {console.log('Dashboard: empenhadasViaturasSet passed to ViaturaByObmCard:', empenhadasViaturasSet)}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            title="Militares Ativos"
            value={stats?.total_militares_ativos ?? 0}
            description="Total de militares na ativa."
            isLoading={isLoading}
            variant="transparent"
          />
          <StatCard
            title="Militares Escalados"
            value={militaresEscaladosCount ?? 0}
            description="Total de militares em escala hoje/futuro."
            isLoading={isLoadingMilitaresEscalados}
            variant="transparent"
          />
          <StatCard
            title="OBMs Cadastradas"
            value={stats?.total_obms ?? 0}
            description="Total de unidades operacionais."
            isLoading={isLoading}
            variant="transparent"
          />
        </div>
      </div>

      <ServicoDiaCard data={servicoDia} isLoading={isLoading} />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        <AeronavesCard data={escalaAeronaves} isLoading={isLoading} />
        <CodecCard data={escalaCodec} isLoading={isLoading} />
      </div>

      <ViaturaByObmTable data={viaturaPorObmStats} isLoading={isLoading} empenhadasViaturas={empenhadasViaturasSet} />
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
