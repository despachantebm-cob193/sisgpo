// Arquivo: backend/src/controllers/dashboardController.js (VERSÃO COMPLETA E CORRIGIDA)

const db = require('../config/database');
const AppError = require('../utils/AppError');

// Função auxiliar para extrair o tipo da viatura a partir do prefixo
const getTipoViatura = (prefixo) => {
  if (!prefixo) return 'OUTROS';
  const partes = prefixo.split('-');
  if (partes.length > 1 && isNaN(parseInt(partes[0], 10))) {
    return partes[0].toUpperCase();
  }
  if (prefixo.toUpperCase().startsWith('UR')) return 'UR';
  if (prefixo.toUpperCase().startsWith('ABT')) return 'ABT';
  if (prefixo.toUpperCase().startsWith('ASA')) return 'ASA';
  return 'OUTROS';
};

const dashboardController = {
  /**
   * Retorna estatísticas gerais do sistema (militares, viaturas, OBMs, etc.).
   * Suporta filtragem por OBM.
   */
  getStats: async (req, res) => {
    const { obm_id } = req.query;
    try {
      const militaresQuery = db('militares').where({ ativo: true });
      const viaturasQuery = db('viaturas').where({ ativa: true });

      if (obm_id) {
        const obm = await db('obms').where({ id: obm_id }).first();
        if (obm) {
          militaresQuery.where({ obm_nome: obm.nome });
          viaturasQuery.where({ obm: obm.nome });
        }
      }

      const totalMilitaresAtivos = militaresQuery.count({ count: '*' }).first();
      const totalViaturasDisponiveis = viaturasQuery.count({ count: '*' }).first();
      const totalObms = db('obms').count({ count: '*' }).first();
      const totalPlantoesMes = db.raw("SELECT COUNT(*) FROM plantoes WHERE date_trunc('month', data_plantao) = date_trunc('month', CURRENT_DATE)").then(res => res.rows[0]);

      const [militaresResult, viaturasResult, obmsResult, plantoesResult] = await Promise.all([
        totalMilitaresAtivos, totalViaturasDisponiveis, totalObms, totalPlantoesMes
      ]);

      res.status(200).json({
        total_militares_ativos: parseInt(militaresResult.count, 10),
        total_viaturas_disponiveis: parseInt(viaturasResult.count, 10),
        total_obms: parseInt(obmsResult.count, 10),
        total_plantoes_mes: parseInt(plantoesResult.count, 10),
      });
    } catch (error) {
      console.error("ERRO AO BUSCAR ESTATÍSTICAS GERAIS:", error);
      throw new AppError("Não foi possível carregar as estatísticas do dashboard.", 500);
    }
  },

  /**
   * Retorna a contagem de militares por posto/graduação para o gráfico.
   */
  getMilitarStats: async (req, res) => {
    const { obm_id } = req.query;
    try {
      const query = db('militares')
        .select('posto_graduacao')
        .count('id as count')
        .where('ativo', true)
        .groupBy('posto_graduacao')
        .orderBy('count', 'desc');

      if (obm_id) {
        const obm = await db('obms').where({ id: obm_id }).first();
        if (obm) {
          query.andWhere({ obm_nome: obm.nome });
        }
      }

      const militaresPorPosto = await query;
      const formattedData = militaresPorPosto.map(item => ({
        name: item.posto_graduacao,
        value: parseInt(item.count, 10),
      }));
      res.status(200).json(formattedData);
    } catch (error) {
      console.error("ERRO AO BUSCAR ESTATÍSTICAS DE MILITARES:", error);
      throw new AppError("Não foi possível carregar as estatísticas dos militares.", 500);
    }
  },

  /**
   * Retorna a contagem de viaturas por tipo para o gráfico.
   */
  getViaturaStatsPorTipo: async (req, res) => {
    const { obm_id } = req.query;
    try {
      const query = db('viaturas').select('prefixo').where('ativa', true);
      
      if (obm_id) {
        const obm = await db('obms').where({ id: obm_id }).first();
        if (obm) {
          query.andWhere({ obm: obm.nome });
        }
      }

      const viaturasAtivas = await query;
      const stats = viaturasAtivas.reduce((acc, vtr) => {
        const tipo = getTipoViatura(vtr.prefixo);
        if (!acc[tipo]) { acc[tipo] = { name: tipo, value: 0 }; }
        acc[tipo].value++;
        return acc;
      }, {});
      const chartData = Object.values(stats).sort((a, b) => b.value - a.value);
      res.status(200).json(chartData);
    } catch (error) {
      console.error("ERRO AO BUSCAR ESTATÍSTICAS DE VIATURAS POR TIPO:", error);
      throw new AppError("Não foi possível carregar as estatísticas de viaturas por tipo.", 500);
    }
  },

  /**
   * Retorna um detalhamento das viaturas agrupadas por tipo e OBM.
   */
  getViaturaStatsDetalhado: async (req, res) => {
    const { obm_id } = req.query;
    try {
      const query = db('viaturas as v')
        .leftJoin('obms as o', 'v.obm', 'o.nome')
        .select('v.prefixo', db.raw('COALESCE(o.abreviatura, v.obm) as local_final'))
        .where('v.ativa', true)
        .orderBy('local_final', 'asc').orderBy('v.prefixo', 'asc');

      if (obm_id) {
        const obm = await db('obms').where({ id: obm_id }).first();
        if (obm) { query.andWhere('v.obm', obm.nome); }
      }

      const viaturasAtivas = await query;
      const stats = viaturasAtivas.reduce((acc, vtr) => {
        const tipo = getTipoViatura(vtr.prefixo);
        const nomeLocal = vtr.local_final || 'OBM Não Informada';
        if (!acc[tipo]) { acc[tipo] = { tipo: tipo, quantidade: 0, obms: {} }; }
        acc[tipo].quantidade++;
        if (!acc[tipo].obms[nomeLocal]) { acc[tipo].obms[nomeLocal] = []; }
        acc[tipo].obms[nomeLocal].push(vtr.prefixo);
        return acc;
      }, {});
      const resultadoFinal = Object.values(stats).map(item => ({
        ...item,
        obms: Object.entries(item.obms).map(([nome, prefixos]) => ({ nome, prefixos }))
      })).sort((a, b) => a.tipo.localeCompare(b.tipo));
      res.status(200).json(resultadoFinal);
    } catch (error) {
      console.error("ERRO AO BUSCAR ESTATÍSTICAS DETALHADAS DE VIATURAS:", error);
      throw new AppError("Não foi possível carregar as estatísticas detalhadas de viaturas.", 500);
    }
  },

  /**
   * Retorna a contagem de viaturas por OBM.
   */
  getViaturaStatsPorObm: async (req, res) => {
    try {
      const [obms, viaturas] = await Promise.all([
        db('obms').select('id', 'nome', 'abreviatura').orderBy('abreviatura', 'asc'),
        db('viaturas').select('prefixo', 'obm as nome_obm').where('ativa', true)
      ]);
      const viaturasPorNomeObm = viaturas.reduce((acc, vtr) => {
        const nomeObm = vtr.nome_obm || 'Sem OBM';
        if (!acc[nomeObm]) { acc[nomeObm] = []; }
        acc[nomeObm].push(vtr.prefixo);
        return acc;
      }, {});
      const resultadoFinal = obms.map(obm => {
        const prefixos = viaturasPorNomeObm[obm.nome] || [];
        return { id: obm.id, nome: obm.abreviatura, quantidade: prefixos.length, prefixos: prefixos.sort() };
      });
      res.status(200).json(resultadoFinal);
    } catch (error) {
      console.error("ERRO AO BUSCAR ESTATÍSTICAS DE VIATURAS POR OBM:", error);
      throw new AppError("Não foi possível carregar as estatísticas de viaturas por OBM.", 500);
    }
  },

  /**
   * Busca um metadado específico pela chave.
   */
  getMetadataByKey: async (req, res) => {
    const { key } = req.params;
    try {
      const metadata = await db('metadata').where({ key }).first();
      if (!metadata) { return res.status(404).json({ message: 'Metadado não encontrado.' }); }
      res.status(200).json(metadata);
    } catch (error) {
      console.error(`ERRO AO BUSCAR METADADO '${key}':`, error);
      throw new AppError('Não foi possível buscar a informação de metadados.', 500);
    }
  },

  /**
   * Busca os profissionais (militares e civis) escalados para o serviço do dia.
   * Esta é a função que alimenta o card "Serviço de Dia" no Dashboard.
   */
  getServicoDia: async (req, res) => {
    const dataBusca = new Date().toISOString().split('T')[0];

    try {
      // 1. Busca os militares escalados no dia
      const servicoMilitares = await db('servico_dia as sd')
        .join('militares as m', 'sd.pessoa_id', 'm.id')
        .select(
          'sd.funcao',
          'm.posto_graduacao',
          db.raw("COALESCE(NULLIF(TRIM(m.nome_guerra), ''), m.nome_completo) as nome_guerra")
        )
        .where({ 'sd.data': dataBusca, 'sd.pessoa_type': 'militar' });

      // 2. Busca os civis escalados no dia
      const servicoCivis = await db('servico_dia as sd')
        .join('civis as c', 'sd.pessoa_id', 'c.id')
        .select(
          'sd.funcao',
          db.raw("'' as posto_graduacao"), // Retorna um posto/graduação vazio para civis
          'c.nome_completo as nome_guerra' // Usa o nome completo do civil
        )
        .where({ 'sd.data': dataBusca, 'sd.pessoa_type': 'civil' });

      // 3. Combina os resultados das duas consultas
      const servicoCompleto = [...servicoMilitares, ...servicoCivis];
      
      res.status(200).json(servicoCompleto);
    } catch (error) {
      console.error("ERRO AO BUSCAR SERVIÇO DO DIA PARA O DASHBOARD:", error);
      throw new AppError("Não foi possível carregar os dados do serviço de dia.", 500);
    }
  },
};

module.exports = dashboardController;
