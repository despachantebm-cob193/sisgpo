import { Request, Response } from 'express';
import AppError from '../utils/AppError';
import { supabaseAdmin } from '../config/supabase';
import aiAssistedValidationService from '../services/aiAssistedValidationService';

export const metricsController = {
  async storeWebVital(req: Request, res: Response) {
    const { name, value, delta, id_visita, url } = req.body as {
      name?: string;
      value?: number;
      delta?: number;
      id_visita?: string;
      url?: string;
    };

    if (!name || typeof value !== 'number') {
      throw new AppError('Métrica inválida: name e value são obrigatórios.', 400);
    }

    const { error } = await supabaseAdmin
      .from('web_vitals')
      .insert({
        name,
        value,
        delta: typeof delta === 'number' ? delta : null,
        id_visita: id_visita || null,
        url: url || null,
        user_agent: req.headers['user-agent'] || null,
      });

    if (error) {
      console.error('[metricsController] Erro ao salvar web_vital:', error.message);
      throw new AppError('Falha ao registrar métrica.', 500);
    }

    return res.status(201).json({ message: 'Métrica registrada.' });
  },

  async getWebVitalsSummary(req: Request, res: Response) {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 50;
    const offset = (page - 1) * limit;

    const [dataRes, countRes] = await Promise.all([
      supabaseAdmin
        .from('web_vitals')
        .select('*')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1),
      supabaseAdmin
        .from('web_vitals')
        .select('*', { count: 'exact', head: true })
    ]);

    if (dataRes.error || countRes.error) {
      console.error('[metricsController] Erro ao consultar web_vitals:', dataRes.error?.message || countRes.error?.message);
      throw new AppError('Falha ao consultar métricas.', 500);
    }

    const totalRecords = countRes.count || 0;
    const totalPages = Math.ceil(totalRecords / limit);

    return res.status(200).json({
      items: dataRes.data,
      pagination: {
        currentPage: page,
        totalPages,
        totalRecords,
        itemsPerPage: limit
      }
    });
  },

  async getApiMetricsSummary(req: Request, res: Response) {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 50;
    const offset = (page - 1) * limit;

    const [dataRes, countRes] = await Promise.all([
      supabaseAdmin
        .from('api_metrics')
        .select('*')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1),
      supabaseAdmin
        .from('api_metrics')
        .select('*', { count: 'exact', head: true })
    ]);

    if (dataRes.error || countRes.error) {
      console.error('[metricsController] Erro ao consultar api_metrics:', dataRes.error?.message || countRes.error?.message);
      throw new AppError('Falha ao consultar métricas.', 500);
    }

    const totalRecords = countRes.count || 0;
    const totalPages = Math.ceil(totalRecords / limit);

    return res.status(200).json({
      items: dataRes.data,
      pagination: {
        currentPage: page,
        totalPages,
        totalRecords,
        itemsPerPage: limit
      }
    });
  },

  async getMetricsReport(req: Request, res: Response) {
    const { startDate, endDate } = req.query as { startDate?: string; endDate?: string };

    if (!startDate || !endDate) {
      throw new AppError('As datas de início e fim são obrigatórias.', 400);
    }

    // 1. Fetch data for stats
    const [wvRes, apiRes] = await Promise.all([
      supabaseAdmin
        .from('web_vitals')
        .select('*')
        .gte('created_at', startDate)
        .lte('created_at', endDate),
      supabaseAdmin
        .from('api_metrics')
        .select('*')
        .gte('created_at', startDate)
        .lte('created_at', endDate)
    ]);

    if (wvRes.error || apiRes.error) {
      throw new AppError('Erro ao buscar dados para o relatório.', 500);
    }

    const wvData = wvRes.data || [];
    const apiData = apiRes.data || [];

    // 2. Calculate aggregations
    // Web Vitals
    const wvStats = {
      LCP: wvData.filter(i => i.name === 'LCP'),
      CLS: wvData.filter(i => i.name === 'CLS'),
      FID: wvData.filter(i => i.name === 'FID'),
      INP: wvData.filter(i => i.name === 'INP'),
      FCP: wvData.filter(i => i.name === 'FCP'),
    };

    const getAvg = (arr: any[]) => arr.length ? (arr.reduce((acc, i) => acc + i.value, 0) / arr.length).toFixed(2) : 'N/A';

    const wvAverages = {
      LCP: getAvg(wvStats.LCP),
      CLS: getAvg(wvStats.CLS),
      FID: getAvg(wvStats.FID),
      INP: getAvg(wvStats.INP),
      FCP: getAvg(wvStats.FCP),
      totalSamples: wvData.length
    };

    // API Metrics
    const totalRequests = apiData.length;
    const errors = apiData.filter(i => (i.status || 0) >= 400);
    const avgDuration = getAvg(apiData.map(i => ({ value: i.duration_ms || 0 })));

    // Most slow routes
    const routes = apiData.reduce((acc: any, i) => {
      const r = i.route || 'unknown';
      if (!acc[r]) acc[r] = { count: 0, totalMs: 0 };
      acc[r].count++;
      acc[r].totalMs += (i.duration_ms || 0);
      return acc;
    }, {});

    const topSlowRoutes = Object.entries(routes)
      .map(([route, s]: [string, any]) => ({
        route,
        avg: (s.totalMs / s.count).toFixed(2),
        count: s.count
      }))
      .sort((a, b) => Number(b.avg) - Number(a.avg))
      .slice(0, 5);

    const apiStats = {
      totalRequests,
      errorRate: totalRequests ? ((errors.length / totalRequests) * 100).toFixed(2) + '%' : '0%',
      avgLatency: avgDuration + 'ms',
      topSlowRoutes
    };

    // 3. Generate AI Summary
    const prompt = `
      Você é um Analista SRE/DevOps. Analise o relatório de performance do sistema SISGPO:
      Período: ${startDate} a ${endDate}
      
      WEB VITALS (Médias):
      - LCP: ${wvAverages.LCP}
      - CLS: ${wvAverages.CLS}
      - FID: ${wvAverages.FID}
      - INP: ${wvAverages.INP}
      - FCP: ${wvAverages.FCP}
      - Amostras: ${wvAverages.totalSamples}
      
      LATÊNCIA DE API:
      - Total Requests: ${apiStats.totalRequests}
      - Latência Média: ${apiStats.avgLatency}
      - Taxa de Erro: ${apiStats.errorRate}
      
      ROTAS MAIS LENTAS:
      ${topSlowRoutes.map(r => `- ${r.route}: ${r.avg}ms (${r.count} chamadas)`).join('\n')}
      
      Tarefa: Escreva um resumo executivo descritivo sobre a saúde do sistema. Seja técnico mas claro. 
      Identifique se o sistema está saudável ou se precisa de atenção imediata.
      Use Português do Brasil. Marque pontos positivos e negativos.
    `;

    const aiSummary = await aiAssistedValidationService._generate(prompt);

    return res.status(200).json({
      summary: aiSummary,
      stats: {
        wv: wvAverages,
        api: apiStats
      },
      period: { startDate, endDate }
    });
  }
};

export default metricsController;
