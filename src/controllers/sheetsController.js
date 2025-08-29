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
      
      // Se for um erro conhecido da nossa aplicação (AppError), usa a mensagem e o status dele.
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ message: error.message });
      }
      
      // Para erros inesperados, retorna um erro genérico de servidor.
      return res.status(500).json({ message: 'Ocorreu um erro inesperado no servidor durante a sincronização.' });
    }
  },
};

module.exports = sheetsController;
