import { useEffect, useState } from 'react';
import api from '../services/api';

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

export default function Metrics() {
  const [webVitals, setWebVitals] = useState<WebVital[]>([]);
  const [apiMetrics, setApiMetrics] = useState<ApiMetric[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [wv, apiRes] = await Promise.all([
        api.get('/api/admin/metrics/web-vitals'),
        api.get('/api/admin/metrics/api'),
      ]);
      setWebVitals(wv.data?.items || []);
      setApiMetrics(apiRes.data?.items || []);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Falha ao carregar métricas.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-textMain">Métricas de Performance</h1>
        <button
          onClick={load}
          className="rounded-md bg-tagBlue px-3 py-2 text-white text-sm shadow hover:bg-tagBlue/90"
        >
          Atualizar
        </button>
      </div>

      {error && <div className="text-red-500 text-sm">{error}</div>}
      {loading && <div className="text-sm text-textSecondary">Carregando...</div>}

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-textMain">Web Vitals (últimos registros)</h2>
        <div className="overflow-auto rounded-lg border border-borderDark bg-card">
          <table className="min-w-full text-sm">
            <thead className="bg-black/20 text-textSecondary">
              <tr>
                <th className="px-3 py-2 text-left">Métrica</th>
                <th className="px-3 py-2 text-left">Valor</th>
                <th className="px-3 py-2 text-left">Delta</th>
                <th className="px-3 py-2 text-left">URL</th>
                <th className="px-3 py-2 text-left">Quando</th>
              </tr>
            </thead>
            <tbody>
              {webVitals.map((item) => (
                <tr key={item.id} className="border-t border-borderDark/60">
                  <td className="px-3 py-2">{item.name}</td>
                  <td className="px-3 py-2">{item.value.toFixed(2)}</td>
                  <td className="px-3 py-2">{item.delta !== undefined ? item.delta.toFixed(2) : '-'}</td>
                  <td className="px-3 py-2 max-w-xs truncate" title={item.url}>{item.url}</td>
                  <td className="px-3 py-2 text-textSecondary">
                    {new Date(item.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
              {webVitals.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-3 py-4 text-center text-textSecondary">
                    Nenhum dado coletado ainda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-textMain">Latência do Backend (últimos registros)</h2>
        <div className="overflow-auto rounded-lg border border-borderDark bg-card">
          <table className="min-w-full text-sm">
            <thead className="bg-black/20 text-textSecondary">
              <tr>
                <th className="px-3 py-2 text-left">Método</th>
                <th className="px-3 py-2 text-left">Rota</th>
                <th className="px-3 py-2 text-left">Status</th>
                <th className="px-3 py-2 text-left">Duração (ms)</th>
                <th className="px-3 py-2 text-left">Quando</th>
              </tr>
            </thead>
            <tbody>
              {apiMetrics.map((item) => (
                <tr key={item.id} className="border-t border-borderDark/60">
                  <td className="px-3 py-2">{item.method}</td>
                  <td className="px-3 py-2">{item.route}</td>
                  <td className="px-3 py-2">{item.status}</td>
                  <td className="px-3 py-2">{item.duration_ms}</td>
                  <td className="px-3 py-2 text-textSecondary">
                    {new Date(item.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
              {apiMetrics.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-3 py-4 text-center text-textSecondary">
                    Nenhum dado coletado ainda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
