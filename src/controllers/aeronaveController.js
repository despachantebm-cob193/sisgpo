// Arquivo: src/controllers/aeronaveController.js

const db = require('../config/database');
const AppError = require('../utils/AppError');

const aeronaveController = {
  // Função para listar aeronaves (CRUD)
  getAll: async (req, res) => {
    const aeronaves = await db('aeronaves').orderBy('prefixo', 'asc');
    res.status(200).json({ data: aeronaves, pagination: null });
  },
  // Adicione outras funções de CRUD (create, update, delete) aqui no futuro
};

module.exports = aeronaveController;