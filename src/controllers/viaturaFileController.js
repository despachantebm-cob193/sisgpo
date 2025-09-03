// Arquivo: src/controllers/viaturaFileController.js (Completo e Corrigido)

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
      // Lê os dados da planilha
      const workbook = xlsx.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      rows = xlsx.utils.sheet_to_json(worksheet, { header: 1, defval: "" });

      let insertedCount = 0;
      let updatedCount = 0;
      const processingErrors = [];
      let ignoredCount = 0;

      // Inicia a transação com o banco de dados
      await db.transaction(async trx => {
        // Itera sobre as linhas da planilha, pulando o cabeçalho (índice 0)
        for (let i = 1; i < rows.length; i++) {
          const rowData = rows[i];
          const tipoEscala = rowData[2] ? String(rowData[2]).trim().toUpperCase() : '';

          // Pula a linha se a coluna C não contiver "VIATURA"
          if (!tipoEscala.includes('VIATURA')) {
            ignoredCount++;
            continue;
          }

          // Extrai os dados das colunas corretas
          const prefixo = rowData[3] ? String(rowData[3]).trim() : null;
          const cidade = rowData[5] ? String(rowData[5]).trim() : 'Não informada';
          const nomeObm = rowData[6] ? String(rowData[6]).trim() : null;
          const telefone = rowData[8] ? String(rowData[8]).trim() : null;

          // Pula a linha se dados essenciais (prefixo, nome da OBM) estiverem faltando
          if (!prefixo || !nomeObm) {
            ignoredCount++;
            continue;
          }

          // --- LÓGICA DE UPSERT PARA VIATURAS ---
          const viaturaData = {
            prefixo: prefixo,
            ativa: true,
            cidade: cidade,
            obm: nomeObm,
            telefone: telefone,
          };

          // Verifica se a viatura já existe pelo prefixo
          const existingViatura = await trx('viaturas').where({ prefixo }).first();

          if (existingViatura) {
            // Se existe, ATUALIZA
            await trx('viaturas').where({ id: existingViatura.id }).update({
              ...viaturaData,
              updated_at: db.fn.now(),
            });
            updatedCount++;
          } else {
            // Se não existe, INSERE
            await trx('viaturas').insert(viaturaData);
            insertedCount++;
          }
        }
      }); // Fim da transação

      res.status(200).json({
        message: `Arquivo processado! Inseridas: ${insertedCount}, Atualizadas: ${updatedCount}, Ignoradas: ${ignoredCount}.`,
        inserted: insertedCount,
        updated: updatedCount,
        errors: processingErrors,
      });

    } catch (error) {
      console.error("Erro durante a importação:", error);
      // Garante que o erro seja encapsulado em um AppError para o middleware de erro
      throw new AppError(error.message || "Ocorreu um erro inesperado durante a importação.", 500);
    } finally {
      // Garante que o arquivo temporário seja sempre removido
      if (req.file && req.file.path) {
        fs.unlinkSync(filePath);
      }
    }
  },
};

module.exports = viaturaFileController;
