// src/controllers/obmController.js
const db = require('../config/database');
const AppError = require('../utils/AppError');
const QueryBuilder = require('../utils/QueryBuilder');

const obmController = {
  getAll: async (req, res) => {
    try { // <--- ADICIONADO PARA DEBUG
      const filterConfig = {
        nome: { column: 'nome', operator: 'ilike' },
        abreviatura: { column: 'abreviatura', operator: 'ilike' },
        cidade: { column: 'cidade', operator: 'ilike' }
      };

      const { query, countQuery, page, limit } = QueryBuilder(db, req.query, "obms", filterConfig, "nome ASC");
      
      const [obms, totalResult] = await Promise.all([query, countQuery]);
      
      const totalRecords = parseInt(totalResult.count, 10);
      const totalPages = Math.ceil(totalRecords / limit);

      res.status(200).json({
        data: obms,
        pagination: { currentPage: page, perPage: limit, totalPages, totalRecords },
      });
    } catch (error) { // <--- ADICIONADO PARA DEBUG
      console.error('--- ERRO CAPTURADO DIRETAMENTE NO OBM CONTROLLER ---');
      console.error(error); // Loga o objeto de erro completo
      console.error('----------------------------------------------------');
      // Re-lança o erro para que o middleware de erro principal ainda funcione
      throw error;
    }
  },

  // ... os outros métodos (create, update, delete) permanecem inalterados ...
  create: async (req, res) => {
    const { nome, abreviatura, cidade, ativo = true } = req.body;
    const abreviaturaExists = await db('obms').where({ abreviatura }).first();
    if (abreviaturaExists) {
      throw new AppError('Abreviatura já cadastrada no sistema.', 409);
    }
    const [novaObm] = await db('obms').insert({ nome, abreviatura, cidade: cidade || null, ativo }).returning('*');
    res.status(201).json(novaObm);
  },

  update: async (req, res) => {
    const { id } = req.params;
    const { nome, abreviatura, cidade, ativo } = req.body;
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
    if (cidade !== undefined) dadosAtualizacao.cidade = cidade;
    if (ativo !== undefined) dadosAtualizacao.ativo = ativo;
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
