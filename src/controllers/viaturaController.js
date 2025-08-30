// src/controllers/viaturaController.js
const db = require('../config/database');
const AppError = require('../utils/AppError');
const QueryBuilder = require('../utils/QueryBuilder');

const viaturaController = {
  getAll: async (req, res) => {
    const filterConfig = {
      prefixo: { column: 'prefixo', operator: 'ilike' },
      placa: { column: 'placa', operator: 'ilike' },
      tipo: { column: 'tipo', operator: 'ilike' },
      obm_id: { column: 'obm_id', operator: '=' }
    };
    
    const { query, countQuery, page, limit } = QueryBuilder(db, req.query, 'viaturas', filterConfig, 'prefixo ASC');
    
    const [viaturas, totalResult] = await Promise.all([query, countQuery]);
    const totalRecords = parseInt(totalResult.count, 10);
    const totalPages = Math.ceil(totalRecords / limit);

    res.status(200).json({
      data: viaturas,
      pagination: { currentPage: page, perPage: limit, totalPages, totalRecords },
    });
  },
  // ... os métodos create, update e delete permanecem os mesmos da etapa anterior ...
  create: async (req, res) => {
    const { prefixo, placa, modelo, ano, tipo, obm_id } = req.body;
    const viaturaExists = await db('viaturas').where({ prefixo }).orWhere({ placa }).first();
    if (viaturaExists) {
      throw new AppError('Prefixo ou Placa já cadastrados no sistema.', 409);
    }
    const [novaViatura] = await db('viaturas').insert({ prefixo, placa, modelo, ano, tipo, obm_id: obm_id || null }).returning('*');
    res.status(201).json(novaViatura);
  },
  update: async (req, res) => {
    const { id } = req.params;
    const { prefixo, placa, modelo, ano, tipo, obm_id, ativa } = req.body;
    const viaturaAtual = await db('viaturas').where({ id }).first();
    if (!viaturaAtual) {
      throw new AppError('Viatura não encontrada.', 404);
    }
    if (prefixo && prefixo !== viaturaAtual.prefixo) {
      const conflict = await db('viaturas').where({ prefixo }).andWhere('id', '!=', id).first();
      if (conflict) throw new AppError('O novo prefixo já está em uso.', 409);
    }
    if (placa && placa !== viaturaAtual.placa) {
      const conflict = await db('viaturas').where({ placa }).andWhere('id', '!=', id).first();
      if (conflict) throw new AppError('A nova placa já está em uso.', 409);
    }
    const dadosAtualizacao = { prefixo, placa, modelo, ano, tipo, obm_id, ativa, updated_at: db.fn.now() };
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
