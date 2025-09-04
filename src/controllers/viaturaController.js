// Arquivo: backend/src/controllers/viaturaController.js (Atualizado)

const db = require('../config/database');
const AppError = require('../utils/AppError');

const viaturaController = {
  getAll: async (req, res) => {
    const { prefixo, all } = req.query;

    const query = db('viaturas').select('*').orderBy('prefixo', 'asc');

    if (prefixo) {
      query.where('prefixo', 'ilike', `%${prefixo}%`);
    }

    // Se 'all=true' for passado, retorna todos os resultados para a virtualização.
    if (all === 'true') {
      const viaturas = await query;
      return res.status(200).json({ data: viaturas });
    }

    // Lógica de paginação padrão
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

  // Os métodos create, update e delete permanecem os mesmos.
  create: async (req, res) => {
    const { prefixo, ativa, cidade, obm, telefone } = req.body;
    const viaturaExists = await db('viaturas').where({ prefixo }).first();
    if (viaturaExists) {
      throw new AppError('Prefixo já cadastrado no sistema.', 409);
    }
    const [novaViatura] = await db('viaturas').insert({ prefixo, ativa, cidade, obm, telefone }).returning('*');
    res.status(201).json(novaViatura);
  },

  update: async (req, res) => {
    const { id } = req.params;
    const { prefixo, ativa, cidade, obm, telefone } = req.body;
    
    const viaturaAtual = await db('viaturas').where({ id }).first();
    if (!viaturaAtual) {
      throw new AppError('Viatura não encontrada.', 404);
    }

    if (prefixo && prefixo !== viaturaAtual.prefixo) {
      const conflict = await db('viaturas').where({ prefixo }).andWhere('id', '!=', id).first();
      if (conflict) throw new AppError('O novo prefixo já está em uso.', 409);
    }

    const dadosAtualizacao = { prefixo, ativa, cidade, obm, telefone, updated_at: db.fn.now() };
    const [viaturaAtualizada] = await db('viaturas').where({ id }).update(dadosAtualizacao).returning('*');
    res.status(200).json(viaturaAtualizada);
  },

  delete: async (req, res) => {
    const { id } = req.params;
    const result = await db('viaturas').where({ id }).del();
    if (result === 0) {
      throw new AppError('Viatura não encontrada.', 404);
    }
    res.status(204).send();
  }
};

module.exports = viaturaController;
