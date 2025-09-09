const db = require('../config/database');
const AppError = require('../utils/AppError');

const militarController = {
  getAll: async (req, res) => {
    const { nome_completo, matricula, posto_graduacao, ativo, all } = req.query;

    // Query simplificada, sem JOINs, buscando diretamente 'obm_nome'
    const query = db('militares').select(
      'id', 'matricula', 'nome_completo', 'nome_guerra',
      'posto_graduacao', 'ativo', 'obm_nome'
    );

    if (nome_completo) query.where('nome_completo', 'ilike', `%${nome_completo}%`);
    if (matricula) query.where('matricula', 'ilike', `%${matricula}%`);
    if (posto_graduacao) query.where('posto_graduacao', 'ilike', `%${posto_graduacao}%`);
    if (ativo) query.where('ativo', '=', ativo);

    if (all === 'true') {
      const militares = await query.orderBy('nome_completo', 'asc');
      return res.status(200).json({ data: militares, pagination: null });
    }

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 50;
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

  create: async (req, res) => {
    // Usa 'obm_nome' em vez de 'obm_id'
    const { matricula, nome_completo, nome_guerra, posto_graduacao, ativo, obm_nome } = req.body;
    const matriculaExists = await db('militares').where({ matricula }).first();
    if (matriculaExists) {
      throw new AppError('Matrícula já cadastrada no sistema.', 409);
    }
    const [novoMilitar] = await db('militares').insert({ matricula, nome_completo, nome_guerra, posto_graduacao, ativo, obm_nome }).returning('*');
    res.status(201).json(novoMilitar);
  },

  update: async (req, res) => {
    const { id } = req.params;
    // Usa 'obm_nome' em vez de 'obm_id'
    const { matricula, nome_completo, nome_guerra, posto_graduacao, ativo, obm_nome } = req.body;
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
    const dadosAtualizacao = { matricula, nome_completo, nome_guerra, posto_graduacao, ativo, obm_nome, updated_at: db.fn.now() };
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
  
  getByMatricula: async (req, res) => {
    const { matricula } = req.params;
    if (!matricula) {
      throw new AppError('Matrícula não fornecida.', 400);
    }
    const militar = await db('militares')
      .select('id', 'nome_completo', 'posto_graduacao')
      .where({ matricula: matricula, ativo: true })
      .first();
    if (!militar) {
      throw new AppError('Militar não encontrado ou inativo para esta matrícula.', 404);
    }
    res.status(200).json(militar);
  },
};

module.exports = militarController;
