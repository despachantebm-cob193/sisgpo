// src/controllers/sheetsController.js
const sheetsService = require('../services/sheetsService');
const AppError = require('../utils/AppError');

const sheetsController = {
  /**
   * Controller para lidar com a requisição de sincronização de militares.
   */
  syncMilitares: async (req, res) => {
    try {
      console.log('Iniciando processo de sincronização de militares via API...');
      
      const result = await sheetsService.syncMilitaresFromSheet();
      
      console.log('Sincronização concluída com sucesso.', result);

      return res.status(200).json({
        message: 'Sincronização com a planilha concluída.',
        data: result,
      });

    } catch (error) {
      console.error('Erro no controller de sincronização:', error);
      
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ message: error.message });
      }
      
      return res.status(500).json({ message: 'Ocorreu um erro inesperado no servidor durante a sincronização.' });
    }
  },
};

module.exports = sheetsController;
