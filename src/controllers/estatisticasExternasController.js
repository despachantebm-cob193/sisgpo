// sisgpo/src/controllers/estatisticasExternasController.js

const axios = require('axios');
const jwt = require('jsonwebtoken');
const AppError = require('../utils/AppError');

// Busque estas variáveis do seu ambiente (.env) em produção
const SSO_SHARED_SECRET = process.env.SSO_SHARED_SECRET || 'seu-segredo-compartilhado';
const OCORRENCIAS_API_URL = process.env.OCORRENCIAS_API_URL || 'http://localhost:3001';

const estatisticasExternasController = {
  /**
   * Atua como um proxy para buscar dados do sistema de ocorrências.
   */
  getDashboardOcorrencias: async (request, response) => {
    try {
      // 1. Gera um token JWT de curta duração para autenticar a requisição
      const token = jwt.sign({ system: 'sisgpo' }, SSO_SHARED_SECRET, { expiresIn: '1m' });

      // 2. Faz a requisição para a API do sistema de ocorrências
      const { data } = await axios.get(`${OCORRENCIAS_API_URL}/api/external/dashboard`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      // 3. Retorna os dados obtidos para o frontend do sisgpo
      return response.json(data);

    } catch (error) {
      console.error('Falha ao buscar dados do sistema de ocorrências:', error.message);
      // Se a conexão for recusada, o outro servidor pode estar offline
      if (error.code === 'ECONNREFUSED') {
        throw new AppError('Não foi possível conectar ao sistema de ocorrências. O serviço pode estar offline.', 503); // Service Unavailable
      }
      // Repassa o erro que a outra API pode ter retornado (ex: 401 Unauthorized)
      if (error.response) {
        throw new AppError(`Erro no sistema de ocorrências: ${error.response.data.message || error.response.statusText}`, error.response.status);
      }
      throw new AppError('Erro interno ao buscar dados externos.', 500);
    }
  },
};

module.exports = estatisticasExternasController;