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

    try {
      const workbook = xlsx.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const rows = xlsx.utils.sheet_to_json(worksheet, { header: 1, defval: "" });

      let insertedViaturaCount = 0;
      let updatedViaturaCount = 0;
      let insertedObmCount = 0;
      let updatedObmCount = 0;
      const processingErrors = [];
      let ignoredCount = 0;

      // Inicia uma transação para garantir a atomicidade da operação.
      await db.transaction(async trx => {
        for (let i = 1; i < rows.length; i++) { // Começa em 1 para pular o cabeçalho
          const rowData = rows[i];
          const rowIndex = i + 1;

          // 1. Filtra a linha pela Coluna C (índice 2)
          const tipoEscala = rowData[2] ? String(rowData[2]).trim().toUpperCase() : '';
          if (!tipoEscala.includes('VIATURA')) {
            ignoredCount++;
            continue;
          }

          // 2. Extrai os dados brutos da planilha
          const prefixo = rowData[3] ? String(rowData[3]).trim() : null;
          const nomeUnidade = rowData[6] ? String(rowData[6]).trim() : null;
          const cidade = rowData[7] ? String(rowData[7]).trim() : 'Não informada'; // Coluna H
          const telefone = rowData[8] ? String(rowData[8]).trim() : null;      // Coluna I

          if (!prefixo || !nomeUnidade) {
            processingErrors.push(`Linha ${rowIndex}: Prefixo ou Nome da Unidade não preenchidos.`);
            continue;
          }

          // 3. Lógica para Criar ou Atualizar a OBM
          let obmId;
          const nomeUnidadeUpper = nomeUnidade.toUpperCase();
          
          const existingObm = await trx('obms').whereRaw('UPPER(nome) = ?', [nomeUnidadeUpper]).first();

          if (existingObm) {
            obmId = existingObm.id;
            await trx('obms').where({ id: obmId }).update({
              cidade: cidade,
              telefone: telefone,
              updated_at: db.fn.now()
            });
            updatedObmCount++;
          } else {
            const [newObm] = await trx('obms').insert({
              nome: nomeUnidade,
              abreviatura: nomeUnidade.substring(0, 20), // Gera uma abreviação a partir do nome
              cidade: cidade,
              telefone: telefone
            }).returning('id');
            obmId = newObm.id;
            insertedObmCount++;
          }

          // 4. Lógica para Criar ou Atualizar a Viatura (com a estrutura de tabela simplificada)
          const viaturaData = {
            prefixo: prefixo,
            obm_id: obmId,
            ativa: true,
          };

          const existingViatura = await trx('viaturas').where({ prefixo: prefixo }).first();

          if (existingViatura) {
            await trx('viaturas').where({ id: existingViatura.id }).update({ ...viaturaData, updated_at: db.fn.now() });
            updatedViaturaCount++;
          } else {
            await trx('viaturas').insert(viaturaData);
            insertedViaturaCount++;
          }
        }
      });

      res.status(200).json({
        message: `Importação concluída! ${ignoredCount} linhas foram ignoradas.`,
        viaturas: { inserted: insertedViaturaCount, updated: updatedViaturaCount },
        obms: { inserted: insertedObmCount, updated: updatedObmCount },
        errors: processingErrors,
      });

    } catch (error) {
      console.error('Erro durante a importação:', error);
      throw new AppError(error.message || 'Ocorreu um erro inesperado durante o processamento do arquivo.', 500);
    } finally {
      // Garante que o arquivo temporário seja sempre removido
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
  },
};

module.exports = viaturaFileController;
