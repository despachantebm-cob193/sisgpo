const db = require('../config/database');
const AppError = require('../utils/AppError');

const civilController = {
  // Listar todos os civis com paginação e filtros
  getAll: async (req, res) => {
    const { nome_completo, apelido, obm_id, all } = req.query;

    const query = db('civis')
      .select(
        'civis.id', 'civis.nome_completo', 'civis.apelido',
        'civis.ativo', 'civis.obm_id',
        'obms.abreviatura as obm_abreviatura'
      )
      .leftJoin('obms', 'civis.obm_id', 'obms.id')
      .orderBy('civis.nome_completo', 'asc');

    if (nome_completo) query.where('civis.nome_completo', 'ilike', `%${nome_completo}%`);
    if (apelido) query.where('civis.apelido', 'ilike', `%${apelido}%`);
    if (obm_id) query.where('civis.obm_id', '=', obm_id);

    if (all === 'true') {
      const civis = await query;
      return res.status(200).json({ data: civis });
    }

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 15;
    const offset = (page - 1) * limit;

    const countQuery = query.clone().clearSelect().count({ count: 'civis.id' }).first();
    const dataQuery = query.limit(limit).offset(offset);

    const [data, totalResult] = await Promise.all([dataQuery, countQuery]);
    const totalRecords = parseInt(totalResult.count, 10);
    const totalPages = Math.ceil(totalRecords / limit);

    res.status(200).json({
      data,
      pagination: { currentPage: page, perPage: limit, totalPages, totalRecords },
    });
  },

  // Criar um novo civil
  create: async (req, res) => {
    const { nome_completo, apelido, ativo, obm_id } = req.body;

    const [novoCivil] = await db('civis')
      .insert({ nome_completo, apelido, ativo, obm_id })
      .returning('*');

    res.status(201).json(novoCivil);
  },

  // Atualizar um civil existente
  update: async (req, res) => {
    const { id } = req.params;
    const { nome_completo, apelido, ativo, obm_id } = req.body;

    const civilExists = await db('civis').where({ id }).first();
    if (!civilExists) {
      throw new AppError('Civil não encontrado.', 404);
    }

    const dadosAtualizacao = {
      nome_completo, apelido, ativo, obm_id,
      updated_at: db.fn.now()
    };

    const [civilAtualizado] = await db('civis')
      .where({ id })
      .update(dadosAtualizacao)
      .returning('*');

    res.status(200).json(civilAtualizado);
  },

  // Deletar um civil
  delete: async (req, res) => {
    const { id } = req.params;
    const result = await db('civis').where({ id }).del();
    if (result === 0) {
      throw new AppError('Civil não encontrado.', 404);
    }
    res.status(204).send();
  }
};

module.exports = civilController;
