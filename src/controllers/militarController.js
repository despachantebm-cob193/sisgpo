// Arquivo: backend/src/controllers/militarController.js

const db = require('../config/database');
const AppError = require('../utils/AppError');

const militarController = {
  getAll: async (req, res) => {
    const { nome_completo, matricula, posto_graduacao, ativo, all } = req.query;

    const query = db('militares as m')
      .leftJoin('obms as o', 'm.obm_id', 'o.id')
      .select(
        'm.id', 'm.matricula', 'm.nome_completo', 'm.nome_guerra',
        'm.posto_graduacao', 'm.ativo', 'm.obm_id',
        'o.abreviatura as obm_abreviatura'
      );

    if (nome_completo) query.where('m.nome_completo', 'ilike', `%${nome_completo}%`);
    if (matricula) query.where('m.matricula', 'ilike', `%${matricula}%`);
    if (posto_graduacao) query.where('m.posto_graduacao', 'ilike', `%${posto_graduacao}%`);
    if (ativo) query.where('m.ativo', '=', ativo);

    if (all === 'true') {
      const militares = await query.orderBy('m.nome_completo', 'asc');
      return res.status(200).json({ data: militares, pagination: null });
    }

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 50; // Aumentado para 50 para corresponder ao frontend
    const offset = (page - 1) * limit;

    const countQuery = query.clone().clearSelect().clearOrder().count({ count: 'm.id' }).first();
    const dataQuery = query.clone().orderBy('m.nome_completo', 'asc').limit(limit).offset(offset);

    const [data, totalResult] = await Promise.all([dataQuery, countQuery]);
    
    const totalRecords = parseInt(totalResult.count, 10);
    const totalPages = Math.ceil(totalRecords / limit);

    res.status(200).json({
      data,
      pagination: { currentPage: page, perPage: limit, totalPages, totalRecords },
    });
  },

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
    const militarParaAtualizar = await db('militares').where({ id }).first();
    if (!militarParaAtualizar) {
      throw new AppError('Militar não encontrado.', 404);
    }
    if (matricula && matricula !== militarParaAtualizar.matricula) {
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
  },
};

module.exports = militarController;
