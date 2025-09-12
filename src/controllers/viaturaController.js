// Arquivo: backend/src/controllers/viaturaController.js

const db = require('../config/database');
const AppError = require('../utils/AppError');

const viaturaController = {
  // ... (as outras funções como getAll, create, update, etc., permanecem as mesmas) ...
  getAll: async (req, res) => {
    const { page = 1, limit = 15, prefixo } = req.query;
    const offset = (page - 1) * limit;

    const query = db('viaturas as v')
      .leftJoin('obms as o', 'v.obm', 'o.nome')
      .select(
        'v.id', 'v.prefixo', 'v.ativa', 'v.cidade',
        'v.obm', 'v.telefone', 'o.id as obm_id'
      );

    if (prefixo) {
      query.where('v.prefixo', 'ilike', `%${prefixo}%`);
    }

    const countQuery = query.clone().clearSelect().clearOrder().count({ count: 'v.id' }).first();
    const dataQuery = query.clone().orderBy('v.prefixo', 'asc').limit(limit).offset(offset);
    
    const [data, totalResult] = await Promise.all([dataQuery, countQuery]);
    const totalRecords = parseInt(totalResult.count, 10);
    const totalPages = Math.ceil(totalRecords / limit);

    res.status(200).json({
      data,
      pagination: { currentPage: Number(page), perPage: Number(limit), totalPages, totalRecords },
    });
  },


  // --- CORREÇÃO APLICADA AQUI ---
  getAllSimple: async (req, res) => {
    // 1. Faz um JOIN com a tabela 'obms' para conseguir o ID da OBM.
    // 2. Seleciona 'v.id' (ID da viatura), 'v.prefixo', e 'o.id' como 'obm_id'.
    const viaturas = await db('viaturas as v')
      .leftJoin('obms as o', 'v.obm', 'o.nome')
      .select('v.id', 'v.prefixo', 'o.id as obm_id')
      .where('v.ativa', true)
      .orderBy('v.prefixo', 'asc');
      
    res.status(200).json({ data: viaturas });
  },
  // --- FIM DA CORREÇÃO ---

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
  },
  
  getDistinctObms: async (req, res) => {
    try {
      const distinctData = await db('viaturas')
        .distinct('obm', 'cidade')
        .whereNotNull('obm')
        .orderBy('obm', 'asc');

      const options = distinctData.map(item => ({
        value: item.obm,
        label: item.obm,
        cidade: item.cidade
      }));

      res.status(200).json(options);
    } catch (error) {
      console.error("Erro ao buscar OBMs distintas:", error);
      throw new AppError("Não foi possível carregar a lista de OBMs existentes.", 500);
    }
  },

  clearAll: async (req, res) => {
    try {
      await db.raw('TRUNCATE TABLE viaturas RESTART IDENTITY CASCADE');
      await db('metadata').where({ key: 'viaturas_last_upload' }).del();
      res.status(200).json({ message: 'Tabela de viaturas limpa com sucesso!' });
    } catch (error) {
      console.error("ERRO AO LIMPAR TABELA DE VIATURAS:", error);
      throw new AppError("Não foi possível limpar a tabela de viaturas.", 500);
    }
  },

  getAeronaves: async (req, res) => {
    try {
      const aeronaves = await db('aeronaves')
        .where('ativa', true)
        .select('id', 'prefixo')
        .orderBy('prefixo', 'asc');

      res.status(200).json({ data: aeronaves });
    } catch (error) {
      console.error("Erro ao buscar aeronaves:", error);
      throw new AppError("Não foi possível carregar a lista de aeronaves.", 500);
    }
  },
};

module.exports = viaturaController;
