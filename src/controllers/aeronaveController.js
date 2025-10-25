const knex = require('../database');
const AppError = require('../utils/AppError');

const buildUpdatePayload = ({ prefixo, tipo_asa, ativa }) => {
  const payload = {};
  if (typeof prefixo !== 'undefined') payload.prefixo = prefixo;
  if (typeof tipo_asa !== 'undefined') payload.tipo_asa = tipo_asa;
  if (typeof ativa !== 'undefined') payload.ativa = ativa;
  if (Object.keys(payload).length > 0) {
    payload.updated_at = knex.fn.now();
  }
  return payload;
};

const getAeronaves = async (req, res, next) => {
  try {
    const { term } = req.query;

    const query = knex('aeronaves')
      .select('id', 'prefixo', 'tipo_asa', 'ativa')
      .orderBy('prefixo', 'asc');

    if (term) {
      query.where('prefixo', 'ilike', `%${term}%`);
    }

    const aeronaves = await query;

    if (term) {
      return res.json(aeronaves);
    }

    return res.json({ data: aeronaves });
  } catch (error) {
    return next(error);
  }
};

const createAeronave = async (req, res, next) => {
  try {
    const { prefixo, tipo_asa, ativa: ativaInput } = req.body;

    const existente = await knex('aeronaves')
      .whereRaw('LOWER(prefixo) = LOWER(?)', [prefixo])
      .first();

    if (existente) {
      throw new AppError('Prefixo de aeronave ja cadastrado.', 409);
    }

    const ativa = typeof ativaInput === 'boolean' ? ativaInput : true;

    const [aeronave] = await knex('aeronaves')
      .insert({ prefixo, tipo_asa, ativa })
      .returning('*');

    return res.status(201).json(aeronave);
  } catch (error) {
    return next(error);
  }
};

const updateAeronave = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { prefixo } = req.body;
    const payload = buildUpdatePayload(req.body);

    const aeronaveAtual = await knex('aeronaves').where({ id }).first();
    if (!aeronaveAtual) {
      throw new AppError('Aeronave nao encontrada.', 404);
    }

    if (prefixo && prefixo !== aeronaveAtual.prefixo) {
      const conflito = await knex('aeronaves')
        .whereRaw('LOWER(prefixo) = LOWER(?)', [prefixo])
        .andWhereNot('id', id)
        .first();

      if (conflito) {
        throw new AppError('Outro registro ja utiliza este prefixo.', 409);
      }
    }

    if (Object.keys(payload).length === 0) {
      return res.json(aeronaveAtual);
    }

    const [aeronaveAtualizada] = await knex('aeronaves')
      .where({ id })
      .update(payload)
      .returning('*');

    return res.json(aeronaveAtualizada);
  } catch (error) {
    return next(error);
  }
};

const deleteAeronave = async (req, res, next) => {
  try {
    const { id } = req.params;
    const apagado = await knex('aeronaves').where({ id }).delete();

    if (!apagado) {
      throw new AppError('Aeronave nao encontrada.', 404);
    }

    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getAeronaves,
  createAeronave,
  updateAeronave,
  deleteAeronave,
  getAll: getAeronaves,
  create: createAeronave,
  update: updateAeronave,
  delete: deleteAeronave,
};
