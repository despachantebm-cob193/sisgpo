// Arquivo: backend/src/controllers/militarController.js (Atualizado)

const db = require('../config/database');
const AppError = require('../utils/AppError');

const militarController = {
  getAll: async (req, res) => {
    const { nome_completo, posto_graduacao, matricula, obm_id, all } = req.query;

    const query = db('militares')
      .select(
        'militares.id', 'militares.matricula', 'militares.nome_completo',
        'militares.nome_guerra', 'militares.posto_graduacao', 'militares.ativo',
        'militares.obm_id', 'militares.tipo', // Inclui o novo campo 'tipo'
        'obms.abreviatura as obm_abreviatura'
      )
      .leftJoin('obms', 'militares.obm_id', 'obms.id')
      .orderBy('militares.nome_completo', 'asc');

    if (nome_completo) query.where('militares.nome_completo', 'ilike', `%${nome_completo}%`);
    if (posto_graduacao) query.where('militares.posto_graduacao', 'ilike', `%${posto_graduacao}%`);
    if (matricula) query.where('militares.matricula', 'ilike', `%${matricula}%`);
    if (obm_id) query.where('militares.obm_id', '=', obm_id);

    if (all === 'true') {
      const militares = await query;
      return res.status(200).json({ data: militares });
    }

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 15;
    const offset = (page - 1) * limit;

    const countQuery = query.clone().clearSelect().count({ count: 'militares.id' }).first();
    const dataQuery = query.limit(limit).offset(offset);

    const [data, totalResult] = await Promise.all([dataQuery, countQuery]);
    const totalRecords = parseInt(totalResult.count, 10);
    const totalPages = Math.ceil(totalRecords / limit);

    res.status(200).json({
      data,
      pagination: { currentPage: page, perPage: limit, totalPages, totalRecords },
    });
  },

  create: async (req, res) => {
    const { matricula, nome_completo, nome_guerra, posto_graduacao, ativo, obm_id, tipo } = req.body;
    
    if (tipo === 'Militar' && matricula) {
      const matriculaExists = await db('militares').where({ matricula }).first();
      if (matriculaExists) {
        throw new AppError('Matrícula já cadastrada no sistema.', 409);
      }
    }

    const [novoMilitar] = await db('militares')
      .insert({ matricula, nome_completo, nome_guerra, posto_graduacao, ativo, obm_id, tipo })
      .returning('*');
      
    res.status(201).json(novoMilitar);
  },

  update: async (req, res) => {
    const { id } = req.params;
    const { matricula, nome_completo, nome_guerra, posto_graduacao, ativo, obm_id, tipo } = req.body;

    const militarAtual = await db('militares').where({ id }).first();
    if (!militarAtual) {
      throw new AppError('Militar não encontrado.', 404);
    }

    if (tipo === 'Militar' && matricula && matricula !== militarAtual.matricula) {
      const matriculaConflict = await db('militares').where({ matricula }).andWhereNot({ id }).first();
      if (matriculaConflict) {
        throw new AppError('A nova matrícula já está em uso por outro militar.', 409);
      }
    }

    const dadosAtualizacao = { 
      matricula: tipo === 'Militar' ? matricula : null, 
      nome_completo, nome_guerra, 
      posto_graduacao: tipo === 'Militar' ? posto_graduacao : null, 
      ativo, obm_id, tipo, 
      updated_at: db.fn.now() 
    };

    const [militarAtualizado] = await db('militares')
      .where({ id })
      .update(dadosAtualizacao)
      .returning('*');
      
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
