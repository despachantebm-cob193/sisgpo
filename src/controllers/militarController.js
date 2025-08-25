const pool = require('../config/database');
const AppError = require('../utils/AppError');

const militarController = {
  /**
   * @description Lista todos os militares com paginação e filtros.
   * @route GET /api/admin/militares?page=1&limit=10&posto_graduacao=Soldado&obm_id=1
   */
  getAll: async (req, res) => {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const offset = (page - 1) * limit;
    const { posto_graduacao, obm_id } = req.query;

    let baseQuery = 'FROM militares';
    const conditions = [];
    const params = [];
    let paramIndex = 1;

    if (posto_graduacao) {
      conditions.push(`posto_graduacao ILIKE $${paramIndex++}`);
      params.push(`%${posto_graduacao}%`);
    }
    if (obm_id) {
      conditions.push(`obm_id = $${paramIndex++}`);
      params.push(obm_id);
    }

    if (conditions.length > 0) {
      baseQuery += ' WHERE ' + conditions.join(' AND ');
    }

    const dataQuery = `SELECT * ${baseQuery} ORDER BY nome_guerra ASC LIMIT $${paramIndex++} OFFSET $${paramIndex++};`;
    const countQuery = `SELECT COUNT(*) ${baseQuery};`;

    const dataParams = [...params, limit, offset];
    const countParams = [...params];

    const [dataResult, countResult] = await Promise.all([
      pool.query(dataQuery, dataParams),
      pool.query(countQuery, countParams)
    ]);

    const militares = dataResult.rows;
    const totalRecords = parseInt(countResult.rows[0].count, 10);
    const totalPages = Math.ceil(totalRecords / limit);

    res.status(200).json({
      data: militares,
      pagination: { currentPage: page, perPage: limit, totalPages, totalRecords },
    });
  },

  /**
   * @description Cria um novo militar.
   * @route POST /api/admin/militares
   */
  create: async (req, res) => {
    const { nome_guerra, matricula, posto_graduacao, obm_id } = req.body;
    const matriculaExists = await pool.query('SELECT id FROM militares WHERE matricula = $1', [matricula]);
    if (matriculaExists.rowCount > 0) {
      throw new AppError('Matrícula já cadastrada no sistema.', 409);
    }
    const result = await pool.query(
      'INSERT INTO militares (nome_guerra, matricula, posto_graduacao, obm_id) VALUES ($1, $2, $3, $4) RETURNING *',
      [nome_guerra, matricula, posto_graduacao, obm_id || null]
    );
    res.status(201).json(result.rows[0]);
  },

  /**
   * @description Atualiza os dados de um militar existente.
   * @route PUT /api/admin/militares/:id
   */
  update: async (req, res) => {
    const { id } = req.params;
    const { nome_guerra, matricula, posto_graduacao, obm_id, ativo } = req.body;
    const militarExists = await pool.query('SELECT id FROM militares WHERE id = $1', [id]);
    if (militarExists.rowCount === 0) {
      throw new AppError('Militar não encontrado.', 404);
    }
    const matriculaConflict = await pool.query('SELECT id FROM militares WHERE matricula = $1 AND id != $2', [matricula, id]);
    if (matriculaConflict.rowCount > 0) {
      throw new AppError('A nova matrícula já está em uso por outro militar.', 409);
    }
    const result = await pool.query(
      `UPDATE militares SET nome_guerra = $1, matricula = $2, posto_graduacao = $3, obm_id = $4, ativo = $5, updated_at = NOW() WHERE id = $6 RETURNING *`,
      [nome_guerra, matricula, posto_graduacao, obm_id || null, ativo, id]
    );
    res.status(200).json(result.rows[0]);
  },

  /**
   * @description Exclui um militar pelo ID.
   * @route DELETE /api/admin/militares/:id
   */
  delete: async (req, res) => {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM militares WHERE id = $1', [id]);
    if (result.rowCount === 0) {
      throw new AppError('Militar não encontrado.', 404);
    }
    res.status(204).send();
  }
};

module.exports = militarController;
