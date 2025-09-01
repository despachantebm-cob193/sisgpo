// backend/src/controllers/viaturaController.js
const db = require('../config/database');
const AppError = require('../utils/AppError');

const viaturaController = {
  getAll: async (req, res) => {
    const { page = 1, limit = 10, prefixo } = req.query;
    const offset = (page - 1) * limit;

    const query = db('viaturas as v')
      .leftJoin('obms as o', 'v.obm_id', 'o.id')
      .select(
        'v.id',
        'v.prefixo',
        'v.ativa',
        'o.abreviatura as obm_abreviatura',
        'o.cidade as obm_cidade',
        'o.telefone as obm_telefone'
      );

    if (prefixo) {
      query.where('v.prefixo', 'ilike', `%${prefixo}%`);
    }

    const countQuery = query.clone().clearSelect().count({ count: 'v.id' }).first();
    query.limit(limit).offset(offset).orderBy('v.prefixo', 'asc');

    const [viaturas, totalResult] = await Promise.all([query, countQuery]);
    const totalRecords = parseInt(totalResult.count, 10);
    const totalPages = Math.ceil(totalRecords / limit);

    res.status(200).json({
      data: viaturas,
      pagination: { currentPage: Number(page), perPage: Number(limit), totalPages, totalRecords },
    });
  },

  // Os métodos create, update e delete não precisam de alteração,
  // pois já foram ajustados para a nova estrutura de tabela.
  create: async (req, res) => {
    const { prefixo, obm_id } = req.body; // Simplificado
    const viaturaExists = await db('viaturas').where({ prefixo }).first();
    if (viaturaExists) {
      throw new AppError('Prefixo já cadastrado no sistema.', 409);
    }
    const [novaViatura] = await db('viaturas').insert({ prefixo, obm_id: obm_id || null, ativa: true }).returning('*');
    res.status(201).json(novaViatura);
  },
  update: async (req, res) => {
    const { id } = req.params;
    const { prefixo, obm_id, ativa } = req.body; // Simplificado
    const viaturaAtual = await db('viaturas').where({ id }).first();
    if (!viaturaAtual) {
      throw new AppError('Viatura não encontrada.', 404);
    }
    if (prefixo && prefixo !== viaturaAtual.prefixo) {
      const conflict = await db('viaturas').where({ prefixo }).andWhere('id', '!=', id).first();
      if (conflict) throw new AppError('O novo prefixo já está em uso.', 409);
    }
    const dadosAtualizacao = { prefixo, obm_id, ativa, updated_at: db.fn.now() };
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
