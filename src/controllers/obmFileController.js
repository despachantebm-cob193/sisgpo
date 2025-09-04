// Arquivo: backend/src/controllers/obmFileController.js (Completo)

const db = require('../config/database');
const AppError = require('../utils/AppError');
const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');

const obmFileController = {
  /**
   * Processa o upload de um arquivo para ATUALIZAR OBMs existentes.
   * Mapeamento de colunas:
   * Coluna F (índice 5): cidade
   * Coluna G (índice 6): nome da OBM (usado como chave de busca)
   * Coluna I (índice 8): telefone
   */
  upload: async (req, res) => {
    if (!req.file) {
      throw new AppError('Nenhum arquivo foi enviado.', 400);
    }

    const filePath = req.file.path;
    const fileExtension = path.extname(req.file.originalname).toLowerCase();
    let rows = [];

    try {
      if (fileExtension === '.xls' || fileExtension === '.xlsx') {
        const workbook = xlsx.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        rows = xlsx.utils.sheet_to_json(worksheet, { header: 1, defval: "" });
      } else {
        throw new AppError('Formato de arquivo não suportado. Use .xls ou .xlsx.', 400);
      }

      let updatedCount = 0;
      const processingErrors = [];

      const allObms = await db('obms').select('id', 'nome');
      const obmMap = new Map(allObms.map(obm => [obm.nome.toUpperCase().trim(), obm.id]));

      await db.transaction(async trx => {
        for (let i = 1; i < rows.length; i++) {
          const rowData = rows[i];
          
          const nomeObmPlanilha = rowData[6] ? String(rowData[6]).trim().toUpperCase() : null;
          
          if (!nomeObmPlanilha) continue;

          const obmId = obmMap.get(nomeObmPlanilha);

          if (obmId) {
            const dadosParaAtualizar = {
              cidade: rowData[5] ? String(rowData[5]).trim() : undefined,
              telefone: rowData[8] ? String(rowData[8]).trim() : undefined,
              updated_at: db.fn.now(),
            };

            Object.keys(dadosParaAtualizar).forEach(key => dadosParaAtualizar[key] === undefined && delete dadosParaAtualizar[key]);

            if (Object.keys(dadosParaAtualizar).length > 1) {
              await trx('obms').where({ id: obmId }).update(dadosParaAtualizar);
              updatedCount++;
            }
          } else {
            processingErrors.push(`OBM "${rowData[6]}" não encontrada no banco de dados.`);
          }
        }
      });

      res.status(200).json({
        message: 'Arquivo processado com sucesso!',
        updated: updatedCount,
        errors: processingErrors,
      });

    } finally {
      fs.unlinkSync(filePath);
    }
  },
};

module.exports = obmFileController;
