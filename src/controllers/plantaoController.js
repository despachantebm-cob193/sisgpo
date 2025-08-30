// src/controllers/plantaoController.js
const db = require('../config/database');
const AppError = require('../utils/AppError');

const plantaoController = {
  // ... os métodos create, getById, update, delete permanecem os mesmos ...
  create: async (req, res) => {
    const { data_plantao, viatura_id, obm_id, observacoes, guarnicao } = req.body;
    await db.transaction(async trx => {
      const plantaoExists = await trx('plantoes').where({ data_plantao, viatura_id }).first();
      if (plantaoExists) {
        throw new AppError('Já existe um plantão cadastrado para esta viatura nesta data.', 409);
      }
      const [novoPlantao] = await trx('plantoes').insert({ data_plantao, viatura_id, obm_id, observacoes }).returning('*');
      if (guarnicao && guarnicao.length > 0) {
        const guarnicaoParaInserir = guarnicao.map(militar => ({
          plantao_id: novoPlantao.id,
          militar_id: militar.militar_id,
          funcao: militar.funcao,
        }));
        await trx('plantoes_militares').insert(guarnicaoParaInserir);
      }
      res.status(201).json({ ...novoPlantao, guarnicao });
    });
  },

  // --- MÉTODO getAll TOTALMENTE REFATORADO ---
  getAll: async (req, res) => {
    const { data_inicio, data_fim, obm_id, page = 1, limit = 10 } = req.query;
    
    // 1. Inicia a query base com os joins necessários
    const query = db('plantoes as p')
      .join('viaturas as v', 'p.viatura_id', 'v.id')
      .join('obms as o', 'p.obm_id', 'o.id');

    // 2. Aplica os filtros
    if (data_inicio) {
      query.where('p.data_plantao', '>=', data_inicio);
    }
    if (data_fim) {
      query.where('p.data_plantao', '<=', data_fim);
    }
    if (obm_id) {
      query.where('p.obm_id', '=', obm_id);
    }

    // 3. Clona a query para fazer a contagem ANTES de selecionar colunas e paginar
    const countQuery = query.clone().count({ count: 'p.id' }).first();

    // 4. Seleciona as colunas específicas e aplica paginação/ordenação na query principal
    const offset = (page - 1) * limit;
    query
      .select(
        'p.id',
        'p.data_plantao',
        'p.observacoes',
        'v.prefixo as viatura_prefixo',
        'o.abreviatura as obm_abreviatura'
      )
      .limit(limit)
      .offset(offset)
      .orderBy('p.data_plantao', 'desc')
      .orderBy('v.prefixo', 'asc');

    // 5. Executa as queries
    const [plantoes, totalResult] = await Promise.all([query, countQuery]);
    
    const totalRecords = parseInt(totalResult.count, 10);
    const totalPages = Math.ceil(totalRecords / limit);

    res.status(200).json({
      data: plantoes,
      pagination: { currentPage: Number(page), perPage: Number(limit), totalPages, totalRecords },
    });
  },

  getById: async (req, res) => {
    const { id } = req.params;
    const plantao = await db('plantoes as p')
      .join('viaturas as v', 'p.viatura_id', 'v.id')
      .join('obms as o', 'p.obm_id', 'o.id')
      .select('p.id', 'p.data_plantao', 'p.observacoes', 'p.created_at', 'p.updated_at', 'v.id as viatura_id', 'v.prefixo as viatura_prefixo', 'o.id as obm_id', 'o.nome as obm_nome')
      .where('p.id', id).first();
    if (!plantao) {
      throw new AppError('Plantão não encontrado.', 404);
    }
    const guarnicao = await db('plantoes_militares as pm')
      .join('militares as m', 'pm.militar_id', 'm.id')
      .select('m.id as militar_id', 'm.posto_graduacao', 'm.nome_guerra', 'pm.funcao')
      .where('pm.plantao_id', id).orderBy('m.id');
    res.status(200).json({ ...plantao, guarnicao });
  },

  update: async (req, res) => {
    const { id } = req.params;
    const { data_plantao, viatura_id, obm_id, observacoes, guarnicao } = req.body;
    await db.transaction(async trx => {
      const plantaoExists = await trx('plantoes').where({ id }).first();
      if (!plantaoExists) {
        throw new AppError('Plantão não encontrado.', 404);
      }
      await trx('plantoes').where({ id }).update({ data_plantao, viatura_id, obm_id, observacoes, updated_at: db.fn.now() });
      await trx('plantoes_militares').where({ plantao_id: id }).del();
      if (guarnicao && guarnicao.length > 0) {
        const guarnicaoParaInserir = guarnicao.map(militar => ({
          plantao_id: id,
          militar_id: militar.militar_id,
          funcao: militar.funcao,
        }));
        await trx('plantoes_militares').insert(guarnicaoParaInserir);
      }
    });
    res.status(200).json({ message: 'Plantão atualizado com sucesso.' });
  },

  delete: async (req, res) => {
    const { id } = req.params;
    const result = await db('plantoes').where({ id }).del();
    if (result === 0) {
      throw new AppError('Plantão não encontrado.', 404);
    }
    res.status(204).send();
  }
};

module.exports = plantaoController;
