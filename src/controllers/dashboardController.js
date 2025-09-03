// Arquivo: src/controllers/dashboardController.js

const db = require('../config/database');
const AppError = require('../utils/AppError');

const dashboardController = {
  getStats: async (req, res) => {
    try {
      const totalMilitaresAtivos = db('militares').where({ ativo: true }).count({ count: '*' }).first();
      const totalViaturasDisponiveis = db('viaturas').where({ ativa: true }).count({ count: '*' }).first();
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

  getViaturaStats: async (req, res) => {
    try {
      const viaturasPorObm = await db('viaturas')
        .select('obm')
        .count('id as count')
        .where('ativa', true)
        // --- CORREÇÃO APLICADA AQUI ---
        .whereNotNull('obm') // Trocado de andWhereNotNull para whereNotNull
        // -----------------------------
        .groupBy('obm')
        .orderBy('count', 'desc');

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

  getMilitarStats: async (req, res) => {
    try {
      const militaresPorPosto = await db('militares')
        .select('posto_graduacao')
        .count('id as count')
        .where('ativo', true)
        .groupBy('posto_graduacao')
        .orderBy('count', 'desc');
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
