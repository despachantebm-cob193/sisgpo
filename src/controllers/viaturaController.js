const pool = require('../config/database');

const viaturaController = {
  /**
   * @description Cadastra uma nova viatura no sistema.
   * @route POST /api/admin/viaturas
   */
  create: async (req, res) => {
    const { prefixo, placa, modelo, ano, tipo, obm_id } = req.body;

    // 1. Validação de entrada
    if (!prefixo || !placa || !tipo) {
      return res.status(400).json({ message: 'Prefixo, Placa e Tipo são campos obrigatórios.' });
    }

    try {
      // 2. Verifica se o prefixo ou a placa já existem para evitar duplicatas
      const viaturaExists = await pool.query(
        'SELECT id FROM viaturas WHERE prefixo = $1 OR placa = $2',
        [prefixo, placa]
      );
      if (viaturaExists.rowCount > 0) {
        return res.status(409).json({ message: 'Prefixo ou Placa já cadastrados no sistema.' });
      }

      // 3. Insere a nova viatura no banco de dados
      const result = await pool.query(
        'INSERT INTO viaturas (prefixo, placa, modelo, ano, tipo, obm_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
        [prefixo, placa, modelo, ano, tipo, obm_id || null]
      );

      // 4. Retorna a viatura criada com status 201
      res.status(201).json(result.rows[0]);

    } catch (error) {
      console.error('Erro ao cadastrar viatura:', error);
      res.status(500).json({ message: 'Erro interno do servidor.' });
    }
  },

  /**
   * @description Lista todas as viaturas cadastradas.
   * @route GET /api/admin/viaturas
   */
  getAll: async (req, res) => {
    try {
      // Busca todas as viaturas, ordenadas pelo prefixo
      const result = await pool.query('SELECT * FROM viaturas ORDER BY prefixo ASC');
      res.status(200).json(result.rows);
    } catch (error) {
      console.error('Erro ao listar viaturas:', error);
      res.status(500).json({ message: 'Erro interno do servidor.' });
    }
  },

  /**
   * @description Atualiza os dados de uma viatura existente.
   * @route PUT /api/admin/viaturas/:id
   */
  update: async (req, res) => {
    const { id } = req.params;
    const { prefixo, placa, modelo, ano, tipo, obm_id, ativa } = req.body;

    // 1. Validação de entrada
    if (!prefixo || !placa || !tipo) {
      return res.status(400).json({ message: 'Prefixo, Placa e Tipo são campos obrigatórios.' });
    }

    try {
      // 2. Verifica se a viatura que queremos atualizar realmente existe
      const viaturaExists = await pool.query('SELECT id FROM viaturas WHERE id = $1', [id]);
      if (viaturaExists.rowCount === 0) {
        return res.status(404).json({ message: 'Viatura não encontrada.' });
      }

      // 3. Verifica se o novo prefixo ou placa já estão em uso por OUTRA viatura
      const conflictCheck = await pool.query(
        'SELECT id FROM viaturas WHERE (prefixo = $1 OR placa = $2) AND id != $3',
        [prefixo, placa, id]
      );
      if (conflictCheck.rowCount > 0) {
        return res.status(409).json({ message: 'O novo prefixo ou placa já está em uso por outra viatura.' });
      }

      // 4. Executa a atualização no banco de dados
      const result = await pool.query(
        `UPDATE viaturas 
         SET prefixo = $1, placa = $2, modelo = $3, ano = $4, tipo = $5, obm_id = $6, ativa = $7, updated_at = NOW()
         WHERE id = $8 
         RETURNING *`,
        [prefixo, placa, modelo, ano, tipo, obm_id || null, ativa, id]
      );

      res.status(200).json(result.rows[0]);

    } catch (error) {
      console.error('Erro ao atualizar viatura:', error);
      res.status(500).json({ message: 'Erro interno do servidor.' });
    }
  },

  /**
   * @description Exclui uma viatura pelo ID.
   * @route DELETE /api/admin/viaturas/:id
   */
  delete: async (req, res) => {
    const { id } = req.params;
    try {
      const result = await pool.query('DELETE FROM viaturas WHERE id = $1', [id]);

      if (result.rowCount === 0) {
        return res.status(404).json({ message: 'Viatura não encontrada.' });
      }

      res.status(204).send();
    } catch (error) {
      console.error('Erro ao excluir viatura:', error);
      res.status(500).json({ message: 'Erro interno do servidor.' });
    }
  }
};

module.exports = viaturaController;
