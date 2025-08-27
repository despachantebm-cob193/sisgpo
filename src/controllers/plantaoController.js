const pool = require('../config/database');
const AppError = require('../utils/AppError');
const QueryBuilder = require('../utils/QueryBuilder');

const plantaoController = {
  /**
   * @description Cria um novo plantão e escala a guarnição.
   * @route POST /api/admin/plantoes
   */
  create: async (req, res) => {
    const { data_plantao, viatura_id, obm_id, observacoes, guarnicao } = req.body;
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const plantaoExists = await client.query(
        'SELECT id FROM plantoes WHERE data_plantao = $1 AND viatura_id = $2',
        [data_plantao, viatura_id]
      );
      if (plantaoExists.rowCount > 0) {
        throw new AppError('Já existe um plantão cadastrado para esta viatura nesta data.', 409);
      }
      const plantaoResult = await client.query(
        'INSERT INTO plantoes (data_plantao, viatura_id, obm_id, observacoes) VALUES ($1, $2, $3, $4) RETURNING *',
        [data_plantao, viatura_id, obm_id, observacoes]
      );
      const novoPlantao = plantaoResult.rows[0];
      const guarnicaoPromises = guarnicao.map(militar => {
        return client.query(
          'INSERT INTO plantoes_militares (plantao_id, militar_id, funcao) VALUES ($1, $2, $3)',
          [novoPlantao.id, militar.militar_id, militar.funcao]
        );
      });
      await Promise.all(guarnicaoPromises);
      await client.query('COMMIT');
      res.status(201).json({ ...novoPlantao, guarnicao });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  /**
   * @description Lista todos os plantões com paginação e filtros.
   * @route GET /api/admin/plantoes?page=1&limit=10&data_inicio=YYYY-MM-DD&data_fim=YYYY-MM-DD
   */
  getAll: async (req, res) => {
    const filterConfig = {
      data_inicio: { column: 'p.data_plantao', operator: '>=' },
      data_fim: { column: 'p.data_plantao', operator: '<=' },
      obm_id: { column: 'p.obm_id', operator: '=' },
    };
    const { page, limit, offset } = {
      page: parseInt(req.query.page, 10) || 1,
      limit: parseInt(req.query.limit, 10) || 10,
      offset: ((parseInt(req.query.page, 10) || 1) - 1) * (parseInt(req.query.limit, 10) || 10),
    };
    let baseQuery = `
      FROM plantoes p
      JOIN viaturas v ON p.viatura_id = v.id
      JOIN obms o ON p.obm_id = o.id
    `;
    const conditions = [];
    const params = [];
    let paramIndex = 1;
    Object.keys(filterConfig).forEach(key => {
      if (req.query[key]) {
        const { column, operator } = filterConfig[key];
        conditions.push(`${column} ${operator} $${paramIndex++}`);
        params.push(req.query[key]);
      }
    });
    if (conditions.length > 0) {
      baseQuery += ' WHERE ' + conditions.join(' AND ');
    }
    const dataQuery = `
      SELECT p.id, p.data_plantao, p.observacoes, v.prefixo AS viatura_prefixo, o.abreviatura AS obm_abreviatura
      ${baseQuery}
      ORDER BY p.data_plantao DESC, v.prefixo ASC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++};
    `;
    const countQuery = `SELECT COUNT(p.id) ${baseQuery};`;
    const dataParams = [...params, limit, offset];
    const countParams = [...params];
    const [dataResult, countResult] = await Promise.all([
      pool.query(dataQuery, dataParams),
      pool.query(countQuery, countParams)
    ]);
    const plantoes = dataResult.rows;
    const totalRecords = parseInt(countResult.rows[0].count, 10);
    const totalPages = Math.ceil(totalRecords / limit);
    res.status(200).json({
      data: plantoes,
      pagination: { currentPage: page, perPage: limit, totalPages, totalRecords },
    });
  },

  /**
   * @description Busca um plantão específico pelo ID com detalhes da guarnição.
   * @route GET /api/admin/plantoes/:id
   */
  getById: async (req, res) => {
    const { id } = req.params;
    const plantaoQuery = `
      SELECT p.id, p.data_plantao, p.observacoes, p.created_at, p.updated_at,
             v.id AS viatura_id, v.prefixo AS viatura_prefixo,
             o.id AS obm_id, o.nome AS obm_nome
      FROM plantoes p
      JOIN viaturas v ON p.viatura_id = v.id
      JOIN obms o ON p.obm_id = o.id
      WHERE p.id = $1;
    `;
    const plantaoResult = await pool.query(plantaoQuery, [id]);
    if (plantaoResult.rowCount === 0) {
      throw new AppError('Plantão não encontrado.', 404);
    }
    const guarnicaoQuery = `
      SELECT m.id AS militar_id, m.posto_graduacao, m.nome_guerra, pm.funcao
      FROM plantoes_militares pm
      JOIN militares m ON pm.militar_id = m.id
      WHERE pm.plantao_id = $1
      ORDER BY m.id;
    `;
    const guarnicaoResult = await pool.query(guarnicaoQuery, [id]);
    const plantaoDetalhado = { ...plantaoResult.rows[0], guarnicao: guarnicaoResult.rows };
    res.status(200).json(plantaoDetalhado);
  },

  /**
   * @description Atualiza um plantão existente e sua guarnição.
   * @route PUT /api/admin/plantoes/:id
   */
  update: async (req, res) => {
    const { id } = req.params;
    const { data_plantao, viatura_id, obm_id, observacoes, guarnicao } = req.body;
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const plantaoExists = await client.query('SELECT id FROM plantoes WHERE id = $1', [id]);
      if (plantaoExists.rowCount === 0) {
        throw new AppError('Plantão não encontrado.', 404);
      }
      await client.query(
        'UPDATE plantoes SET data_plantao = $1, viatura_id = $2, obm_id = $3, observacoes = $4, updated_at = NOW() WHERE id = $5',
        [data_plantao, viatura_id, obm_id, observacoes, id]
      );
      await client.query('DELETE FROM plantoes_militares WHERE plantao_id = $1', [id]);
      const guarnicaoPromises = guarnicao.map(militar => {
        return client.query(
          'INSERT INTO plantoes_militares (plantao_id, militar_id, funcao) VALUES ($1, $2, $3)',
          [id, militar.militar_id, militar.funcao]
        );
      });
      await Promise.all(guarnicaoPromises);
      await client.query('COMMIT');
      res.status(200).json({ message: 'Plantão atualizado com sucesso.' });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  /**
   * @description Deleta um plantão. A exclusão é em cascata no banco de dados.
   * @route DELETE /api/admin/plantoes/:id
   */
  delete: async (req, res) => {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM plantoes WHERE id = $1', [id]);
    if (result.rowCount === 0) {
      throw new AppError('Plantão não encontrado.', 404);
    }
    res.status(204).send();
  }
};

module.exports = plantaoController;
