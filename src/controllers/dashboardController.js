// Arquivo: backend/src/controllers/dashboardController.js (Com lógica de filtro por OBM)

const db = require('../config/database');
const AppError = require('../utils/AppError');

const dashboardController = {
  // 1. getStats atualizado para aceitar filtro de OBM
  getStats: async (req, res) => {
    const { obm_id } = req.query; // Captura o ID da OBM da query

    try {
      // Query base para militares
      const militaresQuery = db('militares').where({ ativo: true });
      if (obm_id) {
        militaresQuery.where({ obm_id });
      }
      const totalMilitaresAtivos = militaresQuery.count({ count: '*' }).first();

      // Query base para viaturas (filtrando pela OBM desnormalizada)
      const viaturasQuery = db('viaturas').where({ ativa: true });
      if (obm_id) {
        // Precisamos buscar o nome da OBM para filtrar na tabela de viaturas
        const obm = await db('obms').where({ id: obm_id }).first();
        if (obm) {
          viaturasQuery.where({ obm: obm.nome });
        }
      }
      const totalViaturasDisponiveis = viaturasQuery.count({ count: '*' }).first();

      // Query para OBMs e Plantões não são filtradas por uma única OBM no card principal
      const totalObms = db('obms').count({ count: '*' }).first();
      const totalPlantoesMes = db.raw(
        "SELECT COUNT(*) FROM plantoes WHERE data_plantao >= date_trunc('month', CURRENT_DATE) AND data_plantao < date_trunc('month', CURRENT_DATE) + interval '1 month'"
      );

      const [militaresResult, viaturasResult, obmsResult, plantoesResult] = await Promise.all([
        totalMilitaresAtivos,
        totalViaturasDisponiveis,
        totalObms,
        totalPlantoesMes
      ]);

      const formattedStats = {
        total_militares_ativos: parseInt(militaresResult.count, 10),
        total_viaturas_disponiveis: parseInt(viaturasResult.count, 10),
        total_obms: parseInt(obmsResult.count, 10),
        total_plantoes_mes: parseInt(plantoesResult.rows[0].count, 10),
      };
      res.status(200).json(formattedStats);
    } catch (error) {
      console.error("ERRO DETALHADO NO DASHBOARD CONTROLLER:", error);
      throw new AppError("Não foi possível carregar as estatísticas do dashboard.", 500);
    }
  },

  // 2. getViaturaStats atualizado para aceitar filtro de OBM
  getViaturaStats: async (req, res) => {
    const { obm_id } = req.query;
    try {
      const query = db('viaturas')
        .select('obm')
        .count('id as count')
        .where('ativa', true)
        .whereNotNull('obm')
        .groupBy('obm')
        .orderBy('count', 'desc');

      if (obm_id) {
        const obm = await db('obms').where({ id: obm_id }).first();
        if (obm) {
          query.andWhere({ obm: obm.nome });
        }
      }

      const viaturasPorObm = await query;
      const formattedData = viaturasPorObm.map(item => ({
        name: item.obm,
        value: parseInt(item.count, 10),
      }));
      res.status(200).json(formattedData);
    } catch (error) {
      console.error("ERRO AO BUSCAR ESTATÍSTICAS DE VIATURAS:", error);
      throw new AppError("Não foi possível carregar as estatísticas das viaturas.", 500);
    }
  },

  // 3. getMilitarStats atualizado para aceitar filtro de OBM
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
        query.andWhere({ obm_id });
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
};

module.exports = dashboardController;
