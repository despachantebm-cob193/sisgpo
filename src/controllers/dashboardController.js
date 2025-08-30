// src/controllers/dashboardController.js
const db = require('../config/database');
const AppError = require('../utils/AppError');

const dashboardController = {
  getStats: async (req, res) => {
    try {
      // Usando Knex para construir as queries de contagem
      const totalMilitaresAtivos = db('militares').where({ ativo: true }).count({ count: '*' }).first();
      const totalViaturasDisponiveis = db('viaturas').where({ ativa: true }).count({ count: '*' }).first();
      const totalObms = db('obms').where({ ativo: true }).count({ count: '*' }).first();
      
      // Para contagem de plantões no mês corrente, a query raw ainda é mais direta
      const totalPlantoesMes = db.raw(
        "SELECT COUNT(*) FROM plantoes WHERE data_plantao >= date_trunc('month', CURRENT_DATE) AND data_plantao < date_trunc('month', CURRENT_DATE) + interval '1 month'"
      );

      // Executa todas as queries em paralelo
      const [
        militaresResult,
        viaturasResult,
        obmsResult,
        plantoesResult
      ] = await Promise.all([
        totalMilitaresAtivos,
        totalViaturasDisponiveis,
        totalObms,
        totalPlantoesMes
      ]);

      // Formata os resultados
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
};

module.exports = dashboardController;
