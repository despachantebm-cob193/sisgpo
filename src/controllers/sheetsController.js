// src/controllers/sheetsController.js
const sheetsService = require('../services/sheetsService');

const sheetsController = {
  /**
   * @description Aciona a sincronização em massa de militares a partir da planilha.
   * @route POST /api/admin/sheets/sync-militares
   */
  syncMilitares: async (req, res) => {
    // Idealmente, apenas usuários 'Admin' deveriam poder fazer isso.
    if (req.userPerfil !== 'Admin') {
      return res.status(403).json({ message: 'Acesso negado. Apenas administradores podem sincronizar dados.' });
    }

    const result = await sheetsService.syncMilitaresFromSheet();
    
    res.status(200).json({
      message: 'Sincronização concluída.',
      ...result,
    });
  },
};

module.exports = sheetsController;
