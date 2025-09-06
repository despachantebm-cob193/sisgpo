// Arquivo: backend/src/controllers/escalaController.js (Versão Otimizada com Paginação)

const db = require('../config/database');
const AppError = require('../utils/AppError');

const escalaController = {
  // Listar todos os registros da escala com filtros e paginação
  getAll: async (req, res) => {
    const { nome_completo, funcao, all } = req.query;

    const query = db('civis')
      .select(
        'id', 'nome_completo', 'funcao', 'entrada_servico',
        'saida_servico', 'status_servico', 'observacoes', 'ativo'
      )
      .orderBy('entrada_servico', 'desc');

    if (nome_completo) query.where('nome_completo', 'ilike', `%${nome_completo}%`);
    if (funcao) query.where('funcao', 'ilike', `%${funcao}%`);

    // Se 'all=true' for solicitado, retorna todos os resultados sem paginar.
    if (all === 'true') {
      const registros = await query;
      return res.status(200).json({ data: registros, pagination: null });
    }

    // Lógica de paginação padrão
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 15;
    const offset = (page - 1) * limit;

    const countQuery = query.clone().clearSelect().count({ count: 'id' }).first();
    const dataQuery = query.clone().limit(limit).offset(offset);

    const [data, totalResult] = await Promise.all([dataQuery, countQuery]);
    const totalRecords = parseInt(totalResult.count, 10);
    const totalPages = Math.ceil(totalRecords / limit);

    res.status(200).json({
      data,
      pagination: { currentPage: page, perPage: limit, totalPages, totalRecords },
    });
  },

  // ... (Os métodos create, update e delete permanecem os mesmos)
  create: async (req, res) => {
    const { nome_completo, funcao, entrada_servico, saida_servico, status_servico, observacoes, ativo } = req.body;
    const [novoRegistro] = await db('civis')
      .insert({ nome_completo, funcao, entrada_servico, saida_servico, status_servico, observacoes, ativo: ativo !== false })
      .returning('*');
    res.status(201).json(novoRegistro);
  },

  update: async (req, res) => {
    const { id } = req.params;
    const { nome_completo, funcao, entrada_servico, saida_servico, status_servico, observacoes, ativo } = req.body;
    const registroExists = await db('civis').where({ id }).first();
    if (!registroExists) {
      throw new AppError('Registro de escala não encontrado.', 404);
    }
    const dadosAtualizacao = {
      nome_completo, funcao, entrada_servico, saida_servico, status_servico, observacoes, ativo,
      updated_at: db.fn.now()
    };
    const [registroAtualizado] = await db('civis')
      .where({ id })
      .update(dadosAtualizacao)
      .returning('*');
    res.status(200).json(registroAtualizado);
  },

  delete: async (req, res) => {
    const { id } = req.params;
    const result = await db('civis').where({ id }).del();
    if (result === 0) {
      throw new AppError('Registro de escala não encontrado.', 404);
    }
    res.status(204).send();
  }
};

module.exports = escalaController;
