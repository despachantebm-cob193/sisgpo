const pool = require('../config/database');
const AppError = require('../utils/AppError');

const obmController = {
  /**
   * @description Lista todas as OBMs com paginação e filtros.
   * @route GET /api/admin/obms?page=1&limit=10&nome=Batalhao&cidade=Goiania
   */
  getAll: async (req, res) => {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const offset = (page - 1) * limit;
    const { nome, cidade } = req.query;

    let baseQuery = 'FROM obms';
    const conditions = [];
    const params = [];
    let paramIndex = 1;

    if (nome) {
      conditions.push(`nome ILIKE $${paramIndex++}`);
      params.push(`%${nome}%`);
    }
    if (cidade) {
      conditions.push(`cidade ILIKE $${paramIndex++}`);
      params.push(`%${cidade}%`);
    }

    if (conditions.length > 0) {
      baseQuery += ' WHERE ' + conditions.join(' AND ');
    }

    const dataQuery = `SELECT * ${baseQuery} ORDER BY nome ASC LIMIT $${paramIndex++} OFFSET $${paramIndex++};`;
    const countQuery = `SELECT COUNT(*) ${baseQuery};`;

    const dataParams = [...params, limit, offset];
    const countParams = [...params];

    const [dataResult, countResult] = await Promise.all([
      pool.query(dataQuery, dataParams),
      pool.query(countQuery, countParams)
    ]);

    const obms = dataResult.rows;
    const totalRecords = parseInt(countResult.rows[0].count, 10);
    const totalPages = Math.ceil(totalRecords / limit);

    res.status(200).json({
      data: obms,
      pagination: { currentPage: page, perPage: limit, totalPages, totalRecords },
    });
  },

  create: async (req, res) => {
    const { nome, abreviatura, cidade } = req.body;
    const abreviaturaExists = await pool.query('SELECT id FROM obms WHERE abreviatura = $1', [abreviatura]);
    if (abreviaturaExists.rowCount > 0) {
      throw new AppError('Abreviatura já cadastrada no sistema.', 409);
    }
    const result = await pool.query(
      'INSERT INTO obms (nome, abreviatura, cidade) VALUES ($1, $2, $3) RETURNING *',
      [nome, abreviatura, cidade || null]
    );
    res.status(201).json(result.rows[0]);
  },

  update: async (req, res) => {
    const { id } = req.params;
    const { nome, abreviatura, cidade, ativo } = req.body;
    const obmExists = await pool.query('SELECT id FROM obms WHERE id = $1', [id]);
    if (obmExists.rowCount === 0) {
      throw new AppError('OBM não encontrada.', 404);
    }
    const abreviaturaConflict = await pool.query('SELECT id FROM obms WHERE abreviatura = $1 AND id != $2', [abreviatura, id]);
    if (abreviaturaConflict.rowCount > 0) {
      throw new AppError('A nova abreviatura já está em uso por outra OBM.', 409);
    }
    const result = await pool.query(
      `UPDATE obms SET nome = $1, abreviatura = $2, cidade = $3, ativo = $4, updated_at = NOW() WHERE id = $5 RETURNING *`,
      [nome, abreviatura, cidade || null, ativo, id]
    );
    res.status(200).json(result.rows[0]);
  },

  delete: async (req, res) => {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM obms WHERE id = $1', [id]);
    if (result.rowCount === 0) {
      throw new AppError('OBM não encontrada.', 404);
    }
    res.status(204).send();
  }
};

module.exports = obmController;
