// Arquivo: backend/src/controllers/viaturaFileController.js (VERSÃO CORRIGIDA)

const db = require('../config/database');
const AppError = require('../utils/AppError');
const xlsx = require('xlsx');
const fs = require('fs');

const viaturaFileController = {
  upload: async (req, res) => {
    const uploaded =
      req.file ||
      (req.files && req.files.file
        ? Array.isArray(req.files.file)
          ? req.files.file[0]
          : req.files.file
        : null);

    if (!uploaded) {
      throw new AppError('Nenhum arquivo foi enviado.', 400);
    }

    const filePath = uploaded.path || uploaded.tempFilePath || null;
    
    try {
      const workbook = filePath
        ? xlsx.readFile(filePath)
        : xlsx.read(uploaded.data, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const rows = xlsx.utils.sheet_to_json(worksheet, { header: 1, defval: "" });

      if (rows.length <= 1) {
        throw new AppError('A planilha está vazia ou contém apenas o cabeçalho.', 400);
      }

      let insertedCount = 0;
      let updatedCount = 0;
      const processingErrors = [];
      let ignoredCount = 0;

      const allViaturas = await db('viaturas').select('id', 'prefixo');
      const viaturaMap = new Map(allViaturas.map(v => [String(v.prefixo).toUpperCase().trim(), v.id]));

      await db.transaction(async trx => {
        for (let i = 1; i < rows.length; i++) {
          const rowData = rows[i];
          const tipoEscala = rowData[2] ? String(rowData[2]).trim().toUpperCase() : '';

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

          const viaturaData = { prefixo, ativa: true, cidade, obm: nomeObm };
          const existingViaturaId = viaturaMap.get(prefixo.toUpperCase().trim());

          if (existingViaturaId) {
            await trx('viaturas').where({ id: existingViaturaId }).update({ ...viaturaData, updated_at: db.fn.now() });
            updatedCount++;
          } else {
            await trx('viaturas').insert(viaturaData);
            insertedCount++;
          }
        }

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
      // Garante que o arquivo temporário seja sempre excluído
      if (filePath && fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
  },
};

module.exports = viaturaFileController;
