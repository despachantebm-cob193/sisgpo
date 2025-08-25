const pool = require('../config/database');

const plantaoController = {
  /**
   * @description Cria um novo plantão e escala a guarnição.
   * @route POST /api/admin/plantoes
   */
  create: async (req, res) => {
    const { data_plantao, viatura_id, obm_id, observacoes, guarnicao } = req.body;
    if (!data_plantao || !viatura_id || !obm_id) {
      return res.status(400).json({ message: 'Data, Viatura e OBM são campos obrigatórios.' });
    }
    if (!guarnicao || !Array.isArray(guarnicao) || guarnicao.length === 0) {
      return res.status(400).json({ message: 'A guarnição (lista de militares) é obrigatória.' });
    }
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const plantaoExists = await client.query('SELECT id FROM plantoes WHERE data_plantao = $1 AND viatura_id = $2', [data_plantao, viatura_id]);
      if (plantaoExists.rowCount > 0) {
        throw new Error('Já existe um plantão cadastrado para esta viatura nesta data.');
      }
      const plantaoResult = await client.query('INSERT INTO plantoes (data_plantao, viatura_id, obm_id, observacoes) VALUES ($1, $2, $3, $4) RETURNING *', [data_plantao, viatura_id, obm_id, observacoes]);
      const novoPlantao = plantaoResult.rows[0];
      const guarnicaoPromises = guarnicao.map(militar => {
        if (!militar.militar_id || !militar.funcao) {
          throw new Error('Cada militar na guarnição deve ter "militar_id" e "funcao".');
        }
        return client.query('INSERT INTO plantoes_militares (plantao_id, militar_id, funcao) VALUES ($1, $2, $3)', [novoPlantao.id, militar.militar_id, militar.funcao]);
      });
      await Promise.all(guarnicaoPromises);
      await client.query('COMMIT');
      res.status(201).json({ ...novoPlantao, guarnicao });
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Erro ao criar plantão:', error.message);
      res.status(409).json({ message: error.message || 'Erro ao criar plantão.' });
    } finally {
      client.release();
    }
  },

  /**
   * @description Lista todos os plantões.
   * @route GET /api/admin/plantoes
   */
  getAll: async (req, res) => {
    try {
      const query = `
        SELECT p.id, p.data_plantao, p.observacoes, v.prefixo AS viatura_prefixo, o.abreviatura AS obm_abreviatura
        FROM plantoes p
        JOIN viaturas v ON p.viatura_id = v.id
        JOIN obms o ON p.obm_id = o.id
        ORDER BY p.data_plantao DESC, v.prefixo ASC;
      `;
      const result = await pool.query(query);
      res.status(200).json(result.rows);
    } catch (error) {
      console.error('Erro ao listar plantões:', error);
      res.status(500).json({ message: 'Erro interno do servidor.' });
    }
  },

  /**
   * @description Busca um plantão específico pelo ID com detalhes.
   * @route GET /api/admin/plantoes/:id
   */
  getById: async (req, res) => {
    const { id } = req.params;
    try {
      const plantaoQuery = `
        SELECT p.id, p.data_plantao, p.observacoes, p.created_at, p.updated_at, v.id AS viatura_id, v.prefixo AS viatura_prefixo, o.id AS obm_id, o.nome AS obm_nome
        FROM plantoes p
        JOIN viaturas v ON p.viatura_id = v.id
        JOIN obms o ON p.obm_id = o.id
        WHERE p.id = $1;
      `;
      const plantaoResult = await pool.query(plantaoQuery, [id]);
      if (plantaoResult.rowCount === 0) {
        return res.status(404).json({ message: 'Plantão não encontrado.' });
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
    } catch (error) {
      console.error('Erro ao buscar plantão por ID:', error);
      res.status(500).json({ message: 'Erro interno do servidor.' });
    }
  },

  /**
   * @description Atualiza um plantão existente e sua guarnição.
   * @route PUT /api/admin/plantoes/:id
   */
  update: async (req, res) => {
    const { id } = req.params;
    const { data_plantao, viatura_id, obm_id, observacoes, guarnicao } = req.body;
    if (!data_plantao || !viatura_id || !obm_id) {
      return res.status(400).json({ message: 'Data, Viatura e OBM são campos obrigatórios.' });
    }
    if (!guarnicao || !Array.isArray(guarnicao) || guarnicao.length === 0) {
      return res.status(400).json({ message: 'A guarnição (lista de militares) é obrigatória.' });
    }
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const plantaoExists = await client.query('SELECT id FROM plantoes WHERE id = $1', [id]);
      if (plantaoExists.rowCount === 0) {
        throw new Error('Plantão não encontrado.');
      }
      await client.query('UPDATE plantoes SET data_plantao = $1, viatura_id = $2, obm_id = $3, observacoes = $4, updated_at = NOW() WHERE id = $5', [data_plantao, viatura_id, obm_id, observacoes, id]);
      await client.query('DELETE FROM plantoes_militares WHERE plantao_id = $1', [id]);
      const guarnicaoPromises = guarnicao.map(militar => {
        if (!militar.militar_id || !militar.funcao) {
          throw new Error('Cada militar na guarnição deve ter "militar_id" e "funcao".');
        }
        return client.query('INSERT INTO plantoes_militares (plantao_id, militar_id, funcao) VALUES ($1, $2, $3)', [id, militar.militar_id, militar.funcao]);
      });
      await Promise.all(guarnicaoPromises);
      await client.query('COMMIT');
      res.status(200).json({ message: 'Plantão atualizado com sucesso.' });
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Erro ao atualizar plantão:', error);
      res.status(500).json({ message: error.message || 'Erro interno do servidor.' });
    } finally {
      client.release();
    }
  },

  /**
   * @description Exclui um plantão e sua guarnição associada.
   * @route DELETE /api/admin/plantoes/:id
   */
  delete: async (req, res) => {
    const { id } = req.params;
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('DELETE FROM plantoes_militares WHERE plantao_id = $1', [id]);
      const result = await client.query('DELETE FROM plantoes WHERE id = $1', [id]);
      if (result.rowCount === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ message: 'Plantão não encontrado.' });
      }
      await client.query('COMMIT');
      res.status(204).send();
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Erro ao excluir plantão:', error);
      res.status(500).json({ message: 'Erro interno do servidor.' });
    } finally {
      client.release();
    }
  }
};

module.exports = plantaoController;
