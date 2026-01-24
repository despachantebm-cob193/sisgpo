import { useEffect, useState, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { dashboardService } from '@/services/dashboardService';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Importação do store de UI para gerenciar o título da página
import { useUiStore } from '@/store/uiStore';

// Custom Hook
import { useDashboardData } from '@/hooks/useDashboardData';

// Componentes de UI
import StatCard from '@/components/ui/StatCard';
import Button from '@/components/ui/Button';
import ShareModal from '@/components/ui/ShareModal';
import { Share2 } from 'lucide-react';

// Componentes de Gráficos e Tabelas
import ViaturaTypeChart from '@/components/charts/ViaturaTypeChart';
import MilitarRankChart from '@/components/charts/MilitarRankChart';
import MilitarByCrbmChart from '@/components/charts/MilitarByCrbmChart';
import ViaturaDetailTable from '@/components/dashboard/ViaturaDetailTable';
import ViaturaByObmTable from '@/components/dashboard/ViaturaByObmTable';
import ServicoDiaCard from '@/components/dashboard/ServicoDiaCard';
import AeronavesCard from '@/components/dashboard/AeronavesCard';
import CodecCard from '@/components/dashboard/CodecCard';

// Interfaces
import { Obm } from '@/types/entities';

export default function Dashboard() {
  const location = useLocation();
  const isLoggedInArea = location.pathname.startsWith('/app');
  const { setPageTitle, setLastUpdate: setUiLastUpdate } = useUiStore();

  // States for TopFleetSummary (kept local for now)
  const [totalViaturasAtivas, setTotalViaturasAtivas] = useState<number | null>(null);
  const [totalViaturasEmpenhadas, setTotalViaturasEmpenhadas] = useState<number | null>(null);
  const [empenhadasViaturasSet, setEmpenhadasViaturasSet] = useState<Set<string>>(new Set());

  // Filter State
  const [obms, setObms] = useState<Obm[]>([]);
  const [selectedObm, setSelectedObm] = useState<string>('');
  const [lastUpload, setLastUpload] = useState<string | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Use Custom Hook for Data Fetching
  const {
    stats,
    viaturaTipoStats,
    militarStats,
    militarByCrbmStats,
    viaturaDetailStats,
    viaturaPorObmStats,
    servicoDia,
    escalaAeronaves,
    escalaCodec,
    militaresEscaladosCount,
    isLoading,
    error
  } = useDashboardData(selectedObm);

  useEffect(() => {
    setPageTitle('Dashboard Operacional');
  }, [setPageTitle]);

  const fetchFleetSummaryData = useCallback(async () => {
    try {
      // Fetch all active viaturas
      const ativas = await dashboardService.getViaturasAtivasCount();
      setTotalViaturasAtivas(ativas);

      // Fetch engaged viaturas
      const { count, engagedSet } = await dashboardService.getViaturasEmpenhadasCount();

      setTotalViaturasEmpenhadas(count);
      setEmpenhadasViaturasSet(engagedSet);
      setUiLastUpdate(formatDistanceToNow(new Date(), { addSuffix: true, locale: ptBR }));
    } catch (err) {
      toast.error('Não foi possível carregar o resumo da frota.');
    }
  }, [setUiLastUpdate]);

  useEffect(() => {
    fetchFleetSummaryData(); // Fetch summary data independently

    if (isLoggedInArea) {
      const fetchAdminData = async () => {
        try {
          const obmsData = await dashboardService.getObms();
          setObms(obmsData);
          // Metadata fetch temporarily disabled
          // const metadataRes = await api.get('/api/dashboard/metadata/viaturas_last_upload');
          // setLastUpload(new Date(metadataRes.data.value).toLocaleString('pt-BR'));
        } catch (err) { /* Não mostra erro para dados opcionais */ }
      };
      fetchAdminData();
    }
  }, [isLoggedInArea, fetchFleetSummaryData]);

  const publicUrl = `${window.location.origin}`;
  const shareMessage = `Prezados Comandantes,\n\nSegue a atualização diária dos recursos operacionais do CBMGO, disponível para consulta em tempo real através do link abaixo.\n\nEste painel centraliza as informações sobre o poder operacional para auxiliar na tomada de decisões.\n\nLink: ${publicUrl}\n\nAgradecemos a atenção.`;

  if (error) return <div className="text-center text-red-600 bg-red-100 p-4 rounded-md">{error}</div>;

  return (
    <div className="space-y-8">
      <div>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div className="w-full">
            <p
              className="text-slate-400 mt-2 font-mono text-xs sm:text-sm tracking-wide whitespace-normal break-words leading-relaxed w-full max-w-full pr-2"
              style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}
            >
              <span className="text-cyan-400 mr-2">::</span>
              Visão geral do poder operacional em tempo real
            </p>
          </div>
          {isLoggedInArea && (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full md:w-auto mt-4 md:mt-0">
              <div className="relative w-full md:w-64 group">
                <select
                  id="obm-filter"
                  value={selectedObm}
                  onChange={(e) => setSelectedObm(e.target.value)}
                  className="w-full appearance-none bg-[#0f141e] text-slate-200 border border-slate-700 rounded px-4 py-3 font-mono text-sm shadow-[0_0_10px_rgba(0,0,0,0.3)] focus:outline-none focus:border-cyan-500 focus:shadow-[0_0_15px_rgba(34,211,238,0.3)] transition-all truncate"
                >
                  <option value="">Todas as OBMs</option>
                  {Array.isArray(obms) && obms.map((obm) => (<option key={obm.id || obm.nome} value={obm.id || ''}>{obm.abreviatura} - {obm.nome}</option>))}
                </select>
                {/* Custom Arrow */}
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-cyan-500/50 group-hover:text-cyan-400 transition-colors">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd"></path></svg>
                </div>
              </div>

              <Button onClick={() => setIsShareModalOpen(true)} className="w-full sm:!w-auto !bg-emerald-500/10 !border !border-emerald-500/50 !text-emerald-400 hover:!bg-emerald-500/20 hover:!shadow-[0_0_15px_rgba(16,185,129,0.4)] backdrop-blur-sm transition-all font-mono tracking-wide uppercase text-xs font-bold flex justify-center py-3">
                <Share2 className="w-4 h-4 mr-2" />
                Compartilhar
              </Button>
            </div>
          )}
        </div>

        {/* Stats Grid - Vertical on Mobile, Grid on Desktop */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard
            title="Viaturas Ativas"
            value={totalViaturasAtivas ?? 0}
            isLoading={totalViaturasAtivas === null}
            variant="transparent"
          />
          <StatCard
            title="Viaturas Empenhadas"
            value={totalViaturasEmpenhadas ?? 0}
            isLoading={totalViaturasEmpenhadas === null}
            variant="transparent"
          />
          <StatCard
            title="Militares Ativos"
            value={stats?.total_militares_ativos ?? 0}
            isLoading={isLoading}
            variant="transparent"
          />
          <StatCard
            title="Militares Escalados"
            value={militaresEscaladosCount ?? 0}
            isLoading={isLoading}
            variant="transparent"
          />
          <StatCard
            title="OBMs Cadastradas"
            value={stats?.total_obms ?? 0}
            isLoading={isLoading}
            variant="transparent"
          />
        </div>
      </div>

      <ServicoDiaCard data={servicoDia} isLoading={isLoading} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        <AeronavesCard data={escalaAeronaves} isLoading={isLoading} lastUpdated={lastUpload} />
        <CodecCard data={escalaCodec} isLoading={isLoading} lastUpdated={lastUpload} />
      </div>

      <ViaturaByObmTable data={viaturaPorObmStats} isLoading={isLoading} empenhadasViaturas={empenhadasViaturasSet} />
      <ViaturaDetailTable data={viaturaDetailStats} isLoading={isLoading} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ViaturaTypeChart data={viaturaTipoStats} isLoading={isLoading} lastUpdated={lastUpload} />
        <MilitarRankChart data={militarStats} isLoading={isLoading} />
      </div>

      <div className="grid grid-cols-1 gap-6">
        <MilitarByCrbmChart data={militarByCrbmStats} isLoading={isLoading} />
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
