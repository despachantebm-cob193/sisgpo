const db = require('../config/database');
const AppError = require('../utils/AppError');

const buildSelectQuery = () =>
  db('escala_aeronaves as ea')
    .leftJoin('aeronaves as a', 'ea.aeronave_id', 'a.id')
    .leftJoin('militares as p1', 'ea.primeiro_piloto_id', 'p1.id')
    .leftJoin('militares as p2', 'ea.segundo_piloto_id', 'p2.id')
    .select([
      'ea.id',
      'ea.data',
      'ea.aeronave_id',
      'ea.status',
      'ea.primeiro_piloto_id',
      'ea.segundo_piloto_id',
      'a.prefixo as aeronave_prefixo',
      db.raw(`
        CASE
          WHEN p1.id IS NULL THEN 'N/A'
          ELSE CONCAT(
            COALESCE(TRIM(p1.posto_graduacao), ''),
            CASE WHEN COALESCE(TRIM(p1.posto_graduacao), '') = '' THEN '' ELSE ' ' END,
            COALESCE(NULLIF(TRIM(p1.nome_guerra), ''), TRIM(p1.nome_completo))
          )
        END as primeiro_piloto
      `),
      db.raw(`
        CASE
          WHEN p2.id IS NULL THEN 'N/A'
          ELSE CONCAT(
            COALESCE(TRIM(p2.posto_graduacao), ''),
            CASE WHEN COALESCE(TRIM(p2.posto_graduacao), '') = '' THEN '' ELSE ' ' END,
            COALESCE(NULLIF(TRIM(p2.nome_guerra), ''), SUBSTRING(TRIM(p2.nome_completo) FROM '^[^ ]+'))
          )
        END as segundo_piloto
      `),
    ]);

const resolveAeronaveId = async (trx, { aeronaveId, prefixo }) => {
  if (aeronaveId) {
    const existente = await trx('aeronaves').where({ id: aeronaveId }).first();
    if (existente) {
      return existente.id;
    }
  }

  if (!prefixo) {
    throw new AppError('Informe o id ou prefixo da aeronave.', 400);
  }

  let aeronave = await trx('aeronaves')
    .whereRaw('LOWER(prefixo) = LOWER(?)', [prefixo])
    .first();

  if (!aeronave) {
    [aeronave] = await trx('aeronaves')
      .insert({
        prefixo: prefixo,
        tipo_asa: 'rotativa',
        ativa: true,
      })
      .returning('*');
  }

  return aeronave.id;
};

const escalaAeronaveController = {
  getAll: async (req, res) => {
    const { data_inicio, data_fim } = req.query;
    const query = buildSelectQuery();

    if (data_inicio) {
      query.where('ea.data', '>=', data_inicio);
    }
    if (data_fim) {
      query.where('ea.data', '<=', data_fim);
    }

    const escalas = await query.orderBy('ea.data', 'desc');
    res.status(200).json(escalas);
  },

  getById: async (req, res) => {
    const { id } = req.params;

    const escala = await buildSelectQuery()
      .where('ea.id', id)
      .first();

    if (!escala) {
      throw new AppError('Registro de escala nao encontrado.', 404);
    }

    res.status(200).json(escala);
  },

  create: async (req, res) => {
    const { aeronave_id, aeronave_prefixo, data, status, primeiro_piloto_id, segundo_piloto_id } = req.body;

    if (!data) {
      throw new AppError('A data da escala e obrigatoria.', 400);
    }

    let novaEscala;

    await db.transaction(async trx => {
      const resolvedAeronaveId = await resolveAeronaveId(trx, {
        aeronaveId: aeronave_id,
        prefixo: aeronave_prefixo,
      });

      const conflito = await trx('escala_aeronaves')
        .where({ data, aeronave_id: resolvedAeronaveId })
        .first();

      if (conflito) {
        throw new AppError('Ja existe uma escala para esta aeronave nesta data.', 409);
      }

      [novaEscala] = await trx('escala_aeronaves')
        .insert({
          data,
          aeronave_id: resolvedAeronaveId,
          status: status || 'Ativa',
          primeiro_piloto_id: primeiro_piloto_id || null,
          segundo_piloto_id: segundo_piloto_id || null,
        })
        .returning('*');
    });

    res.status(201).json(novaEscala);
  },

  update: async (req, res) => {
    const { id } = req.params;
    const { data, status, aeronave_id, aeronave_prefixo, primeiro_piloto_id, segundo_piloto_id } = req.body;

    let escalaAtualizada;

    await db.transaction(async trx => {
      const registroAtual = await trx('escala_aeronaves').where({ id }).first();
      if (!registroAtual) {
        throw new AppError('Registro de escala nao encontrado.', 404);
      }

      const resolvedAeronaveId = await resolveAeronaveId(trx, {
        aeronaveId: aeronave_id || registroAtual.aeronave_id,
        prefixo: aeronave_prefixo,
      });

      if (data) {
        const conflito = await trx('escala_aeronaves')
          .where({ data, aeronave_id: resolvedAeronaveId })
          .andWhereNot('id', id)
          .first();

        if (conflito) {
          throw new AppError('Ja existe uma escala para esta aeronave nesta data.', 409);
        }
      }

      const payload = {
        data: data || registroAtual.data,
        status: typeof status !== 'undefined' ? status : registroAtual.status,
        aeronave_id: resolvedAeronaveId,
        primeiro_piloto_id:
          typeof primeiro_piloto_id === 'undefined' ? registroAtual.primeiro_piloto_id : (primeiro_piloto_id || null),
        segundo_piloto_id:
          typeof segundo_piloto_id === 'undefined' ? registroAtual.segundo_piloto_id : (segundo_piloto_id || null),
        updated_at: trx.fn.now(),
      };

      [escalaAtualizada] = await trx('escala_aeronaves')
        .where({ id })
        .update(payload)
        .returning('*');
    });

    res.status(200).json(escalaAtualizada);
  },

  delete: async (req, res) => {
    const { id } = req.params;
    const apagado = await db('escala_aeronaves').where({ id }).del();
    if (apagado === 0) {
      throw new AppError('Registro de escala nao encontrado.', 404);
    }
    res.status(204).send();
  },
};

module.exports = escalaAeronaveController;
