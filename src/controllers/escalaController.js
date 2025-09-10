// Arquivo: backend/src/controllers/escalaController.js (Completo e Atualizado)

const db = require('../config/database');
const AppError = require('../utils/AppError');

const escalaController = {
  /**
   * Lista todos os registros da escala com filtros e paginação.
   */
  getAll: async (req, res) => {
    const { nome_completo, funcao, all } = req.query;

    const query = db('civis')
      .select(
        'id', 'nome_completo', 'funcao', 'entrada_servico',
        'saida_servico', 'status_servico', 'observacoes', 'ativo'
      );

    if (nome_completo) query.where('nome_completo', 'ilike', `%${nome_completo}%`);
    if (funcao) query.where('funcao', 'ilike', `%${funcao}%`);

    if (all === 'true') {
      const registros = await query.orderBy('entrada_servico', 'desc');
      return res.status(200).json({ data: registros, pagination: null });
    }

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 15;
    const offset = (page - 1) * limit;

    const countQuery = query.clone().clearSelect().clearOrder().count({ count: 'id' }).first();
    const dataQuery = query.clone().orderBy('entrada_servico', 'desc').limit(limit).offset(offset);

    const [data, totalResult] = await Promise.all([dataQuery, countQuery]);
    
    const totalRecords = parseInt(totalResult.count, 10);
    const totalPages = Math.ceil(totalRecords / limit);

    res.status(200).json({
      data,
      pagination: { currentPage: page, perPage: limit, totalPages, totalRecords },
    });
  },

  /**
   * Busca civis (médicos/reguladores) por termo para componentes de select assíncrono.
   */
  search: async (req, res) => {
    const { term } = req.query;

    if (!term || term.length < 2) {
      return res.status(200).json([]);
    }

    try {
      const civis = await db('civis')
        .where('nome_completo', 'ilike', `%${term}%`)
        .andWhere('ativo', true)
        .select('id', 'nome_completo', 'funcao')
        .limit(15);

      // Formata a resposta para o padrão que o react-select espera
      const options = civis.map(c => ({
        value: c.id,
        label: `${c.nome_completo} (${c.funcao || 'Civil'})`, // Adiciona um fallback para a função
        civil: c, // Renomeado para evitar conflito com a palavra-chave 'militar'
      }));

      res.status(200).json(options);
    } catch (error) {
      console.error("Erro ao buscar civis:", error);
      throw new AppError("Não foi possível realizar a busca por civis.", 500);
    }
  },

  /**
   * Cria um novo registro na escala.
   */
  create: async (req, res) => {
    const { nome_completo, funcao, entrada_servico, saida_servico, status_servico, observacoes, ativo } = req.body;
    const [novoRegistro] = await db('civis')
      .insert({ nome_completo, funcao, entrada_servico, saida_servico, status_servico, observacoes, ativo: ativo !== false })
      .returning('*');
    res.status(201).json(novoRegistro);
  },

  /**
   * Atualiza um registro existente na escala.
   */
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

  /**
   * Deleta um registro da escala.
   */
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
