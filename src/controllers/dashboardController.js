const pool = require('../config/database');
const AppError = require('../utils/AppError');

const dashboardController = {
  getStats: async (req, res) => {
    try {
      // Correção: A coluna se chama 'data_plantao', e não 'data'.
      const query = `
        SELECT
          (SELECT COUNT(*) FROM militares WHERE ativo = TRUE) AS total_militares_ativos,
          (SELECT COUNT(*) FROM viaturas WHERE ativa = TRUE) AS total_viaturas_disponiveis,
          (SELECT COUNT(*) FROM obms WHERE ativo = TRUE) AS total_obms,
          (SELECT COUNT(*) FROM plantoes WHERE data_plantao >= date_trunc('month', CURRENT_DATE) AND data_plantao < date_trunc('month', CURRENT_DATE) + interval '1 month') AS total_plantoes_mes
      `;
      
      const result = await pool.query(query);
      const stats = result.rows[0];

      // Converte os valores para inteiros, pois o COUNT retorna BigInt
      const formattedStats = {
        total_militares_ativos: parseInt(stats.total_militares_ativos, 10),
        total_viaturas_disponiveis: parseInt(stats.total_viaturas_disponiveis, 10),
        total_obms: parseInt(stats.total_obms, 10),
        total_plantoes_mes: parseInt(stats.total_plantoes_mes, 10),
      };

      res.status(200).json(formattedStats);
    } catch (error) {
      console.error("ERRO DETALHADO NO DASHBOARD CONTROLLER:", error);
      throw new AppError("Não foi possível carregar as estatísticas do dashboard.", 500);
    }
  },
};

module.exports = dashboardController;
