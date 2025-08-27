const pool = require('../config/database');
const AppError = require('../utils/AppError');
const QueryBuilder = require('../utils/QueryBuilder');

const obmController = {
  /**
   * @description Lista todas as OBMs com paginação e filtros.
   */
  getAll: async (req, res) => {
    const filterConfig = {
      nome: { column: 'nome', operator: 'ILIKE' },
      abreviatura: { column: 'abreviatura', operator: 'ILIKE' },
      cidade: { column: 'cidade', operator: 'ILIKE' }
    };
    const { dataQuery, countQuery, dataParams, countParams, page, limit } = QueryBuilder(req.query, "obms", filterConfig, "nome ASC");
    const [dataResult, countResult] = await Promise.all([ pool.query(dataQuery, dataParams), pool.query(countQuery, countParams) ]);
    const obms = dataResult.rows;
    const totalRecords = parseInt(countResult.rows[0].count, 10);
    const totalPages = Math.ceil(totalRecords / limit);
    res.status(200).json({
      data: obms,
      pagination: { currentPage: page, perPage: limit, totalPages, totalRecords },
    });
  },

  /**
   * @description Cria uma nova OBM.
   */
  create: async (req, res) => {
    const { nome, abreviatura, cidade, ativo = true } = req.body;
    const abreviaturaExists = await pool.query("SELECT id FROM obms WHERE abreviatura = $1", [abreviatura]);
    if (abreviaturaExists.rowCount > 0) {
      throw new AppError("Abreviatura já cadastrada no sistema.", 409);
    }
    const result = await pool.query(
      "INSERT INTO obms (nome, abreviatura, cidade, ativo) VALUES ($1, $2, $3, $4) RETURNING *",
      [nome, abreviatura, cidade || null, ativo]
    );
    res.status(201).json(result.rows[0]);
  },

  /**
   * @description Atualiza os dados de uma OBM existente.
   * @route PUT /api/admin/obms/:id
   */
  update: async (req, res) => {
    const { id } = req.params;
    const { nome, abreviatura, cidade, ativo } = req.body;

    // 1. Verifica se a OBM existe
    const obmExists = await pool.query('SELECT id FROM obms WHERE id = $1', [id]);
    if (obmExists.rowCount === 0) {
      throw new AppError('OBM não encontrada.', 404);
    }

    // 2. Verifica se a nova abreviatura já está em uso por outra OBM
    if (abreviatura) {
      const abreviaturaConflict = await pool.query('SELECT id FROM obms WHERE abreviatura = $1 AND id != $2', [abreviatura, id]);
      if (abreviaturaConflict.rowCount > 0) {
        throw new AppError('A nova abreviatura já está em uso por outra OBM.', 409);
      }
    }

    // 3. Constrói a query de atualização dinamicamente para evitar sobrescrever campos não enviados
    const fields = [];
    const params = [];
    let paramIndex = 1;

    // Mapeia os campos do corpo da requisição para a query
    const updateFields = { nome, abreviatura, cidade, ativo };
    Object.keys(updateFields).forEach(key => {
      if (updateFields[key] !== undefined) {
        fields.push(`${key} = $${paramIndex++}`);
        params.push(updateFields[key]);
      }
    });

    if (fields.length === 0) {
      throw new AppError('Nenhum campo fornecido para atualização.', 400);
    }

    // Adiciona o ID ao final dos parâmetros para a cláusula WHERE
    params.push(id);

    const updateQuery = `
      UPDATE obms 
      SET ${fields.join(', ')}, updated_at = NOW() 
      WHERE id = $${paramIndex} 
      RETURNING *;
    `;

    const result = await pool.query(updateQuery, params);
    res.status(200).json(result.rows[0]);
  },

  /**
   * @description Exclui uma OBM pelo ID.
   */
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
