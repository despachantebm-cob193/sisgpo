// Arquivo: backend/src/controllers/obmFileController.js (Otimizado)

const db = require('../config/database');
const AppError = require('../utils/AppError');
const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');

const obmFileController = {
  upload: async (req, res) => {
    if (!req.file) {
      throw new AppError('Nenhum arquivo foi enviado.', 400);
    }

    const filePath = req.file.path;

    try {
      const workbook = xlsx.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const rows = xlsx.utils.sheet_to_json(worksheet, { header: 1, defval: "" });

      let updatedCount = 0;
      const processingErrors = [];

      // 1. Busca todas as OBMs existentes de uma só vez
      const allObms = await db('obms').select('id', 'nome');
      const obmMap = new Map(allObms.map(obm => [obm.nome.toUpperCase().trim(), obm.id]));

      // 2. Inicia a transação
      await db.transaction(async trx => {
        for (let i = 1; i < rows.length; i++) { // Ignora cabeçalho
          const rowData = rows[i];
          
          const nomeObmPlanilha = rowData[6] ? String(rowData[6]).trim().toUpperCase() : null;
          
          if (!nomeObmPlanilha) continue;

          // 3. Verifica a existência usando o mapa em memória
          const obmId = obmMap.get(nomeObmPlanilha);

          if (obmId) {
            const dadosParaAtualizar = {
              cidade: rowData[5] ? String(rowData[5]).trim() : undefined,
              telefone: rowData[8] ? String(rowData[8]).trim() : undefined,
              updated_at: db.fn.now(),
            };

            // Remove campos que não foram fornecidos na planilha
            Object.keys(dadosParaAtualizar).forEach(key => dadosParaAtualizar[key] === undefined && delete dadosParaAtualizar[key]);

            if (Object.keys(dadosParaAtualizar).length > 1) { // Apenas atualiza se houver dados novos
              await trx('obms').where({ id: obmId }).update(dadosParaAtualizar);
              updatedCount++;
            }
          } else {
            processingErrors.push(`Linha ${i + 1}: OBM "${rowData[6]}" não encontrada no banco de dados.`);
          }
        }
      });

      res.status(200).json({
        message: `Arquivo processado! OBMs atualizadas: ${updatedCount}.`,
        updated: updatedCount,
        errors: processingErrors,
      });

    } catch (error) {
      console.error("Erro durante a importação de OBMs:", error);
      throw new AppError(error.message || "Ocorreu um erro inesperado durante a importação.", 500);
    } finally {
      fs.unlinkSync(filePath);
    }
  },
};

module.exports = obmFileController;
