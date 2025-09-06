const db = require('../config/database');
const AppError = require('../utils/AppError');

const civilController = {
  // Listar todos os registros da escala com filtros
  getAll: async (req, res) => {
    const { nome_completo, funcao, all } = req.query;

    // A query agora seleciona os novos campos
    const query = db('civis')
      .select(
        'id', 'nome_completo', 'funcao', 'entrada_servico',
        'saida_servico', 'status_servico', 'observacoes', 'ativo'
      )
      .orderBy('entrada_servico', 'desc'); // Ordena pelo mais recente

    if (nome_completo) query.where('nome_completo', 'ilike', `%${nome_completo}%`);
    if (funcao) query.where('funcao', 'ilike', `%${funcao}%`);

    if (all === 'true') {
      const registros = await query;
      return res.status(200).json({ data: registros });
    }

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 15;
    const offset = (page - 1) * limit;

    const countQuery = query.clone().clearSelect().count({ count: 'id' }).first();
    const dataQuery = query.limit(limit).offset(offset);

    const [data, totalResult] = await Promise.all([dataQuery, countQuery]);
    const totalRecords = parseInt(totalResult.count, 10);
    const totalPages = Math.ceil(totalRecords / limit);

    res.status(200).json({
      data,
      pagination: { currentPage: page, perPage: limit, totalPages, totalRecords },
    });
  },

  // Criar um novo registro na escala
  create: async (req, res) => {
    const { nome_completo, funcao, entrada_servico, saida_servico, status_servico, observacoes, ativo } = req.body;

    const [novoRegistro] = await db('civis')
      .insert({ nome_completo, funcao, entrada_servico, saida_servico, status_servico, observacoes, ativo })
      .returning('*');

    res.status(201).json(novoRegistro);
  },

  // Atualizar um registro existente
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

  // Deletar um registro da escala
  delete: async (req, res) => {
    const { id } = req.params;
    const result = await db('civis').where({ id }).del();
    if (result === 0) {
      throw new AppError('Registro de escala não encontrado.', 404);
    }
    res.status(204).send();
  }
};

module.exports = civilController;
