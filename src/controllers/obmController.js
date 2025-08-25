const pool = require('../config/database');

const obmController = {
  /**
   * @description Cria uma nova Organização Bombeiro Militar (OBM).
   * @route POST /api/admin/obms
   */
  create: async (req, res) => {
    const { nome, abreviatura, cidade } = req.body;

    // Validação de entrada
    if (!nome || !abreviatura) {
      return res.status(400).json({ message: 'Nome e Abreviatura são campos obrigatórios.' });
    }

    try {
      // Verifica se a abreviatura já existe para evitar duplicatas
      const abreviaturaExists = await pool.query('SELECT id FROM obms WHERE abreviatura = $1', [abreviatura]);
      if (abreviaturaExists.rowCount > 0) {
        return res.status(409).json({ message: 'Abreviatura já cadastrada no sistema.' });
      }

      // Insere a nova OBM no banco de dados
      const result = await pool.query(
        'INSERT INTO obms (nome, abreviatura, cidade) VALUES ($1, $2, $3) RETURNING *',
        [nome, abreviatura, cidade || null]
      );

      // Retorna a OBM criada com status 201
      res.status(201).json(result.rows[0]);

    } catch (error) {
      console.error('Erro ao criar OBM:', error);
      res.status(500).json({ message: 'Erro interno do servidor.' });
    }
  },

  /**
   * @description Lista todas as OBMs cadastradas.
   * @route GET /api/admin/obms
   */
  getAll: async (req, res) => {
    try {
      // Busca todas as OBMs, ordenadas por nome
      const result = await pool.query('SELECT * FROM obms ORDER BY nome ASC');
      res.status(200).json(result.rows);
    } catch (error) {
      console.error('Erro ao listar OBMs:', error);
      res.status(500).json({ message: 'Erro interno do servidor.' });
    }
  },

  /**
   * @description Atualiza os dados de uma OBM existente.
   * @route PUT /api/admin/obms/:id
   */
  update: async (req, res) => {
    const { id } = req.params;
    const { nome, abreviatura, cidade, ativo } = req.body;

    // Validação de entrada
    if (!nome || !abreviatura) {
      return res.status(400).json({ message: 'Nome e Abreviatura são campos obrigatórios.' });
    }

    try {
      // 1. Verifica se a OBM que queremos atualizar realmente existe
      const obmExists = await pool.query('SELECT id FROM obms WHERE id = $1', [id]);
      if (obmExists.rowCount === 0) {
        return res.status(404).json({ message: 'OBM não encontrada.' });
      }

      // 2. Verifica se a nova abreviatura já está em uso por OUTRA OBM
      const abreviaturaConflict = await pool.query(
        'SELECT id FROM obms WHERE abreviatura = $1 AND id != $2',
        [abreviatura, id]
      );
      if (abreviaturaConflict.rowCount > 0) {
        return res.status(409).json({ message: 'A nova abreviatura já está em uso por outra OBM.' });
      }

      // 3. Executa a atualização no banco de dados
      const result = await pool.query(
        `UPDATE obms 
         SET nome = $1, abreviatura = $2, cidade = $3, ativo = $4, updated_at = NOW()
         WHERE id = $5 
         RETURNING *`,
        [nome, abreviatura, cidade || null, ativo, id]
      );

      res.status(200).json(result.rows[0]);

    } catch (error) {
      console.error('Erro ao atualizar OBM:', error);
      res.status(500).json({ message: 'Erro interno do servidor.' });
    }
  },

  /**
   * @description Exclui uma OBM pelo ID.
   * @route DELETE /api/admin/obms/:id
   */
  delete: async (req, res) => {
    const { id } = req.params;
    try {
      const result = await pool.query('DELETE FROM obms WHERE id = $1', [id]);

      if (result.rowCount === 0) {
        return res.status(404).json({ message: 'OBM não encontrada.' });
      }

      res.status(204).send();
    } catch (error) {
      console.error('Erro ao excluir OBM:', error);
      res.status(500).json({ message: 'Erro interno do servidor.' });
    }
  }
};

module.exports = obmController;
