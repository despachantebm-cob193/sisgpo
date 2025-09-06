const db = require('../config/database');
const AppError = require('../utils/AppError');

const plantaoController = {
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

  getAll: async (req, res) => {
    const { data_inicio, data_fim, obm_id, all } = req.query;
    
    // Query base com os joins necessários
    const query = db('plantoes as p')
      .join('viaturas as v', 'p.viatura_id', 'v.id')
      .join('obms as o', 'p.obm_id', 'o.id');

    // Aplica filtros
    if (data_inicio) query.where('p.data_plantao', '>=', data_inicio);
    if (data_fim) query.where('p.data_plantao', '<=', data_fim);
    if (obm_id) query.where('p.obm_id', '=', obm_id);

    // Query para buscar os dados a serem exibidos
    const baseSelectQuery = query
      .select(
        'p.id', 'p.data_plantao', 'p.observacoes',
        'v.prefixo as viatura_prefixo',
        'o.abreviatura as obm_abreviatura'
      );

    if (all === 'true') {
        const plantoes = await baseSelectQuery.orderBy('p.data_plantao', 'desc').orderBy('v.prefixo', 'asc');
        return res.status(200).json({ data: plantoes, pagination: null });
    }

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const offset = (page - 1) * limit;

    // --- CORREÇÃO APLICADA AQUI ---
    // Clona a query com os joins e filtros, mas limpa select e order para fazer a contagem.
    const countQuery = query.clone().clearSelect().clearOrder().count({ count: 'p.id' }).first();
    
    // Aplica a ordenação e paginação na query que busca os dados.
    const dataQuery = baseSelectQuery.clone().orderBy('p.data_plantao', 'desc').orderBy('v.prefixo', 'asc').limit(limit).offset(offset);

    const [data, totalResult] = await Promise.all([dataQuery, countQuery]);
    const totalRecords = parseInt(totalResult.count, 10);
    const totalPages = Math.ceil(totalRecords / limit);

    res.status(200).json({
      data,
      pagination: { currentPage: page, perPage: limit, totalPages, totalRecords },
    });
  },

  getById: async (req, res) => {
    const { id } = req.params;
    
    const plantao = await db('plantoes').where({ id }).first();
    if (!plantao) {
      throw new AppError('Plantão não encontrado.', 404);
    }
    
    const guarnicao = await db('plantoes_militares as pm')
      .join('militares as m', 'pm.militar_id', 'm.id')
      .select('pm.militar_id', 'pm.funcao', 'm.nome_guerra', 'm.posto_graduacao')
      .where('pm.plantao_id', id);
      
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

      const conflictExists = await trx('plantoes')
        .where({ data_plantao, viatura_id })
        .andWhere('id', '!=', id)
        .first();
      if (conflictExists) {
        throw new AppError('Já existe um plantão cadastrado para esta viatura nesta data.', 409);
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
