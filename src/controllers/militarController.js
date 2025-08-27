const pool = require('../config/database');
const AppError = require('../utils/AppError');
const QueryBuilder = require('../utils/QueryBuilder');

const militarController = {
  getAll: async (req, res) => {
    const filterConfig = {
      nome_completo: { column: 'nome_completo', operator: 'ILIKE' },
      posto_graduacao: { column: 'posto_graduacao', operator: 'ILIKE' },
      matricula: { column: 'matricula', operator: 'ILIKE' },
      obm_id: { column: 'obm_id', operator: '=' }
    };
    const { dataQuery, countQuery, dataParams, countParams, page, limit } = QueryBuilder(req.query, 'militares', filterConfig, 'nome_completo ASC');
    const [dataResult, countResult] = await Promise.all([ pool.query(dataQuery, dataParams), pool.query(countQuery, countParams) ]);
    const militares = dataResult.rows;
    const totalRecords = parseInt(countResult.rows[0].count, 10);
    const totalPages = Math.ceil(totalRecords / limit);
    res.status(200).json({ data: militares, pagination: { currentPage: page, perPage: limit, totalPages, totalRecords } });
  },

  create: async (req, res) => {
    const { matricula, nome_completo, nome_guerra, posto_graduacao, ativo, obm_id } = req.body;
    const matriculaExists = await pool.query('SELECT id FROM militares WHERE matricula = $1', [matricula]);
    if (matriculaExists.rowCount > 0) {
      throw new AppError('Matrícula já cadastrada no sistema.', 409);
    }
    const result = await pool.query(
      'INSERT INTO militares (matricula, nome_completo, nome_guerra, posto_graduacao, ativo, obm_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [matricula, nome_completo, nome_guerra, posto_graduacao, ativo, obm_id]
    );
    res.status(201).json(result.rows[0]);
  },

  update: async (req, res) => {
    const { id } = req.params;
    const { matricula, nome_completo, nome_guerra, posto_graduacao, ativo, obm_id } = req.body;

    const militarAtualResult = await pool.query('SELECT * FROM militares WHERE id = $1', [id]);
    if (militarAtualResult.rowCount === 0) {
      throw new AppError('Militar não encontrado.', 404);
    }
    const militarAtual = militarAtualResult.rows[0];

    if (matricula && matricula !== militarAtual.matricula) {
      const matriculaConflict = await pool.query('SELECT id FROM militares WHERE matricula = $1 AND id != $2', [matricula, id]);
      if (matriculaConflict.rowCount > 0) {
        throw new AppError('A nova matrícula já está em uso por outro militar.', 409);
      }
    }

    const result = await pool.query(
      `UPDATE militares SET 
        matricula = $1, 
        nome_completo = $2, 
        nome_guerra = $3, 
        posto_graduacao = $4, 
        ativo = $5, 
        obm_id = $6, 
        updated_at = NOW() 
      WHERE id = $7 RETURNING *`,
      [
        matricula || militarAtual.matricula,
        nome_completo || militarAtual.nome_completo,
        nome_guerra || militarAtual.nome_guerra,
        posto_graduacao || militarAtual.posto_graduacao,
        ativo,
        obm_id || militarAtual.obm_id,
        id
      ]
    );
    res.status(200).json(result.rows[0]);
  },

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
