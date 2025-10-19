// Arquivo: src/controllers/relatorioController.js

const db = require('../config/database');
const AppError = require('../utils/AppError');

const relatorioController = {
  /**
   * Coleta e consolida todos os dados de escalas para um dia específico.
   */
  getRelatorioDiario: async (req, res) => {
    const { data } = req.query;
    if (!data) {
      throw new AppError('A data é um parâmetro obrigatório (formato AAAA-MM-DD).', 400);
    }

    try {
      const [hasDataColumn, hasDataInicio, hasDataFim] = await Promise.all([
        db.schema.hasColumn('servico_dia', 'data'),
        db.schema.hasColumn('servico_dia', 'data_inicio'),
        db.schema.hasColumn('servico_dia', 'data_fim'),
      ]);

      const applyServicoDiaDateFilter = (queryBuilder) => {
        if (hasDataColumn) {
          return queryBuilder.where('sd.data', data);
        }

        if (hasDataInicio && hasDataFim) {
          return queryBuilder.whereRaw(
            '?::date BETWEEN sd.data_inicio::date AND sd.data_fim::date',
            [data]
          );
        }

        if (hasDataInicio) {
          return queryBuilder.whereRaw('sd.data_inicio::date = ?::date', [data]);
        }

        if (hasDataFim) {
          return queryBuilder.whereRaw('sd.data_fim::date = ?::date', [data]);
        }

        return queryBuilder.whereRaw('?::date = CURRENT_DATE', [data]);
      };

      // 1. Buscar Serviço de Dia (funções especiais como Superior, Supervisor, etc.)
      const servicoDia = await applyServicoDiaDateFilter(
        db('servico_dia as sd')
          .leftJoin('militares as m', function() {
            this.on('m.id', '=', 'sd.pessoa_id').andOn('sd.pessoa_type', '=', db.raw('?', ['militar']));
          })
          .leftJoin('civis as c', function() {
            this.on('c.id', '=', 'sd.pessoa_id').andOn('sd.pessoa_type', '=', db.raw('?', ['civil']));
          })
          .select(
            'sd.funcao',
            db.raw("COALESCE(m.posto_graduacao, '') as posto_graduacao"),
            db.raw("COALESCE(NULLIF(TRIM(m.nome_guerra), ''), c.nome_completo, 'Não escalado') as nome")
          )
      );

      // 2. Buscar Plantões de Viaturas e suas respectivas guarnições
      const plantoesVTR = await db('plantoes as p')
        .join('viaturas as v', 'p.viatura_id', 'v.id')
        .where('p.data_plantao', data)
        .select('p.id', 'v.prefixo', 'p.observacoes')
        .orderBy('v.prefixo', 'asc');

      for (const plantao of plantoesVTR) {
        plantao.guarnicao = await db('plantoes_militares as pm')
          .join('militares as m', 'pm.militar_id', 'm.id')
          .where('pm.plantao_id', plantao.id)
          .select('pm.funcao', 'm.posto_graduacao', 'm.nome_guerra');
      }

      // 3. Buscar Escala de Aeronaves
      const escalaAeronaves = await db('escala_aeronaves as ea')
        .join('aeronaves as a', 'ea.aeronave_id', 'a.id')
        .leftJoin('militares as p1', 'ea.primeiro_piloto_id', 'p1.id')
        .leftJoin('militares as p2', 'ea.segundo_piloto_id', 'p2.id')
        .where('ea.data', data)
        .select(
          'a.prefixo',
          'ea.status',
          db.raw("CASE WHEN p1.id IS NULL THEN 'N/A' ELSE CONCAT(COALESCE(TRIM(p1.posto_graduacao), ''), ' ', COALESCE(NULLIF(TRIM(p1.nome_guerra), ''), TRIM(p1.nome_completo))) END as primeiro_piloto"),
          db.raw("CASE WHEN p2.id IS NULL THEN 'N/A' ELSE CONCAT(COALESCE(TRIM(p2.posto_graduacao), ''), ' ', COALESCE(NULLIF(TRIM(p2.nome_guerra), ''), SPLIT_PART(TRIM(p2.nome_completo), ' ', 1))) END as segundo_piloto")
        );

      // 4. Buscar Escala do CODEC
      const escalaCodec = await db('escala_codec as ec')
        .join('militares as m', 'ec.militar_id', 'm.id')
        .where('ec.data', data)
        .select(
          'ec.turno',
          'ec.ordem_plantonista',
          db.raw("m.posto_graduacao || ' ' || m.nome_guerra as nome_plantonista")
        )
        .orderBy([{ column: 'ec.turno', order: 'asc' }, { column: 'ec.ordem_plantonista', order: 'asc' }]);

      // 5. Buscar Escala de Médicos (registros na tabela 'civis' que têm data de serviço)
      const escalaMedicos = await db('civis')
        .whereRaw('?::date BETWEEN entrada_servico::date AND saida_servico::date', [data])
        .select('nome_completo', 'funcao', 'entrada_servico', 'saida_servico', 'status_servico', 'observacoes');

      // 6. Montar e enviar o objeto de resposta completo
      res.status(200).json({
        data_relatorio: data,
        servicoDia,
        plantoesVTR,
        escalaAeronaves,
        escalaCodec,
        escalaMedicos
      });

    } catch (error) {
      console.error("Erro ao gerar relatório diário:", error);
      throw new AppError("Não foi possível consolidar os dados para o relatório.", 500);
    }
  }
};

module.exports = relatorioController;
