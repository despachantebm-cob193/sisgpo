// src/controllers/militarController.js
const db = require('../config/database');
const AppError = require('../utils/AppError');
const QueryBuilder = require('../utils/QueryBuilder');

const militarController = {
  getAll: async (req, res) => {
    const filterConfig = {
      nome_completo: { column: 'nome_completo', operator: 'ilike' },
      posto_graduacao: { column: 'posto_graduacao', operator: 'ilike' },
      matricula: { column: 'matricula', operator: 'ilike' },
      obm_id: { column: 'obm_id', operator: '=' }
    };

    const { query, countQuery, page, limit } = QueryBuilder(db, req.query, 'militares', filterConfig, 'nome_completo ASC');
    
    const [militares, totalResult] = await Promise.all([query, countQuery]);
    const totalRecords = parseInt(totalResult.count, 10);
    const totalPages = Math.ceil(totalRecords / limit);

    res.status(200).json({
      data: militares,
      pagination: { currentPage: page, perPage: limit, totalPages, totalRecords },
    });
  },
  // ... os métodos create, update e delete permanecem os mesmos da etapa anterior ...
  create: async (req, res) => {
    const { matricula, nome_completo, nome_guerra, posto_graduacao, ativo, obm_id } = req.body;
    const matriculaExists = await db('militares').where({ matricula }).first();
    if (matriculaExists) {
      throw new AppError('Matrícula já cadastrada no sistema.', 409);
    }
    const [novoMilitar] = await db('militares').insert({ matricula, nome_completo, nome_guerra, posto_graduacao, ativo, obm_id }).returning('*');
    res.status(201).json(novoMilitar);
  },
  update: async (req, res) => {
    const { id } = req.params;
    const { matricula, nome_completo, nome_guerra, posto_graduacao, ativo, obm_id } = req.body;
    const militarAtual = await db('militares').where({ id }).first();
    if (!militarAtual) {
      throw new AppError('Militar não encontrado.', 404);
    }
    if (matricula && matricula !== militarAtual.matricula) {
      const matriculaConflict = await db('militares').where('matricula', matricula).andWhere('id', '!=', id).first();
      if (matriculaConflict) {
        throw new AppError('A nova matrícula já está em uso por outro militar.', 409);
      }
    }
    const dadosAtualizacao = { matricula, nome_completo, nome_guerra, posto_graduacao, ativo, obm_id, updated_at: db.fn.now() };
    const [militarAtualizado] = await db('militares').where({ id }).update(dadosAtualizacao).returning('*');
    res.status(200).json(militarAtualizado);
  },
  delete: async (req, res) => {
    const { id } = req.params;
    const result = await db('militares').where({ id }).del();
    if (result === 0) {
      throw new AppError('Militar não encontrado.', 404);
    }
    res.status(204).send();
  }
};

module.exports = militarController;
