// src/controllers/sheetsController.js
const sheetsService = require('../services/sheetsService');
const AppError = require('../utils/AppError');

const sheetsController = {
  syncMilitares: async (req, res) => {
    try {
      const result = await sheetsService.syncMilitaresFromSheet();
      res.status(200).json({
        message: 'Sincronização concluída.',
        ...result,
      });
    } catch (error) {
      // Se o erro já for um AppError, apenas o repassa.
      if (error instanceof AppError) {
        throw error;
      }
      // Para outros erros inesperados, cria um novo AppError.
      throw new AppError(`Erro ao executar a sincronização: ${error.message}`, 500);
    }
  },
};

module.exports = sheetsController;
