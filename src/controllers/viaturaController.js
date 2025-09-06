const db = require('../config/database');
const AppError = require('../utils/AppError');

const viaturaController = {
  getAll: async (req, res) => {
    const { page = 1, limit = 15, prefixo, all } = req.query;
    const offset = (page - 1) * limit;

    const query = db('viaturas as v')
      .leftJoin('obms as o', 'v.obm', 'o.nome')
      .select(
        'v.id',
        'v.prefixo',
        'v.ativa',
        'v.cidade',
        'v.obm',
        'v.telefone',
        'o.id as obm_id'
      );

    if (prefixo) {
      query.where('v.prefixo', 'ilike', `%${prefixo}%`);
    }

    if (all === 'true') {
        const viaturas = await query.orderBy('v.prefixo', 'asc');
        return res.status(200).json({ data: viaturas });
    }

    const countQuery = query.clone().clearSelect().count({ count: 'v.id' }).first();
    query.limit(limit).offset(offset).orderBy('v.prefixo', 'asc');
    
    const [viaturas, totalResult] = await Promise.all([query, countQuery]);
    const totalRecords = parseInt(totalResult.count, 10);
    const totalPages = Math.ceil(totalRecords / limit);

    res.status(200).json({
      data: viaturas,
      pagination: { currentPage: Number(page), perPage: Number(limit), totalPages, totalRecords },
    });
  },

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

  // --- NOVO MÉTODO ADICIONADO ---
  getDistinctObms: async (req, res) => {
    try {
      // Busca valores distintos e não nulos para obm e cidade
      const distinctData = await db('viaturas')
        .distinct('obm', 'cidade')
        .whereNotNull('obm')
        .orderBy('obm', 'asc');

      // Formata os dados para o formato que o react-select espera: { label, value, cidade }
      const options = distinctData.map(item => ({
        value: item.obm, // O valor a ser salvo
        label: item.obm, // O texto a ser exibido
        cidade: item.cidade // Um dado extra para autopreenchimento
      }));

      res.status(200).json(options);
    } catch (error) {
      console.error("Erro ao buscar OBMs distintas:", error);
      throw new AppError("Não foi possível carregar a lista de OBMs existentes.", 500);
    }
  },
};

module.exports = viaturaController;
