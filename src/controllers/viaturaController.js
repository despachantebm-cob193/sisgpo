const pool = require('../config/database');
const AppError = require('../utils/AppError');

const viaturaController = {
  /**
   * @description Lista todas as viaturas com paginação e filtros.
   * @route GET /api/admin/viaturas?page=1&limit=10&tipo=UR&obm_id=1
   */
  getAll: async (req, res) => {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const offset = (page - 1) * limit;
    const { tipo, obm_id } = req.query;

    let baseQuery = 'FROM viaturas';
    const conditions = [];
    const params = [];
    let paramIndex = 1;

    if (tipo) {
      conditions.push(`tipo ILIKE $${paramIndex++}`);
      params.push(`%${tipo}%`);
    }
    if (obm_id) {
      conditions.push(`obm_id = $${paramIndex++}`);
      params.push(obm_id);
    }

    if (conditions.length > 0) {
      baseQuery += ' WHERE ' + conditions.join(' AND ');
    }

    const dataQuery = `SELECT * ${baseQuery} ORDER BY prefixo ASC LIMIT $${paramIndex++} OFFSET $${paramIndex++};`;
    const countQuery = `SELECT COUNT(*) ${baseQuery};`;

    const dataParams = [...params, limit, offset];
    const countParams = [...params];

    const [dataResult, countResult] = await Promise.all([
      pool.query(dataQuery, dataParams),
      pool.query(countQuery, countParams)
    ]);

    const viaturas = dataResult.rows;
    const totalRecords = parseInt(countResult.rows[0].count, 10);
    const totalPages = Math.ceil(totalRecords / limit);

    res.status(200).json({
      data: viaturas,
      pagination: { currentPage: page, perPage: limit, totalPages, totalRecords },
    });
  },

  create: async (req, res) => {
    const { prefixo, placa, modelo, ano, tipo, obm_id } = req.body;
    const viaturaExists = await pool.query('SELECT id FROM viaturas WHERE prefixo = $1 OR placa = $2', [prefixo, placa]);
    if (viaturaExists.rowCount > 0) {
      throw new AppError('Prefixo ou Placa já cadastrados no sistema.', 409);
    }
    const result = await pool.query(
      'INSERT INTO viaturas (prefixo, placa, modelo, ano, tipo, obm_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [prefixo, placa, modelo, ano, tipo, obm_id || null]
    );
    res.status(201).json(result.rows[0]);
  },

  update: async (req, res) => {
    const { id } = req.params;
    const { prefixo, placa, modelo, ano, tipo, obm_id, ativa } = req.body;
    const viaturaExists = await pool.query('SELECT id FROM viaturas WHERE id = $1', [id]);
    if (viaturaExists.rowCount === 0) {
      throw new AppError('Viatura não encontrada.', 404);
    }
    const conflictCheck = await pool.query('SELECT id FROM viaturas WHERE (prefixo = $1 OR placa = $2) AND id != $3', [prefixo, placa, id]);
    if (conflictCheck.rowCount > 0) {
      throw new AppError('O novo prefixo ou placa já está em uso por outra viatura.', 409);
    }
    const result = await pool.query(
      `UPDATE viaturas SET prefixo = $1, placa = $2, modelo = $3, ano = $4, tipo = $5, obm_id = $6, ativa = $7, updated_at = NOW() WHERE id = $8 RETURNING *`,
      [prefixo, placa, modelo, ano, tipo, obm_id || null, ativa, id]
    );
    res.status(200).json(result.rows[0]);
  },

  delete: async (req, res) => {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM viaturas WHERE id = $1', [id]);
    if (result.rowCount === 0) {
      throw new AppError('Viatura não encontrada.', 404);
    }
    res.status(204).send();
  }
};

module.exports = viaturaController;
