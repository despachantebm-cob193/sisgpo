// backend/src/controllers/viaturaFileController.js
const db = require('../config/database');
const AppError = require('../utils/AppError');
const xlsx = require('xlsx');
const fs = require('fs');

const viaturaFileController = {
  upload: async (req, res) => {
    if (!req.file) {
      throw new AppError('Nenhum arquivo foi enviado.', 400);
    }

    const filePath = req.file.path;
    let rows = [];

    try {
      const workbook = xlsx.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      rows = xlsx.utils.sheet_to_json(worksheet, { header: 1, defval: "" });

      // Busca todas as viaturas existentes para otimizar a verificação (upsert)
      const allViaturas = await db('viaturas').select('id', 'prefixo');
      const viaturaMap = new Map(allViaturas.map(vtr => [String(vtr.prefixo).toUpperCase().trim(), vtr.id]));

      let insertedCount = 0;
      let updatedCount = 0;
      const processingErrors = [];
      let ignoredCount = 0;

      await db.transaction(async trx => {
        // Itera a partir da segunda linha para pular o cabeçalho
        for (let i = 1; i < rows.length; i++) {
          const rowData = rows[i];
          
          // Critério: Apenas importar se a coluna C (índice 2) contiver "VIATURA"
          const tipoEscala = rowData[2] ? String(rowData[2]).trim().toUpperCase() : '';
          if (!tipoEscala.includes('VIATURA')) {
            ignoredCount++;
            continue;
          }

          // Extração dos dados das colunas especificadas
          const prefixo = rowData[3] ? String(rowData[3]).trim() : null; // Coluna D
          const cidade = rowData[5] ? String(rowData[5]).trim() : null;  // Coluna F
          const obm = rowData[6] ? String(rowData[6]).trim() : null;     // Coluna G
          const telefone = rowData[8] ? String(rowData[8]).trim() : null; // Coluna I

          if (!prefixo) {
            processingErrors.push(`Linha ${i + 1} ignorada: prefixo (Coluna D) não preenchido.`);
            continue;
          }

          const viaturaData = { prefixo, cidade, obm, telefone, ativa: true };

          try {
            const existingViaturaId = viaturaMap.get(prefixo.toUpperCase());

            if (existingViaturaId) {
              // Atualiza a viatura existente
              await trx('viaturas').where({ id: existingViaturaId }).update({ ...viaturaData, updated_at: db.fn.now() });
              updatedCount++;
            } else {
              // Insere uma nova viatura
              await trx('viaturas').insert(viaturaData);
              insertedCount++;
            }
          } catch (error) {
            processingErrors.push(`Erro de banco ao processar a viatura ${prefixo}: ${error.message}`);
          }
        }
      });

      res.status(200).json({
        message: `Arquivo processado! ${ignoredCount} linhas foram ignoradas por não serem do tipo "VIATURA".`,
        inserted: insertedCount,
        updated: updatedCount,
        errors: processingErrors,
      });

    } catch (error) {
      console.error("Erro durante a importação:", error);
      throw new AppError(error.message || "Ocorreu um erro inesperado ao processar o arquivo.", 500);
    } finally {
      // Garante que o arquivo temporário seja sempre removido
      if (req.file && req.file.path) {
        fs.unlinkSync(filePath);
      }
    }
  },
};

module.exports = viaturaFileController;
