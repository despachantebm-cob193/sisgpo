// Arquivo: backend/src/controllers/militarController.js (VERSÃO ATUALIZADA)

const db = require('../config/database');
const AppError = require('../utils/AppError');

const militarController = {
  /**
   * Lista todos os militares com suporte a filtros e paginação.
   */
  getAll: async (req, res) => {
    const { nome_completo, matricula, posto_graduacao, ativo, all } = req.query;

    const query = db('militares').select(
      'id', 'matricula', 'nome_completo', 'nome_guerra',
      'posto_graduacao', 'ativo', 'obm_nome', 'telefone' // Adicionado 'telefone'
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

  /**
   * Busca militares por termo para componentes de select assíncrono.
   */
  search: async (req, res) => {
    const { term } = req.query;

    if (!term || term.length < 2) {
      return res.status(200).json([]);
    }

    try {
      const militares = await db('militares')
        .where('nome_completo', 'ilike', `%${term}%`)
        .orWhere('nome_guerra', 'ilike', `%${term}%`)
        .orWhere('matricula', 'ilike', `%${term}%`)
        .andWhere('ativo', true)
        .select('id', 'matricula', 'nome_completo', 'posto_graduacao', 'nome_guerra', 'telefone') // Adicionado 'telefone'
        .limit(15);

      const options = militares.map(m => ({
        value: m.id,
        label: `${m.posto_graduacao} ${m.nome_guerra || m.nome_completo} (${m.matricula})`,
        militar: m, // O objeto completo do militar, incluindo o telefone, é enviado aqui
      }));

      res.status(200).json(options);
    } catch (error) {
      console.error("Erro ao buscar militares:", error);
      throw new AppError("Não foi possível realizar a busca por militares.", 500);
    }
  },

  /**
   * Busca um militar específico pela matrícula.
   */
  getByMatricula: async (req, res) => {
    const { matricula } = req.params;
    if (!matricula) {
      throw new AppError('Matrícula não fornecida.', 400);
    }
    const militar = await db('militares')
      .select('id', 'nome_completo', 'posto_graduacao', 'telefone') // Adicionado 'telefone'
      .where({ matricula: matricula, ativo: true })
      .first();
      
    if (!militar) {
      throw new AppError('Militar não encontrado ou inativo para esta matrícula.', 404);
    }
    res.status(200).json(militar);
  },

  /**
   * Cria um novo militar.
   */
  create: async (req, res) => {
    const { matricula, nome_completo, nome_guerra, posto_graduacao, ativo, obm_nome, telefone } = req.body;
    const matriculaExists = await db('militares').where({ matricula }).first();
    if (matriculaExists) {
      throw new AppError('Matrícula já cadastrada no sistema.', 409);
    }
    const [novoMilitar] = await db('militares').insert({ matricula, nome_completo, nome_guerra, posto_graduacao, ativo, obm_nome, telefone }).returning('*');
    res.status(201).json(novoMilitar);
  },

  /**
   * Atualiza um militar existente.
   */
  update: async (req, res) => {
    const { id } = req.params;
    // Adicionado 'telefone' à desestruturação
    const { matricula, nome_completo, nome_guerra, posto_graduacao, ativo, obm_nome, telefone } = req.body;
    
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
    // Adicionado 'telefone' ao objeto de atualização
    const dadosAtualizacao = { matricula, nome_completo, nome_guerra, posto_graduacao, ativo, obm_nome, telefone, updated_at: db.fn.now() };
    const [militarAtualizado] = await db('militares').where({ id }).update(dadosAtualizacao).returning('*');
    res.status(200).json(militarAtualizado);
  },

  /**
   * Deleta um militar.
   */
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
