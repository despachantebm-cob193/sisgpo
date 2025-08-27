const pool = require('../config/database');
const AppError = require('../utils/AppError');
const QueryBuilder = require('../utils/QueryBuilder');

const viaturaController = {
  /**
   * @description Lista todas as viaturas com paginação e filtros.
   */
  getAll: async (req, res) => {
    const filterConfig = {
      prefixo: { column: 'prefixo', operator: 'ILIKE' },
      placa: { column: 'placa', operator: 'ILIKE' },
      tipo: { column: 'tipo', operator: 'ILIKE' },
      obm_id: { column: 'obm_id', operator: '=' }
    };
    const { dataQuery, countQuery, dataParams, countParams, page, limit } = QueryBuilder(req.query, 'viaturas', filterConfig, 'prefixo ASC');
    const [dataResult, countResult] = await Promise.all([ pool.query(dataQuery, dataParams), pool.query(countQuery, countParams) ]);
    const viaturas = dataResult.rows;
    const totalRecords = parseInt(countResult.rows[0].count, 10);
    const totalPages = Math.ceil(totalRecords / limit);
    res.status(200).json({ data: viaturas, pagination: { currentPage: page, perPage: limit, totalPages, totalRecords } });
  },

  /**
   * @description Cria uma nova viatura.
   */
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

  /**
   * @description Atualiza os dados de uma viatura existente.
   */
  update: async (req, res) => {
    const { id } = req.params;
    const { prefixo, placa, modelo, ano, tipo, obm_id, ativa } = req.body;

    const viaturaAtualResult = await pool.query('SELECT * FROM viaturas WHERE id = $1', [id]);
    if (viaturaAtualResult.rowCount === 0) {
      throw new AppError('Viatura não encontrada.', 404);
    }
    const viaturaAtual = viaturaAtualResult.rows[0];

    if ((prefixo && prefixo !== viaturaAtual.prefixo) || (placa && placa !== viaturaAtual.placa)) {
      const conflictCheck = await pool.query('SELECT id FROM viaturas WHERE (prefixo = $1 OR placa = $2) AND id != $3', [prefixo, placa, id]);
      if (conflictCheck.rowCount > 0) {
        throw new AppError('O novo prefixo ou placa já está em uso por outra viatura.', 409);
      }
    }

    const result = await pool.query(
      `UPDATE viaturas SET 
        prefixo = $1, placa = $2, modelo = $3, ano = $4, tipo = $5, obm_id = $6, ativa = $7, updated_at = NOW() 
      WHERE id = $8 RETURNING *`,
      [
        prefixo || viaturaAtual.prefixo,
        placa || viaturaAtual.placa,
        modelo || viaturaAtual.modelo,
        ano || viaturaAtual.ano,
        tipo || viaturaAtual.tipo,
        obm_id || viaturaAtual.obm_id,
        ativa,
        id
      ]
    );
    res.status(200).json(result.rows[0]);
  },

  /**
   * @description Exclui uma viatura pelo ID.
   */
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
