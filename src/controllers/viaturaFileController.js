// Arquivo: backend/src/controllers/viaturaFileController.js (Otimizado)

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

      let insertedCount = 0;
      let updatedCount = 0;
      const processingErrors = [];
      let ignoredCount = 0;

      // 1. Busca todas as viaturas existentes de uma só vez
      const allViaturas = await db('viaturas').select('id', 'prefixo');
      const viaturaMap = new Map(allViaturas.map(v => [v.prefixo.toUpperCase().trim(), v.id]));

      // 2. Inicia a transação
      await db.transaction(async trx => {
        for (let i = 1; i < rows.length; i++) { // Começa da segunda linha para ignorar o cabeçalho
          const rowData = rows[i];
          const tipoEscala = rowData[2] ? String(rowData[2]).trim().toUpperCase() : '';

          // Ignora linhas que não são de viaturas
          if (!tipoEscala.includes('VIATURA')) {
            ignoredCount++;
            continue;
          }

          const prefixo = rowData[3] ? String(rowData[3]).trim() : null;
          const cidade = rowData[5] ? String(rowData[5]).trim() : 'Não informada';
          const nomeObm = rowData[6] ? String(rowData[6]).trim() : null;

          if (!prefixo || !nomeObm) {
            processingErrors.push(`Linha ${i + 1}: Prefixo ou nome da OBM não preenchidos.`);
            ignoredCount++;
            continue;
          }

          const viaturaData = {
            prefixo: prefixo,
            ativa: true,
            cidade: cidade,
            obm: nomeObm,
          };

          // 3. Verifica a existência usando o mapa em memória
          const existingViaturaId = viaturaMap.get(prefixo.toUpperCase().trim());

          if (existingViaturaId) {
            await trx('viaturas').where({ id: existingViaturaId }).update({
              ...viaturaData,
              updated_at: db.fn.now(),
            });
            updatedCount++;
          } else {
            await trx('viaturas').insert(viaturaData);
            insertedCount++;
          }
        }

        // 4. Atualiza o metadado com a data/hora do último upload
        const lastUploadTime = new Date().toISOString();
        await trx('metadata')
          .insert({ key: 'viaturas_last_upload', value: lastUploadTime })
          .onConflict('key')
          .merge();
      });

      res.status(200).json({
        message: `Arquivo processado! Inseridas: ${insertedCount}, Atualizadas: ${updatedCount}, Ignoradas: ${ignoredCount}.`,
        inserted: insertedCount,
        updated: updatedCount,
        errors: processingErrors,
      });

    } catch (error) {
      console.error("Erro durante a importação de viaturas:", error);
      throw new AppError(error.message || "Ocorreu um erro inesperado durante a importação.", 500);
    } finally {
      if (req.file && req.file.path) {
        fs.unlinkSync(filePath);
      }
    }
  },
};

module.exports = viaturaFileController;
