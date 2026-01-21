import { Request, Response } from 'express';
import AppError from '../utils/AppError';
import { supabaseAdmin } from '../config/supabase';

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

  async getWebVitalsSummary(_req: Request, res: Response) {
    // Exemplo simples: últimos 200 registros
    const { data, error } = await supabaseAdmin
      .from('web_vitals')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);

    if (error) {
      console.error('[metricsController] Erro ao consultar web_vitals:', error.message);
      throw new AppError('Falha ao consultar métricas.', 500);
    }

    return res.status(200).json({ items: data });
  },

  async getApiMetricsSummary(_req: Request, res: Response) {
    const { data, error } = await supabaseAdmin
      .from('api_metrics')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);

    if (error) {
      console.error('[metricsController] Erro ao consultar api_metrics:', error.message);
      throw new AppError('Falha ao consultar métricas.', 500);
    }

    return res.status(200).json({ items: data });
  }
};

export default metricsController;
