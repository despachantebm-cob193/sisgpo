const pool = require('../config/database');
const AppError = require('../utils/AppError');
const QueryBuilder = require('../utils/QueryBuilder');

const obmController = {
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
    res.status(200).json({ data: obms, pagination: { currentPage: page, perPage: limit, totalPages, totalRecords } });
  },

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

  update: async (req, res) => {
    const { id } = req.params;

    const obmExists = await pool.query('SELECT id FROM obms WHERE id = $1', [id]);
    if (obmExists.rowCount === 0) {
      throw new AppError('OBM não encontrada.', 404);
    }

    // Constrói a query de update dinamicamente
    const fields = [];
    const params = [];
    let paramIndex = 1;

    Object.keys(req.body).forEach(key => {
      if (req.body[key] !== undefined) {
        fields.push(`${key} = $${paramIndex++}`);
        params.push(req.body[key]);
      }
    });

    if (fields.length === 0) {
      return res.status(400).json({ message: 'Nenhum campo fornecido para atualização.' });
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

  delete: async (req, res) => {
    const { id } = req.params;
    if (isNaN(parseInt(id))) {
      throw new AppError("ID da OBM inválido.", 400);
    }
    const result = await pool.query('DELETE FROM obms WHERE id = $1', [id]);
    if (result.rowCount === 0) {
      throw new AppError('OBM não encontrada.', 404);
    }
    res.status(204).send();
  }
};

module.exports = obmController;
