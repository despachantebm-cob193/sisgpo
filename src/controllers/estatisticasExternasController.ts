import { Request, Response } from 'express';
import axios from 'axios';
import AppError from '../utils/AppError';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { buildSsoAuthHeaders } = require('../utils/signSsoJwt');

const OCORRENCIAS_API_URL = process.env.OCORRENCIAS_API_URL || 'http://localhost:3001';

const estatisticasExternasController = {
  getDashboardOcorrencias: async (request: Request, response: Response) => {
    try {
      console.log('OCORRENCIAS_API_URL:', OCORRENCIAS_API_URL);
      const headers = buildSsoAuthHeaders({
        issuer: 'sisgpo',
        audience: 'ocorrencias',
        expiresInSeconds: 120,
      });
      console.log('SSO Headers gerados:', headers);

      const requestedDate = request.query?.data as string | undefined;
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

      const axiosConfig = {
        headers,
        timeout: 5000,
      };

      const defaultPayload: any = {
        data: targetDate,
        stats: { totalOcorrencias: 0, totalObitos: 0, ocorrenciasPorNatureza: [], ocorrenciasPorCrbm: [] },
        plantao: null,
        relatorio: { estatisticas: [], obitos: [] },
        espelho: [],
        espelhoBase: [],
        warning: null,
      };

      const endpoints = [
        { key: 'stats', url: `${OCORRENCIAS_API_URL}/api/external/dashboard/stats`, params: null, fallback: defaultPayload.stats },
        { key: 'plantao', url: `${OCORRENCIAS_API_URL}/api/external/plantao`, params: null, fallback: defaultPayload.plantao },
        { key: 'relatorio', url: `${OCORRENCIAS_API_URL}/api/external/relatorio-completo`, params: { data_inicio: targetDate, data_fim: targetDate }, fallback: defaultPayload.relatorio },
        { key: 'espelho', url: `${OCORRENCIAS_API_URL}/api/external/estatisticas-por-intervalo`, params: { data: targetDate }, fallback: defaultPayload.espelho },
        { key: 'espelhoBase', url: `${OCORRENCIAS_API_URL}/api/external/espelho-base`, params: null, fallback: defaultPayload.espelhoBase },
      ];

      const settled = await Promise.allSettled(
        endpoints.map(({ url, params }) =>
          axios.get(url, params ? { ...axiosConfig, params } : axiosConfig)
        )
      );

      const payload: any = { ...defaultPayload };
      const errors: string[] = [];

      settled.forEach((result, index) => {
        const { key, fallback } = endpoints[index];
        if (result.status === 'fulfilled') {
          payload[key] = (result as any).value?.data ?? fallback;
        } else {
          errors.push(key);
          payload[key] = fallback;
          console.error(`[dashboard-ocorrencias] Falha ao carregar ${key}:`, (result as any).reason?.message || (result as any).reason);
        }
      });

      if (errors.length === endpoints.length) {
        payload.warning = 'Sistema de ocorrencias indisponivel; exibindo dados vazios.';
      } else if (errors.length > 0) {
        payload.warning = `Alguns dados nao foram carregados: ${errors.join(', ')}.`;
      }

      return response.status(200).json(payload);
    } catch (error: any) {
      console.error('--- ERRO DETALHADO AO BUSCAR DADOS DO SISTEMA DE OCORRENCIAS ---');
      console.error('Mensagem do erro:', error.message);
      console.error('Codigo do erro (se houver):', error.code);
      console.error('URL da requisicao (se disponivel):', error.config?.url);
      console.error('Stack Trace:', error.stack);
      if (error.response) {
        console.error('Resposta de erro do sistema externo (status):', error.response.status);
        console.error('Resposta de erro do sistema externo (data):', error.response.data);
      }
      console.error('-----------------------------------------------------------------');

      if (error.code === 'ECONNREFUSED') {
        return response.status(503).json({
          message: `Nao foi possivel conectar ao sistema de ocorrencias em ${OCORRENCIAS_API_URL}. O servico pode estar offline ou a porta/endereco incorreto.`,
        });
      }

      if (error.code === 'ECONNABORTED') {
        return response.status(504).json({
          message: `A requisicao para o sistema de ocorrencias expirou (timeout de 5 segundos). O servico pode estar lento ou sobrecarregado.`,
        });
      }

      if (error.response) {
        const status = error.response.status || 500;
        const errorMessage = error.response.data?.message || error.response.statusText;

        if (status === 401) {
          return response.status(502).json({
            message: 'Falha ao autenticar com o sistema de ocorrencias. Verifique a chave compartilhada.',
          });
        }
        return response.status(status).json({ message: `Erro no sistema de ocorrencias: ${errorMessage}` });
      }

      return response.status(500).json({ message: 'Erro interno ao processar a requisicao para o sistema externo.' });
    }
  },
};

export = estatisticasExternasController;
