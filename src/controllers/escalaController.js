// Arquivo: backend/src/controllers/escalaController.js (VERSÃO FINAL CORRIGIDA)

const db = require('../config/database');
const AppError = require('../utils/AppError');

const escalaController = {
  // --- CRUD PARA O CADASTRO DE MÉDICOS (tabela 'civis') ---

  getAllCivis: async (req, res) => {
    const { nome_completo, all } = req.query;
    const query = db('civis').select('id', 'nome_completo', 'funcao', 'telefone', 'observacoes', 'ativo');
    if (nome_completo) query.where('nome_completo', 'ilike', `%${nome_completo}%`);

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
  },

  createCivil: async (req, res) => {
    const { nome_completo, funcao, telefone, observacoes, ativo } = req.body;
    const [novoRegistro] = await db('civis')
      .insert({ nome_completo, funcao, telefone, observacoes, ativo: ativo !== false })
      .returning('*');
    res.status(201).json(novoRegistro);
  },

  updateCivil: async (req, res) => {
    const { id } = req.params;
    const { nome_completo, funcao, telefone, observacoes, ativo } = req.body;
    const registroExists = await db('civis').where({ id }).first();
    if (!registroExists) throw new AppError('Registro de médico não encontrado.', 404);
    
    const dadosAtualizacao = { nome_completo, funcao, telefone, observacoes, ativo, updated_at: db.fn.now() };
    const [registroAtualizado] = await db('civis').where({ id }).update(dadosAtualizacao).returning('*');
    res.status(200).json(registroAtualizado);
  },

  deleteCivil: async (req, res) => {
    const { id } = req.params;
    const result = await db('civis').where({ id }).del();
    if (result === 0) throw new AppError('Registro de médico não encontrado.', 404);
    res.status(204).send();
  },

  // --- CORREÇÃO FINAL APLICADA AQUI ---
  searchCivis: async (req, res) => {
    const { term } = req.query;
    if (!term || term.length < 2) return res.status(200).json([]);
    
    const civis = await db('civis')
      .where('nome_completo', 'ilike', `%${term}%`)
      .andWhere('ativo', true)
      .select('id', 'nome_completo', 'funcao')
      .limit(15);

    // A lógica agora garante que o 'label' contenha apenas o nome.
    const options = civis.map(c => ({
      value: c.id,
      label: c.nome_completo, // <-- GARANTE QUE APENAS O NOME SEJA USADO
      civil: c,
    }));
    res.status(200).json(options);
  },
  // --- FIM DA CORREÇÃO ---

  // --- CRUD PARA A ESCALA DE SERVIÇO (tabela 'escala_medicos') ---

  getAllEscalas: async (req, res) => {
    const { data_inicio, data_fim } = req.query;
    const query = db('escala_medicos as em')
      .join('civis as c', 'em.civil_id', 'c.id')
      .select(
        'em.id', 'em.civil_id', 'em.entrada_servico', 'em.saida_servico',
        'em.status_servico', 'em.observacoes',
        'c.nome_completo', 'c.funcao'
      );

    if (data_inicio) query.where('em.entrada_servico', '>=', data_inicio);
    if (data_fim) query.where('em.saida_servico', '<=', data_fim);

    const escalas = await query.orderBy('em.entrada_servico', 'desc');
    res.status(200).json(escalas);
  },

  createEscala: async (req, res) => {
    const { civil_id, entrada_servico, saida_servico, status_servico, observacoes } = req.body;
    const [novaEscala] = await db('escala_medicos')
      .insert({ civil_id, entrada_servico, saida_servico, status_servico, observacoes })
      .returning('*');
    res.status(201).json(novaEscala);
  },

  deleteEscala: async (req, res) => {
    const { id } = req.params;
    const result = await db('escala_medicos').where({ id }).del();
    if (result === 0) throw new AppError('Registro de escala não encontrado.', 404);
    res.status(204).send();
  },
};

module.exports = escalaController;
