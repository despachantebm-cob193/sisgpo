import { useEffect, useState, useRef, useCallback } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import api from '../services/api';
import Pagination from '../components/ui/Pagination';
import Spinner from '../components/ui/Spinner';
import MetricsReportModal from '../components/ui/MetricsReportModal';
import { FileText } from 'lucide-react';

type WebVital = {
  id: string;
  name: string;
  value: number;
  delta?: number;
  url?: string;
  user_agent?: string;
  created_at: string;
};

type ApiMetric = {
  id: string;
  method?: string;
  route?: string;
  status?: number;
  duration_ms?: number;
  created_at: string;
};

type PaginationData = {
  currentPage: number;
  totalPages: number;
  totalRecords: number;
};

export default function Metrics() {
  const [webVitals, setWebVitals] = useState<WebVital[]>([]);
  const [apiMetrics, setApiMetrics] = useState<ApiMetric[]>([]);
  const [wvPagination, setWvPagination] = useState<PaginationData | null>(null);
  const [apiPagination, setApiPagination] = useState<PaginationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  const [wvPage, setWvPage] = useState(1);
  const [apiPage, setApiPage] = useState(1);

  const wvParentRef = useRef<HTMLDivElement>(null);
  const apiParentRef = useRef<HTMLDivElement>(null);

  const fetchWebVitals = useCallback(async (page: number) => {
    try {
      const response = await api.get(`/api/admin/metrics/web-vitals?page=${page}&limit=50`);
      setWebVitals(response.data.items || []);
      setWvPagination(response.data.pagination);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Falha ao carregar Web Vitals.');
    }
  }, []);

  const fetchApiMetrics = useCallback(async (page: number) => {
    try {
      const response = await api.get(`/api/admin/metrics/api?page=${page}&limit=50`);
      setApiMetrics(response.data.items || []);
      setApiPagination(response.data.pagination);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Falha ao carregar métricas da API.');
    }
  }, []);

  const loadAll = async () => {
    setLoading(true);
    setError(null);
    await Promise.all([fetchWebVitals(wvPage), fetchApiMetrics(apiPage)]);
    setLoading(false);
  };

  useEffect(() => {
    fetchWebVitals(wvPage);
  }, [wvPage, fetchWebVitals]);

  useEffect(() => {
    fetchApiMetrics(apiPage);
  }, [apiPage, fetchApiMetrics]);

  const wvVirtualizer = useVirtualizer({
    count: webVitals.length,
    getScrollElement: () => wvParentRef.current,
    estimateSize: () => 40,
    overscan: 10,
  });

  const apiVirtualizer = useVirtualizer({
    count: apiMetrics.length,
    getScrollElement: () => apiParentRef.current,
    estimateSize: () => 40,
    overscan: 10,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-textMain capitalize">Dashboard de Métricas</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsReportModalOpen(true)}
            className="flex items-center gap-2 rounded-md border border-tagBlue bg-tagBlue/10 px-4 py-2 text-tagBlue text-sm font-semibold shadow-sm transition-all hover:bg-tagBlue/20 active:scale-95"
          >
            <FileText size={18} />
            Gerar Relatório PDF
          </button>
          <button
            onClick={loadAll}
            disabled={loading}
            className="rounded-md bg-tagBlue px-4 py-2 text-white text-sm font-semibold shadow transition-all hover:bg-tagBlue/90 active:scale-95 disabled:opacity-50"
          >
            {loading ? 'Atualizando...' : 'Atualizar Dados'}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-red-500/10 border border-red-500/50 p-3 text-red-500 text-sm">
          {error}
        </div>
      )}

      {/* WEB VITALS SECTION */}
      <section className="space-y-3 rounded-xl bg-cardSlate/40 p-4 border border-borderDark/40">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-xl font-semibold text-textMain">Web Vitals (Experiência do Usuário)</h2>
          {wvPagination && (
            <span className="text-xs text-textSecondary px-2 py-1 rounded-full bg-black/20">
              Total: {wvPagination.totalRecords}
            </span>
          )}
        </div>

        <div className="overflow-hidden rounded-lg border border-borderDark bg-searchbar/30">
          <div className="grid grid-cols-5 text-xs font-bold uppercase tracking-wider text-textSecondary bg-black/30 px-3 py-3">
            <div>Métrica</div>
            <div>Valor</div>
            <div>Delta</div>
            <div>URL</div>
            <div>Data/Hora</div>
          </div>

          <div
            ref={wvParentRef}
            className="overflow-auto scrollbar-thin scrollbar-thumb-borderDark"
            style={{ height: '400px' }}
          >
            <div style={{ height: `${wvVirtualizer.getTotalSize()}px`, width: '100%', position: 'relative' }}>
              {wvVirtualizer.getVirtualItems().map((virtualRow) => {
                const item = webVitals[virtualRow.index];
                return (
                  <div
                    key={item.id}
                    className="absolute top-0 left-0 w-full grid grid-cols-5 items-center border-b border-white/5 hover:bg-white/5 px-3 py-2 text-sm text-textMain transition-colors"
                    style={{
                      height: `${virtualRow.size}px`,
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                  >
                    <div className="font-medium text-tagBlue">{item.name}</div>
                    <div>{item.value.toFixed(2)}</div>
                    <div className={item.delta && item.delta > 0 ? 'text-premiumOrange' : 'text-emerald-400'}>
                      {item.delta !== undefined ? item.delta.toFixed(2) : '-'}
                    </div>
                    <div className="truncate pr-4 opacity-70" title={item.url}>{item.url || '/'}</div>
                    <div className="text-xs text-textSecondary">
                      {new Date(item.created_at).toLocaleString('pt-BR')}
                    </div>
                  </div>
                );
              })}
              {webVitals.length === 0 && !loading && (
                <div className="flex h-full items-center justify-center text-textSecondary">
                  Nenhuma métrica coletada.
                </div>
              )}
            </div>
          </div>
        </div>

        {wvPagination && (
          <Pagination
            currentPage={wvPage}
            totalPages={wvPagination.totalPages}
            onPageChange={setWvPage}
          />
        )}
      </section>

      {/* API METRICS SECTION */}
      <section className="space-y-3 rounded-xl bg-cardSlate/40 p-4 border border-borderDark/40">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-xl font-semibold text-textMain">Latência do Backend (Performance API)</h2>
          {apiPagination && (
            <span className="text-xs text-textSecondary px-2 py-1 rounded-full bg-black/20">
              Total: {apiPagination.totalRecords}
            </span>
          )}
        </div>

        <div className="overflow-hidden rounded-lg border border-borderDark bg-searchbar/30">
          <div className="grid grid-cols-5 text-xs font-bold uppercase tracking-wider text-textSecondary bg-black/30 px-3 py-3">
            <div>Método</div>
            <div>Rota</div>
            <div>Status</div>
            <div>Latência (ms)</div>
            <div>Data/Hora</div>
          </div>

          <div
            ref={apiParentRef}
            className="overflow-auto scrollbar-thin scrollbar-thumb-borderDark"
            style={{ height: '400px' }}
          >
            <div style={{ height: `${apiVirtualizer.getTotalSize()}px`, width: '100%', position: 'relative' }}>
              {apiVirtualizer.getVirtualItems().map((virtualRow) => {
                const item = apiMetrics[virtualRow.index];
                return (
                  <div
                    key={item.id}
                    className="absolute top-0 left-0 w-full grid grid-cols-5 items-center border-b border-white/5 hover:bg-white/5 px-3 py-2 text-sm text-textMain transition-colors"
                    style={{
                      height: `${virtualRow.size}px`,
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                  >
                    <div className="font-bold flex items-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] ${item.method === 'GET' ? 'bg-emerald-500/20 text-emerald-400' :
                        item.method === 'POST' ? 'bg-tagBlue/20 text-tagBlue' : 'bg-premiumOrange/20 text-premiumOrange'
                        }`}>
                        {item.method}
                      </span>
                    </div>
                    <div className="truncate pr-4 opacity-80">{item.route}</div>
                    <div className={Number(item.status) >= 400 ? 'text-red-400' : 'text-emerald-400'}>
                      {item.status}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-12 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${Number(item.duration_ms) > 500 ? 'bg-red-400' : 'bg-emerald-400'}`}
                          style={{ width: `${Math.min(100, (Number(item.duration_ms) / 1000) * 100)}%` }}
                        />
                      </div>
                      <span className="text-xs">{item.duration_ms}ms</span>
                    </div>
                    <div className="text-xs text-textSecondary">
                      {new Date(item.created_at).toLocaleString('pt-BR')}
                    </div>
                  </div>
                );
              })}
              {apiMetrics.length === 0 && !loading && (
                <div className="flex h-full items-center justify-center text-textSecondary">
                  Nenhuma métrica de API registrada.
                </div>
              )}
            </div>
          </div>
        </div>

        {apiPagination && (
          <Pagination
            currentPage={apiPage}
            totalPages={apiPagination.totalPages}
            onPageChange={setApiPage}
          />
        )}
      </section>

      {loading && (
        <div className="fixed bottom-8 right-8">
          <Spinner className="h-10 w-10 text-tagBlue" />
        </div>
      )}
      <MetricsReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
      />
    </div>
  );
}
