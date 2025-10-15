// src/controllers/estatisticasExternasController.js (REVISADO)

const { knexExterno } = require('../config/database');
const AppError = require('../utils/AppError');

// Função utilitária para verificar qual tabela existe (mantida do código anterior)
const resolveFirstExistingTable = async (knex, tableNames) => {
  for (const tableName of tableNames) {
    try {
      const exists = await knex.schema.hasTable(tableName);
      if (exists) {
        return tableName;
      }
    } catch (e) {
      continue;
    }
  }
  return null;
};

const estatisticasExternasController = {
  /**
   * Obtém dados estatísticos do banco de dados externo (COCB)
   * para preencher a página EstatisticasExternas do SISGPO.
   */
  getDashboardData: async (req, res) => {
    if (!knexExterno) {
      return res.status(503).json({
        message: 'Conexão com o banco de dados externo não configurada. Verifique as variáveis de ambiente EXTERNAL_DB_*.'
      });
    }

    // Nomes das tabelas do sistema COCB (sistema_ocorrencias_dev)
    const TABELA_OCORRENCIAS = 'ocorrencias_detalhadas';
    const TABELA_OBITOS = 'obitos_registros';
    const TABELA_NATUREZAS = 'naturezas_ocorrencia';

    try {
      let totais = {
        total_plantoes: '0', // Será usado para 'Total de Ocorrências'
        ultimo_plantao_inicio: null, // Será usado para 'Data da Última Ocorrência'
        total_militares_plantao: '0', // Será usado para 'Total de Óbitos'
      };
      let escalaDetalhe = [];

      // 1. Contar Total de Ocorrências e Data da Última Ocorrência
      if (await resolveFirstExistingTable(knexExterno, [TABELA_OCORRENCIAS])) {
        const ocorrenciasRow = await knexExterno(TABELA_OCORRENCIAS)
          .countDistinct({ count: 'id' })
          .max({ max_data: 'data_ocorrencia' }) 
          .first();

        totais.total_plantoes = String(ocorrenciasRow?.count ?? '0');
        totais.ultimo_plantao_inicio = ocorrenciasRow?.max_data 
          ? new Date(ocorrenciasRow.max_data).toISOString() 
          : null;
      }

      // 2. Contar Total de Óbitos
      if (await resolveFirstExistingTable(knexExterno, [TABELA_OBITOS])) {
        const obitosRow = await knexExterno(TABELA_OBITOS)
          .count({ count: 'id' })
          .first();
          
        totais.total_militares_plantao = String(obitosRow?.count ?? '0');
      }

      // 3. Buscar Detalhes Recentes (Para a tabela 'Escalas Recentes')
      const tabelaOcorrenciasExiste = await resolveFirstExistingTable(knexExterno, [TABELA_OCORRENCIAS]);
      const tabelaNaturezasExiste = await resolveFirstExistingTable(knexExterno, [TABELA_NATUREZAS]);

      if (tabelaOcorrenciasExiste && tabelaNaturezasExiste) {
        // CORREÇÃO: Removida a coluna 'ocorrencias_detalhadas.local_ocorrencia' que causou o erro.
        // Se a coluna de localização for, na verdade, 'endereco', ajuste a linha abaixo.
        // Tentativa de usar apenas colunas essenciais para evitar erros de schema:
        const ocorrenciasRows = await knexExterno(TABELA_OCORRENCIAS)
          .select(
            `${TABELA_OCORRENCIAS}.id`,
            `${TABELA_OCORRENCIAS}.data_ocorrencia`,
            `${TABELA_NATUREZAS}.nome as natureza_nome`
          )
          .innerJoin(TABELA_NATUREZAS, `${TABELA_NATUREZAS}.id`, `${TABELA_OCORRENCIAS}.natureza_id`)
          .orderBy(`${TABELA_OCORRENCIAS}.data_ocorrencia`, 'desc')
          .limit(5);

        escalaDetalhe = ocorrenciasRows.map((row) => ({
          // Mapeamento para o formato esperado pelo frontend SISGPO
          nome: row.natureza_nome || `Ocorrência #${row.id}`,
          // Formatação da data para o 'turno' (dia do plantão no SISGPO)
          turno: new Date(row.data_ocorrencia).toLocaleDateString('pt-BR', { timeZone: 'UTC' }),
          // O campo de localização (local_ocorrencia) não está mais disponível aqui.
        }));
      }

      return res.status(200).json({
        totais,
        escalas_recentes: escalaDetalhe,
      });

    } catch (error) {
      console.error('Erro ao buscar dados do banco de dados externo (COCB):', error);
      // Retorna erro 500 se a consulta falhar (mas a conexão existia)
      return res.status(500).json({
        message: 'Erro ao processar dados do sistema externo.',
        details: error.message
      });
    }
  }
};

module.exports = estatisticasExternasController;