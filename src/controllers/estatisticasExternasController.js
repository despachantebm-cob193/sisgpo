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
      console.log('OCORRENCIAS_API_URL:', OCORRENCIAS_API_URL);
      const headers = buildSsoAuthHeaders({
        issuer: 'sisgpo',
        audience: 'ocorrencias',
        expiresInSeconds: 120,
      });
      console.log('SSO Headers gerados:', headers);

      const requestedDate = request.query?.data;
      const targetDate =
        typeof requestedDate === 'string' && requestedDate.trim().length > 0
          ? requestedDate
          : new Date().toISOString().split('T')[0];

      console.log('Data solicitada (targetDate):', targetDate);
      console.log('Chamando endpoints externos:');
      console.log(`- ${OCORRENCIAS_API_URL}/api/external/dashboard/stats`);
      console.log(`- ${OCORRENCIAS_API_URL}/api/external/plantao`);
      console.log(`- ${OCORRENCIAS_API_URL}/api/external/relatorio-completo?data_inicio=${targetDate}&data_fim=${targetDate}`);
      console.log(`- ${OCORRENCIAS_API_URL}/api/external/estatisticas-por-intervalo?data=${targetDate}`);
      console.log(`- ${OCORRENCIAS_API_URL}/api/external/espelho-base`);

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
        axios.get(`${OCORRENCIAS_API_URL}/api/external/estatisticas-por-intervalo`, {
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
      console.error('--- ERRO DETALHADO AO BUSCAR DADOS DO SISTEMA DE OCORRENCIAS ---');
      console.error('Mensagem do erro:', error.message);
      console.error('Código do erro (se houver):', error.code);
      console.error('Stack Trace:', error.stack);
      if (error.response) {
        console.error('Resposta de erro do sistema externo (status):', error.response.status);
        console.error('Resposta de erro do sistema externo (data):', error.response.data);
      }
      console.error('-----------------------------------------------------------------');

      if (error.code === 'ECONNREFUSED') {
        // Retorna uma resposta 503 diretamente em vez de lançar um erro que pode derrubar o servidor.
        return response.status(503).json({
          message: 'Nao foi possivel conectar ao sistema de ocorrencias. O servico pode estar offline.',
        });
      }

      if (error.response) {
        const status = error.response.status || 500;
        const errorMessage = error.response.data?.message || error.response.statusText;

        if (status === 401) {
          return response.status(502).json({
            message: 'Falha ao autenticar com o sistema de ocorrencias. Verifique a chave compartilhada.'
          });
        }
        return response.status(status).json({ message: `Erro no sistema de ocorrencias: ${errorMessage}` });
      }

      // Erro genérico se nenhuma das condições acima for atendida
      return response.status(500).json({ message: 'Erro interno ao processar a requisição para o sistema externo.' });
  }
  }
};

module.exports = estatisticasExternasController;
