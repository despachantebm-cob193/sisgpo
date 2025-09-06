const db = require('../config/database');
const AppError = require('../utils/AppError');

const obmController = {
  /**
   * Lista todas as OBMs com suporte a filtros e paginação.
   */
  getAll: async (req, res) => {
    const { nome, abreviatura, cidade, all } = req.query;

    // Query base sem ordenação inicial para permitir a contagem correta
    const query = db('obms').select('*');

    // Aplica filtros
    if (nome) query.where('nome', 'ilike', `%${nome}%`);
    if (abreviatura) query.where('abreviatura', 'ilike', `%${abreviatura}%`);
    if (cidade) query.where('cidade', 'ilike', `%${cidade}%`);

    // Se 'all=true' for solicitado, retorna todos os registros sem paginar
    if (all === 'true') {
      const obms = await query.orderBy('nome', 'asc'); // Ordenação aplicada apenas aqui
      return res.status(200).json({ data: obms, pagination: null });
    }

    // Lógica de paginação padrão
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 15;
    const offset = (page - 1) * limit;

    // --- CORREÇÃO APLICADA ---
    // Clona a query com os filtros, mas limpa a ordenação antes de contar.
    const countQuery = query.clone().clearSelect().clearOrder().count({ count: '*' }).first();
    
    // A ordenação é aplicada apenas na query que busca os dados paginados.
    const dataQuery = query.clone().orderBy('nome', 'asc').limit(limit).offset(offset);

    // Executa as duas queries em paralelo
    const [data, totalResult] = await Promise.all([dataQuery, countQuery]);
    
    const totalRecords = parseInt(totalResult.count, 10);
    const totalPages = Math.ceil(totalRecords / limit);

    res.status(200).json({
      data,
      pagination: { currentPage: page, perPage: limit, totalPages, totalRecords },
    });
  },

  /**
   * Busca OBMs por termo para componentes de select assíncrono.
   */
  search: async (req, res) => {
    const { term } = req.query;

    if (!term || term.length < 2) {
      return res.status(200).json([]);
    }

    try {
      const obms = await db('obms')
        .where('nome', 'ilike', `%${term}%`)
        .orWhere('abreviatura', 'ilike', `%${term}%`)
        .select('id', 'nome', 'abreviatura')
        .limit(20);

      const options = obms.map(obm => ({
        value: obm.id,
        label: `${obm.abreviatura} - ${obm.nome}`,
      }));

      res.status(200).json(options);

    } catch (error) {
      console.error("Erro ao buscar OBMs:", error);
      throw new AppError("Não foi possível realizar a busca por OBMs.", 500);
    }
  },

  /**
   * Cria uma nova OBM.
   */
  create: async (req, res) => {
    const { nome, abreviatura, cidade, telefone } = req.body;
    const abreviaturaExists = await db('obms').where({ abreviatura }).first();
    if (abreviaturaExists) {
      throw new AppError('Abreviatura já cadastrada no sistema.', 409);
    }
    const [novaObm] = await db('obms').insert({ nome, abreviatura, cidade: cidade || null, telefone: telefone || null }).returning('*');
    res.status(201).json(novaObm);
  },

  /**
   * Atualiza uma OBM existente.
   */
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
    const dadosAtualizacao = { nome, abreviatura, cidade, telefone, updated_at: db.fn.now() };
    const [obmAtualizada] = await db('obms').where({ id }).update(dadosAtualizacao).returning('*');
    res.status(200).json(obmAtualizada);
  },

  /**
   * Deleta uma OBM.
   */
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
