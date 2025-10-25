const db = require('../config/database');
const AppError = require('../utils/AppError');

const normalizeOptionalText = (value) => {
  if (value === undefined || value === null) {
    return null;
  }
  const trimmed = value.toString().trim();
  return trimmed.length ? trimmed : null;
};

const listCivis = async (req, res) => {
  const { nome_completo, all, data_inicio, data_fim } = req.query;
  const query = db('civis').select('*');

  if (nome_completo) {
    query.where('nome_completo', 'ilike', `%${nome_completo}%`);
  }
  if (data_inicio) {
    query.where('entrada_servico', '>=', data_inicio);
  }
  if (data_fim) {
    query.where('saida_servico', '<=', data_fim);
  }

  if (all === 'true') {
    const registros = await query.orderBy('nome_completo', 'asc');
    return res.status(200).json({ data: registros, pagination: null });
  }

  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 15;
  const offset = (page - 1) * limit;

  const countQuery = query.clone().clearSelect().clearOrder().count({ count: 'id' }).first();
  const dataQuery = query.clone().orderBy('nome_completo', 'asc').limit(limit).offset(offset);

  const [data, totalResult] = await Promise.all([dataQuery, countQuery]);
  const totalRecords = parseInt(totalResult.count, 10);
  const totalPages = Math.ceil(totalRecords / limit);

  res.status(200).json({
    data,
    pagination: { currentPage: page, perPage: limit, totalPages, totalRecords },
  });
};

const getCivilById = async (req, res) => {
  const { id } = req.params;
  const registro = await db('civis').where({ id }).first();
  if (!registro) {
    throw new AppError('Registro de medico ou escala nao encontrado.', 404);
  }
  res.status(200).json(registro);
};

const createCivil = async (req, res) => {
  const {
    nome_completo,
    funcao,
    telefone,
    observacoes,
    ativo,
    entrada_servico,
    saida_servico,
    status_servico,
  } = req.body;

  const payload = {
    nome_completo,
    funcao,
    telefone: normalizeOptionalText(telefone),
    observacoes: normalizeOptionalText(observacoes),
    ativo: typeof ativo === 'boolean' ? ativo : true,
  };

  if (entrada_servico !== undefined) payload.entrada_servico = entrada_servico;
  if (saida_servico !== undefined) payload.saida_servico = saida_servico;
  if (status_servico !== undefined) payload.status_servico = status_servico;

  const [novoRegistro] = await db('civis').insert(payload).returning('*');
  res.status(201).json(novoRegistro);
};

const updateCivil = async (req, res) => {
  const { id } = req.params;
  const {
    nome_completo,
    funcao,
    telefone,
    observacoes,
    ativo,
    entrada_servico,
    saida_servico,
    status_servico,
  } = req.body;

  const registroExists = await db('civis').where({ id }).first();
  if (!registroExists) {
    throw new AppError('Registro de medico ou escala nao encontrado.', 404);
  }

  const dadosAtualizacao = {};
  if (nome_completo !== undefined) dadosAtualizacao.nome_completo = nome_completo;
  if (funcao !== undefined) dadosAtualizacao.funcao = funcao;
  if (telefone !== undefined) dadosAtualizacao.telefone = normalizeOptionalText(telefone);
  if (observacoes !== undefined) dadosAtualizacao.observacoes = normalizeOptionalText(observacoes);
  if (ativo !== undefined) dadosAtualizacao.ativo = ativo;
  if (entrada_servico !== undefined) dadosAtualizacao.entrada_servico = entrada_servico;
  if (saida_servico !== undefined) dadosAtualizacao.saida_servico = saida_servico;
  if (status_servico !== undefined) dadosAtualizacao.status_servico = status_servico;

  if (!Object.keys(dadosAtualizacao).length) {
    return res.status(200).json(registroExists);
  }

  dadosAtualizacao.updated_at = db.fn.now();

  const [registroAtualizado] = await db('civis')
    .where({ id })
    .update(dadosAtualizacao)
    .returning('*');
  res.status(200).json(registroAtualizado);
};

const deleteCivil = async (req, res) => {
  const { id } = req.params;
  const result = await db('civis').where({ id }).del();
  if (result === 0) {
    throw new AppError('Registro de medico ou escala nao encontrado.', 404);
  }
  res.status(204).send();
};

const searchCivis = async (req, res) => {
  const { term } = req.query;
  if (!term || term.length < 2) {
    return res.status(200).json([]);
  }

  const civis = await db('civis')
    .where('nome_completo', 'ilike', `%${term}%`)
    .andWhere('ativo', true)
    .select('id', 'nome_completo', 'funcao')
    .limit(15);

  const options = civis.map((c) => ({
    value: c.id,
    label: c.nome_completo,
    civil: c,
  }));
  res.status(200).json(options);
};

const listEscalas = async (req, res) => {
  const { data_inicio, data_fim } = req.query;
  const query = db('civis')
    .select('*')
    .whereNotNull('entrada_servico');

  if (data_inicio) query.where('entrada_servico', '>=', data_inicio);
  if (data_fim) query.where('saida_servico', '<=', data_fim);

  const escalas = await query.orderBy('entrada_servico', 'desc');
  res.status(200).json(escalas);
};

const createEscala = async (req, res) => {
  const {
    civil_id,
    nome_completo,
    funcao,
    telefone,
    observacoes,
    ativo,
    entrada_servico,
    saida_servico,
    status_servico,
  } = req.body;

  let baseDados;

  if (civil_id) {
    const civil = await db('civis').where({ id: civil_id }).first();
    if (!civil) {
      throw new AppError('Medico nao encontrado para a escala.', 404);
    }
    baseDados = {
      nome_completo: civil.nome_completo,
      funcao: civil.funcao,
      telefone: civil.telefone,
      observacoes: observacoes !== undefined ? normalizeOptionalText(observacoes) : civil.observacoes,
      ativo: civil.ativo,
    };
  } else {
    if (!nome_completo || !funcao) {
      throw new AppError('Informe os dados do medico ou selecione um registro existente.', 400);
    }
    baseDados = {
      nome_completo,
      funcao,
      telefone: normalizeOptionalText(telefone),
      observacoes: normalizeOptionalText(observacoes),
      ativo: typeof ativo === 'boolean' ? ativo : true,
    };
  }

  const [novaEscala] = await db('civis')
    .insert({
      ...baseDados,
      entrada_servico,
      saida_servico,
      status_servico,
    })
    .returning('*');
  res.status(201).json(novaEscala);
};

const deleteEscala = async (req, res) => {
  const { id } = req.params;
  const result = await db('civis').where({ id }).del();
  if (result === 0) {
    throw new AppError('Registro de escala nao encontrado.', 404);
  }
  res.status(204).send();
};

const escalaMedicoController = {
  getAll: listCivis,
  getAllCivis: listCivis,
  getById: getCivilById,
  create: createCivil,
  createCivil,
  update: updateCivil,
  updateCivil,
  delete: deleteCivil,
  deleteCivil,
  searchCivis,
  getAllEscalas: listEscalas,
  createEscala,
  deleteEscala,
};

module.exports = escalaMedicoController;
