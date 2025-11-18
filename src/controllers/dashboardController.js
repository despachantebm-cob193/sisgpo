const db = require('../config/database');
const AppError = require('../utils/AppError');

// Auxiliar simples para normalizar texto
const normalize = (value) => (value ? String(value).trim().toUpperCase() : '');

const dashboardController = {
  getMetadataByKey: async (req, res) => {
    const { key } = req.params;
    const metadata = await db('metadata').where({ key }).first();
    if (!metadata) return res.status(200).json({ key, value: null });
    return res.status(200).json(metadata);
  },

  getStats: async (_req, res) => {
    try {
      const [mil, vtr, obm] = await Promise.all([
        db('militares').count({ count: '*' }).first().catch(() => ({ count: 0 })),
        db('viaturas').count({ count: '*' }).first().catch(() => ({ count: 0 })),
        db('obms').count({ count: '*' }).first().catch(() => ({ count: 0 })),
      ]);
      res.status(200).json({
        total_militares_ativos: parseInt(mil?.count ?? 0, 10),
        total_viaturas_disponiveis: parseInt(vtr?.count ?? 0, 10),
        total_obms: parseInt(obm?.count ?? 0, 10),
      });
    } catch (error) {
      console.error('ERRO AO BUSCAR ESTATISTICAS GERAIS:', error);
      throw new AppError('Nao foi possivel carregar as estatisticas do dashboard.', 500);
    }
  },

  getViaturaStatsPorTipo: async (_req, res) => {
    try {
      const viaturas = await db('viaturas').select('prefixo').where('ativa', true).catch(() => []);
      const stats = viaturas.reduce((acc, v) => {
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
      res.status(200).json(Object.values(stats).sort((a, b) => b.value - a.value));
    } catch (error) {
      console.error('ERRO AO BUSCAR ESTATISTICAS DE VIATURAS POR TIPO:', error);
      throw new AppError('Nao foi possivel carregar as estatisticas de viaturas por tipo.', 500);
    }
  },

  getMilitarStats: async (_req, res) => {
    try {
      const rows = await db('militares')
        .select('posto_graduacao')
        .count('id as count')
        .where('ativo', true)
        .groupBy('posto_graduacao')
        .orderBy('count', 'desc')
        .catch(() => []);
      const data = rows.map((r) => ({ name: r.posto_graduacao, value: parseInt(r.count, 10) }));
      res.status(200).json(data);
    } catch (error) {
      console.error('ERRO AO BUSCAR ESTATISTICAS DE MILITARES:', error);
      throw new AppError('Nao foi possivel carregar as estatisticas dos militares.', 500);
    }
  },

  getViaturaStatsDetalhado: async (_req, res) => {
    try {
      const rows = await db('viaturas as v')
        .leftJoin('obms as o', 'v.obm', 'o.nome')
        .select('v.prefixo', db.raw('COALESCE(o.abreviatura, v.obm) as local_final'))
        .where('v.ativa', true)
        .orderBy('local_final', 'asc')
        .orderBy('v.prefixo', 'asc')
        .catch(() => []);
      const stats = rows.reduce((acc, vtr) => {
        const nomeLocal = vtr.local_final || 'OBM Nao Informada';
        const p = normalize(vtr.prefixo);
        let tipo = 'OUTROS';
        if (p.startsWith('UR')) tipo = 'UR';
        else if (p.startsWith('ABT')) tipo = 'ABT';
        else if (p.startsWith('ASA')) tipo = 'ASA';
        else if (p.includes('-')) tipo = p.split('-')[0];
        if (!acc[tipo]) acc[tipo] = { tipo, quantidade: 0, obms: {} };
        acc[tipo].quantidade += 1;
        if (!acc[tipo].obms[nomeLocal]) acc[tipo].obms[nomeLocal] = [];
        acc[tipo].obms[nomeLocal].push(vtr.prefixo);
        return acc;
      }, {});
      const result = Object.values(stats)
        .map((item) => ({
          ...item,
          obms: Object.entries(item.obms).map(([nome, prefixos]) => ({ nome, prefixos })),
        }))
        .sort((a, b) => a.tipo.localeCompare(b.tipo));
      res.status(200).json(result);
    } catch (error) {
      console.error('ERRO AO BUSCAR ESTATISTICAS DETALHADAS DE VIATURAS:', error);
      throw new AppError('Nao foi possivel carregar as estatisticas detalhadas de viaturas.', 500);
    }
  },

  getViaturaStatsPorObm: async (_req, res) => {
    try {
      const rows = await db('viaturas as v')
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
        .catch(() => []);
      const acc = {};
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
      res.status(200).json(result);
    } catch (error) {
      console.error('ERRO AO BUSCAR ESTATISTICAS DE VIATURAS POR OBM:', error);
      throw new AppError('Nao foi possivel carregar as estatisticas de viaturas por OBM.', 500);
    }
  },

  getServicoDia: async (_req, res) => {
    try {
      const hasTable = await db.schema.hasTable('servico_dia').catch(() => false);
      if (!hasTable) return res.status(200).json([]);
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
      const rows = await db('servico_dia').where('data_inicio', latest.data_inicio);
      res.status(200).json(rows);
    } catch (error) {
      console.error('ERRO AO BUSCAR SERVICO DO DIA:', error);
      throw new AppError('Nao foi possivel carregar o servico do dia.', 500);
    }
  },

  // Retornos simples para manter rotas ativas; ajuste conforme necessidade real
  getEscalaAeronaves: async (_req, res) => res.status(200).json([]),
  getEscalaCodec: async (_req, res) => res.status(200).json([]),

  getMilitaresEscaladosCount: async (_req, res) => {
    try {
      const hasPm = await db.schema.hasTable('plantoes_militares').catch(() => false);
      const hasMp = await db.schema.hasTable('militar_plantao').catch(() => false);
      const pmTable = hasPm ? 'plantoes_militares' : hasMp ? 'militar_plantao' : null;
      if (!pmTable) return res.status(200).json({ count: 0 });

      const hasDP = await db.schema.hasColumn('plantoes', 'data_plantao').catch(() => false);
      const hasDI = await db.schema.hasColumn('plantoes', 'data_inicio').catch(() => false);
      const hasDF = await db.schema.hasColumn('plantoes', 'data_fim').catch(() => false);
      const cols = [];
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
      res.status(200).json({ count: parseInt(countRow?.count || 0, 10) });
    } catch (error) {
      console.error('ERRO AO BUSCAR CONTAGEM DE MILITARES ESCALADOS:', error);
      throw new AppError('Nao foi possivel carregar a contagem de militares escalados.', 500);
    }
  },
};

module.exports = dashboardController;
