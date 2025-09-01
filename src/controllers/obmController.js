// src/controllers/obmController.js
const db = require('../config/database');
const AppError = require('../utils/AppError');
const QueryBuilder = require('../utils/QueryBuilder');

const obmController = {
  getAll: async (req, res) => {
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
  },

  create: async (req, res) => {
    const { nome, abreviatura, cidade, telefone } = req.body;

    const abreviaturaExists = await db('obms').where({ abreviatura }).first();
    if (abreviaturaExists) {
      throw new AppError('Abreviatura já cadastrada no sistema.', 409);
    }

    const [novaObm] = await db('obms').insert({ 
      nome, 
      abreviatura, 
      cidade: cidade || null, 
      telefone: telefone || null
    }).returning('*');

    res.status(201).json(novaObm);
  },

  // --- MÉTODO UPDATE COM LÓGICA DE ATUALIZAÇÃO CORRIGIDA ---
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

    // Constrói o objeto de atualização apenas com os campos que foram definidos no corpo da requisição.
    const dadosAtualizacao = {};
    if (nome !== undefined) dadosAtualizacao.nome = nome;
    if (abreviatura !== undefined) dadosAtualizacao.abreviatura = abreviatura;
    if (cidade !== undefined) dadosAtualizacao.cidade = cidade || null;
    if (telefone !== undefined) dadosAtualizacao.telefone = telefone || null;

    // Se nenhum dado foi enviado para atualização, retorna um erro.
    if (Object.keys(dadosAtualizacao).length === 0) {
        throw new AppError('Nenhum campo fornecido para atualização.', 400);
    }

    dadosAtualizacao.updated_at = db.fn.now();

    const [obmAtualizada] = await db('obms')
      .where({ id })
      .update(dadosAtualizacao)
      .returning('*');

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
