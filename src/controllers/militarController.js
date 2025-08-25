const pool = require('../config/database');

const militarController = {
  /**
   * @description Lista todos os militares cadastrados.
   * @route GET /api/admin/militares
   */
  getAll: async (req, res) => {
    try {
      const result = await pool.query('SELECT * FROM militares ORDER BY nome_guerra ASC');
      res.status(200).json(result.rows);
    } catch (error) {
      console.error('Erro ao listar militares:', error);
      res.status(500).json({ message: 'Erro interno do servidor.' });
    }
  },

  /**
   * @description Cria um novo militar.
   * @route POST /api/admin/militares
   */
  create: async (req, res) => {
    const { nome_guerra, matricula, posto_graduacao, obm_id } = req.body;
    if (!nome_guerra || !matricula || !posto_graduacao) {
      return res.status(400).json({ message: 'Nome de guerra, matrícula e posto/graduação são obrigatórios.' });
    }
    try {
      const matriculaExists = await pool.query('SELECT * FROM militares WHERE matricula = $1', [matricula]);
      if (matriculaExists.rows.length > 0) {
        return res.status(409).json({ message: 'Matrícula já cadastrada no sistema.' });
      }
      const result = await pool.query(
        'INSERT INTO militares (nome_guerra, matricula, posto_graduacao, obm_id) VALUES ($1, $2, $3, $4) RETURNING *',
        [nome_guerra, matricula, posto_graduacao, obm_id || null]
      );
      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error('Erro ao criar militar:', error);
      res.status(500).json({ message: 'Erro interno do servidor.' });
    }
  },

  /**
   * @description Atualiza os dados de um militar existente.
   * @route PUT /api/admin/militares/:id
   */
  update: async (req, res) => {
    try {
      const { id } = req.params;
      const { nome_guerra, matricula, posto_graduacao, obm_id, ativo } = req.body;
      if (!nome_guerra || !matricula || !posto_graduacao) {
        return res.status(400).json({ message: 'Nome de guerra, matrícula e posto/graduação são obrigatórios.' });
      }
      const militarExists = await pool.query('SELECT * FROM militares WHERE id = $1', [id]);
      if (militarExists.rows.length === 0) {
        return res.status(404).json({ message: 'Militar não encontrado.' });
      }
      const matriculaConflict = await pool.query(
        'SELECT id FROM militares WHERE matricula = $1 AND id != $2',
        [matricula, id]
      );
      if (matriculaConflict.rows.length > 0) {
        return res.status(409).json({ message: 'A nova matrícula já está em uso por outro militar.' });
      }
      const result = await pool.query(
        `UPDATE militares 
         SET nome_guerra = $1, matricula = $2, posto_graduacao = $3, obm_id = $4, ativo = $5, updated_at = NOW()
         WHERE id = $6 
         RETURNING *`,
        [nome_guerra, matricula, posto_graduacao, obm_id || null, ativo, id]
      );
      res.status(200).json(result.rows[0]);
    } catch (error) {
      console.error('Erro ao atualizar militar:', error);
      res.status(500).json({ message: 'Erro interno do servidor.' });
    }
  },

  /**
   * @description Exclui um militar pelo ID.
   * @route DELETE /api/admin/militares/:id
   */
  delete: async (req, res) => {
    const { id } = req.params;
    try {
      const result = await pool.query('DELETE FROM militares WHERE id = $1', [id]);

      if (result.rowCount === 0) {
        return res.status(404).json({ message: 'Militar não encontrado.' });
      }

      res.status(204).send();
    } catch (error) {
      console.error('Erro ao excluir militar:', error);
      res.status(500).json({ message: 'Erro interno do servidor.' });
    }
  }
};

module.exports = militarController;
