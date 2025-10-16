const axios = require('axios');
const AppError = require('../utils/AppError');
const { buildSsoAuthHeaders } = require('../utils/signSsoJwt');
const OCORRENCIAS_API_URL = process.env.OCORRENCIAS_API_URL || 'http://localhost:3001';

const estatisticasExternasController = {
  /**
   * Proxy that fetches dashboard data from the external occurrences system.
   */
  getDashboardOcorrencias: async (request, response) => {
    try {
      const headers = buildSsoAuthHeaders({
        issuer: 'sisgpo',
        audience: 'ocorrencias',
        expiresInSeconds: 120,
      });

      const requestedDate = request.query?.data;
      const targetDate =
        typeof requestedDate === 'string' && requestedDate.trim().length > 0
          ? requestedDate
          : new Date().toISOString().split('T')[0];

      const [statsRes, plantaoRes, relatorioRes, espelhoRes, espelhoBaseRes] = await Promise.all([
        axios.get(`${OCORRENCIAS_API_URL}/api/external/dashboard/stats`, { headers }),
        axios.get(`${OCORRENCIAS_API_URL}/api/external/plantao`, { headers }),
        axios.get(`${OCORRENCIAS_API_URL}/api/external/relatorio-completo`, {
          headers,
          params: {
            data_inicio: targetDate,
            data_fim: targetDate,
          },
        }),
        axios.get(`${OCORRENCIAS_API_URL}/api/external/estatisticas-por-data`, {
          headers,
          params: {
            data: targetDate,
          },
        }),
        axios.get(`${OCORRENCIAS_API_URL}/api/external/espelho-base`, { headers }),
      ]);

      return response.json({
        data: targetDate,
        stats: statsRes.data,
        plantao: plantaoRes.data,
        relatorio: relatorioRes.data,
        espelho: espelhoRes.data,
        espelhoBase: espelhoBaseRes.data,
      });
    } catch (error) {
      console.error('Falha ao buscar dados do sistema de ocorrencias:', error.message);

      if (error.code === 'ECONNREFUSED') {
        throw new AppError(
          'Nao foi possivel conectar ao sistema de ocorrencias. O servico pode estar offline.',
          503
        );
      }

      if (error.response) {
        const status = error.response.status || 500;
        const errorMessage = error.response.data?.message || error.response.statusText;

        if (status === 401) {
          throw new AppError(
            'Falha ao autenticar com o sistema de ocorrencias. Verifique a chave compartilhada entre os sistemas.',
            502
          );
        }

        throw new AppError(`Erro no sistema de ocorrencias: ${errorMessage}`, status);
      }

      throw new AppError('Erro interno ao buscar dados externos.', 500);
    }
  },
};

module.exports = estatisticasExternasController;
