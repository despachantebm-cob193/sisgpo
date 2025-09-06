// Arquivo: backend/src/controllers/obmController.js (COM A CORREÇÃO FINAL)

const db = require('../config/database');
const AppError = require('../utils/AppError');

const obmController = {
  getAll: async (req, res) => {
    const { nome, abreviatura, cidade, all } = req.query;

    const query = db('obms').select('*').orderBy('nome', 'asc');

    if (nome) query.where('nome', 'ilike', `%${nome}%`);
    if (abreviatura) query.where('abreviatura', 'ilike', `%${abreviatura}%`);
    if (cidade) query.where('cidade', 'ilike', `%${cidade}%`);

    if (all === 'true') {
      const obms = await query;
      // --- CORREÇÃO APLICADA AQUI ---
      // A resposta agora corresponde à estrutura esperada pelo frontend,
      // mesmo sem paginação.
      return res.status(200).json({
        data: obms,
        pagination: null // Informa que não há paginação
      });
      // --- FIM DA CORREÇÃO ---
    }

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 15;
    const offset = (page - 1) * limit;

    const countQuery = query.clone().clearSelect().clearOrder().count({ count: '*' }).first();
    const dataQuery = query.clone().limit(limit).offset(offset);

    const [data, totalResult] = await Promise.all([dataQuery, countQuery]);
    const totalRecords = parseInt(totalResult.count, 10);
    const totalPages = Math.ceil(totalRecords / limit);

    res.status(200).json({
      data,
      pagination: { currentPage: page, perPage: limit, totalPages, totalRecords },
    });
  },

  // ... (create, update, delete permanecem os mesmos)
  create: async (req, res) => {
    const { nome, abreviatura, cidade, telefone } = req.body;
    const abreviaturaExists = await db('obms').where({ abreviatura }).first();
    if (abreviaturaExists) {
      throw new AppError('Abreviatura já cadastrada no sistema.', 409);
    }
    const [novaObm] = await db('obms').insert({ nome, abreviatura, cidade: cidade || null, telefone: telefone || null }).returning('*');
    res.status(201).json(novaObm);
  },

  update: async (req, res) => {
    const { id } = req.params;
    const { nome, abreviatura, cidade, telefone } = req.body;
    const obmParaAtualizar = await db('obms').where({ id }).first();
    if (!obmParaAtualizar) {
      throw new AppError('OBM não encontrada.', 404);
    }
    if (abreviatura && abreviatura !== obmParaAtualizar.abreviatura) {
      const abreviaturaConflict = await db('obms').where('abreviatura', abreviatura).andWhere('id', '!=', id).first();
      if (abreviaturaConflict) {
        throw new AppError('A nova abreviatura já está em uso por outra OBM.', 409);
      }
    }
    const dadosAtualizacao = {};
    if (nome !== undefined) dadosAtualizacao.nome = nome;
    if (abreviatura !== undefined) dadosAtualizacao.abreviatura = abreviatura;
    if (cidade !== undefined) dadosAtualizacao.cidade = cidade || null;
    if (telefone !== undefined) dadosAtualizacao.telefone = telefone || null;
    if (Object.keys(dadosAtualizacao).length === 0) {
        throw new AppError('Nenhum campo fornecido para atualização.', 400);
    }
    dadosAtualizacao.updated_at = db.fn.now();
    const [obmAtualizada] = await db('obms').where({ id }).update(dadosAtualizacao).returning('*');
    res.status(200).json(obmAtualizada);
  },

  delete: async (req, res) => {
    const { id } = req.params;
    const result = await db('obms').where({ id }).del();
    if (result === 0) {
      throw new AppError('OBM não encontrada.', 404);
    }
    res.status(204).send();
  },
};

module.exports = obmController;
