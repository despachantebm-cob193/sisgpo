import { Request, Response } from 'express';
import db from '../config/database';
import AppError from '../utils/AppError';

const normalize = (value: string | null | undefined) => (value ? String(value).trim().toUpperCase() : '');

type ViaturaStatsDetalhadoRow = {
  prefixo: string;
  local_final: string | null;
};

type ViaturaPorObmRow = {
  obm_id: number | null;
  obm_crbm: string | null;
  obm_abreviatura: string | null;
  obm: string | null;
  prefixo: string;
};

const dashboardController = {
  getMetadataByKey: async (req: Request, res: Response) => {
    const { key } = req.params;
    const metadata = await db('metadata').where({ key }).first();
    if (!metadata) return res.status(200).json({ key, value: null });
    return res.status(200).json(metadata);
  },

  getStats: async (_req: Request, res: Response) => {
    try {
      const [mil, vtr, obm] = await Promise.all([
        db('militares').count({ count: '*' }).first().catch(() => ({ count: 0 })),
        db('viaturas').count({ count: '*' }).first().catch(() => ({ count: 0 })),
        db('obms').count({ count: '*' }).first().catch(() => ({ count: 0 })),
      ]);
      return res.status(200).json({
        total_militares_ativos: parseInt((mil as any)?.count ?? 0, 10),
        total_viaturas_disponiveis: parseInt((vtr as any)?.count ?? 0, 10),
        total_obms: parseInt((obm as any)?.count ?? 0, 10),
      });
    } catch (error) {
      console.error('ERRO AO BUSCAR ESTATISTICAS GERAIS:', error);
      throw new AppError('Nao foi possivel carregar as estatisticas do dashboard.', 500);
    }
  },

  getViaturaStatsPorTipo: async (_req: Request, res: Response) => {
    try {
      const viaturas = await db('viaturas').select('prefixo').where('ativa', true).catch(() => []);
      const stats = (viaturas as Array<{ prefixo: string }>).reduce((acc: any, v) => {
        const p = normalize(v.prefixo);
        let tipo = 'OUTROS';
        if (p.startsWith('UR')) tipo = 'UR';
        else if (p.startsWith('ABT')) tipo = 'ABT';
        else if (p.startsWith('ASA')) tipo = 'ASA';
        else if (p.includes('-')) tipo = p.split('-')[0];
        if (!acc[tipo]) acc[tipo] = { name: tipo, value: 0 };
        acc[tipo].value += 1;
        return acc;
      }, {});
      return res.status(200).json(Object.values(stats).sort((a: any, b: any) => b.value - a.value));
    } catch (error) {
      console.error('ERRO AO BUSCAR ESTATISTICAS DE VIATURAS POR TIPO:', error);
      throw new AppError('Nao foi possivel carregar as estatisticas de viaturas por tipo.', 500);
    }
  },

  getMilitarStats: async (_req: Request, res: Response) => {
    try {
      const rows = await db('militares')
        .select('posto_graduacao')
        .count('id as count')
        .where('ativo', true)
        .groupBy('posto_graduacao')
        .orderBy('count', 'desc')
        .catch(() => []);
      const data = (rows as any[]).map((r) => ({ name: r.posto_graduacao, value: parseInt(r.count, 10) }));
      return res.status(200).json(data);
    } catch (error) {
      console.error('ERRO AO BUSCAR ESTATISTICAS DE MILITARES:', error);
      throw new AppError('Nao foi possivel carregar as estatisticas dos militares.', 500);
    }
  },

  getViaturaStatsDetalhado: async (_req: Request, res: Response) => {
    try {
      const rows = (await db('viaturas as v')
        .leftJoin('obms as o', 'v.obm', 'o.nome')
        .select('v.prefixo', db.raw('COALESCE(o.abreviatura, v.obm) as local_final'))
        .where('v.ativa', true)
        .orderBy('local_final', 'asc')
        .orderBy('v.prefixo', 'asc')
        .catch(() => [])) as ViaturaStatsDetalhadoRow[];

      const stats = rows.reduce((acc: any, vtr) => {
        const nomeLocal = vtr.local_final || 'OBM Nao Informada';
        const p = normalize(vtr.prefixo);
        let tipo = 'OUTROS';
        if (p.startsWith('UR')) tipo = 'UR';
        else if (p.startsWith('ABT')) tipo = 'ABT';
        else if (p.startsWith('ASA')) tipo = 'ASA';
        else if (p.includes('-')) tipo = p.split('-')[0];
        if (!acc[tipo]) acc[tipo] = { tipo, quantidade: 0, obms: {} as Record<string, string[]> };
        acc[tipo].quantidade += 1;
        if (!acc[tipo].obms[nomeLocal]) acc[tipo].obms[nomeLocal] = [];
        acc[tipo].obms[nomeLocal].push(vtr.prefixo);
        return acc;
      }, {});
      const result = Object.values(stats)
        .map((item: any) => ({
          ...item,
          obms: Object.entries(item.obms).map(([nome, prefixos]) => ({ nome, prefixos })),
        }))
        .sort((a: any, b: any) => a.tipo.localeCompare(b.tipo));
      return res.status(200).json(result);
    } catch (error) {
      console.error('ERRO AO BUSCAR ESTATISTICAS DETALHADAS DE VIATURAS:', error);
      throw new AppError('Nao foi possivel carregar as estatisticas detalhadas de viaturas.', 500);
    }
  },

  getViaturaStatsPorObm: async (_req: Request, res: Response) => {
    try {
      const rows = (await db('viaturas as v')
        .leftJoin('obms as o', 'v.obm', 'o.nome')
        .select(
          'o.id as obm_id',
          'o.crbm as obm_crbm',
          'o.abreviatura as obm_abreviatura',
          db.raw('COALESCE(o.abreviatura, v.obm) as obm'),
          'v.prefixo'
        )
        .where('v.ativa', true)
        .orderBy('obm', 'asc')
        .catch(() => [])) as ViaturaPorObmRow[];

      const acc: Record<
        string,
        { id: number | null; nome: string; prefixos: string[]; crbm: string | null; abreviatura: string | null }
      > = {};
      rows.forEach((r) => {
        const key = r.obm || 'Sem OBM';
        if (!acc[key]) {
          acc[key] = {
            id: r.obm_id ?? null,
            nome: key,
            prefixos: [],
            crbm: r.obm_crbm ?? null,
            abreviatura: r.obm_abreviatura ?? null,
          };
        }
        acc[key].prefixos.push(r.prefixo);
      });
      const result = Object.values(acc).map((entry) => ({
        id: entry.id,
        nome: entry.nome,
        quantidade: entry.prefixos.length,
        prefixos: entry.prefixos,
        crbm: entry.crbm,
        abreviatura: entry.abreviatura,
      }));
      return res.status(200).json(result);
    } catch (error) {
      console.error('ERRO AO BUSCAR ESTATISTICAS DE VIATURAS POR OBM:', error);
      throw new AppError('Nao foi possivel carregar as estatisticas de viaturas por OBM.', 500);
    }
  },

  getServicoDia: async (_req: Request, res: Response) => {
    try {
      const hasTable = await db.schema.hasTable('servico_dia').catch(() => false);
      if (!hasTable) return res.status(200).json([]);

      const hasDataInicio = await db.schema.hasColumn('servico_dia', 'data_inicio').catch(() => false);
      const hasDataFim = await db.schema.hasColumn('servico_dia', 'data_fim').catch(() => false);
      if (!hasDataInicio || !hasDataFim) return res.status(200).json([]);

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      const latest = await db('servico_dia')
        .where('data_inicio', '<=', tomorrow.toISOString())
        .andWhere('data_fim', '>=', today.toISOString())
        .orderBy('data_inicio', 'desc')
        .first();
      if (!latest) return res.status(200).json([]);
      const rows = await db('servico_dia').where('data_inicio', (latest as any).data_inicio);
      return res.status(200).json(rows);
    } catch (error) {
      console.error('ERRO AO BUSCAR SERVICO DO DIA:', error);
      throw new AppError('Nao foi possivel carregar o servico do dia.', 500);
    }
  },

  getEscalaAeronaves: async (_req: Request, res: Response) => res.status(200).json([]),
  getEscalaCodec: async (_req: Request, res: Response) => res.status(200).json([]),

  getMilitaresEscaladosCount: async (_req: Request, res: Response) => {
    try {
      const hasPm = await db.schema.hasTable('plantoes_militares').catch(() => false);
      const hasMp = await db.schema.hasTable('militar_plantao').catch(() => false);
      const pmTable = hasPm ? 'plantoes_militares' : hasMp ? 'militar_plantao' : null;
      if (!pmTable) return res.status(200).json({ count: 0 });

      const hasDP = await db.schema.hasColumn('plantoes', 'data_plantao').catch(() => false);
      const hasDI = await db.schema.hasColumn('plantoes', 'data_inicio').catch(() => false);
      const hasDF = await db.schema.hasColumn('plantoes', 'data_fim').catch(() => false);
      const cols: string[] = [];
      if (hasDP) cols.push('p.data_plantao');
      if (hasDI) cols.push('p.data_inicio');
      if (hasDF) cols.push('p.data_fim');
      const dateExpr = cols.length > 1 ? `COALESCE(${cols.join(', ')})` : cols[0] || 'CURRENT_DATE';

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const base = db(`${pmTable} as mp`).join('plantoes as p', 'mp.plantao_id', 'p.id');
      const countRow = await base
        .whereRaw(`${dateExpr} >= ?`, [today.toISOString().split('T')[0]])
        .countDistinct('mp.militar_id as count')
        .first();
      return res.status(200).json({ count: parseInt((countRow as any)?.count || 0, 10) });
    } catch (error) {
      console.error('ERRO AO BUSCAR CONTAGEM DE MILITARES ESCALADOS:', error);
      throw new AppError('Nao foi possivel carregar a contagem de militares escalados.', 500);
    }
  },
};

export = dashboardController;
