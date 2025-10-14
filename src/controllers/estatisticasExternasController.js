// src/controllers/estatisticasExternasController.js

const db = require('../config/database');
const AppError = require('../utils/AppError');

const pickFirstValue = (row, keys) => {
  if (!row) return null;
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(row, key) && row[key] !== null && row[key] !== undefined) {
      return row[key];
    }
  }
  return null;
};

const resolveFirstExistingTable = async (knexInstance, candidates) => {
  for (const tableName of candidates) {
    // eslint-disable-next-line no-await-in-loop
    const exists = await knexInstance.schema.hasTable(tableName);
    if (exists) return tableName;
  }
  return null;
};

const estatisticasExternasController = {
  getDashboardData: async (req, res) => {
    try {
      const knexExterno = db.knexExterno;

      if (!knexExterno) {
        throw new AppError(
          'Fonte de dados externa nao configurada. Defina as variaveis EXTERNAL_DB_* no .env.',
          503
        );
      }

      const tabelaPlantoes = await resolveFirstExistingTable(knexExterno, [
        'plantao',
        'plantoes',
        'plantao_servico',
      ]);

      let totais = {
        total_plantoes: '0',
        ultimo_plantao_inicio: null,
        total_militares_plantao: '0',
      };

      if (tabelaPlantoes) {
        const totaisRow = await knexExterno(tabelaPlantoes)
          .countDistinct({ total_plantoes: 'id' })
          .max({ ultimo_plantao_inicio: 'data_inicio' })
          .first();

        totais = {
          total_plantoes: totaisRow?.total_plantoes ? String(totaisRow.total_plantoes) : '0',
          ultimo_plantao_inicio: totaisRow?.ultimo_plantao_inicio
            ? new Date(totaisRow.ultimo_plantao_inicio).toISOString()
            : null,
          total_militares_plantao: '0',
        };
      }

      const tabelaMilitarPlantao = await resolveFirstExistingTable(knexExterno, [
        'militar_plantao',
        'plantao_militar',
      ]);

      if (tabelaMilitarPlantao) {
        const totalMilitaresPlantao = await knexExterno(tabelaMilitarPlantao)
          .count({ count: 'id' })
          .first();

        const totalValue =
          totalMilitaresPlantao?.count ??
          totalMilitaresPlantao?.total ??
          totalMilitaresPlantao?.total_militares ??
          '0';

        totais.total_militares_plantao = String(totalValue);
      }

      const tabelaEscalas = await resolveFirstExistingTable(knexExterno, [
        'escalas',
        'escala_aeronaves',
        'escala_codec',
        'servico_dia',
      ]);

      let escalaDetalhe = [];

      if (tabelaEscalas) {
        const escalaRows = await knexExterno(tabelaEscalas)
          .select('*')
          .orderBy('id', 'desc')
          .limit(5);

        escalaDetalhe = escalaRows.map((row) => {
          const nome =
            pickFirstValue(row, ['nome', 'descricao', 'titulo', 'prefixo']) ??
            `Registro ${row.id}`;

          const turnoRaw =
            pickFirstValue(row, ['turno', 'periodo', 'status', 'escala']) ??
            (row.data ? new Date(row.data).toISOString().split('T')[0] : 'N/D');

          return {
            nome: String(nome),
            turno: String(turnoRaw),
          };
        });
      }

      const dados = {
        totais,
        escalas_recentes: escalaDetalhe,
      };

      res.status(200).json(dados);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      console.error(
        '[EstatisticasExternasController] Erro ao buscar dados externos:',
        error
      );
      throw new AppError(
        'Nao foi possivel conectar ou buscar dados do sistema externo. Verifique a string de conexao externa.',
        500
      );
    }
  },
};

module.exports = estatisticasExternasController;
