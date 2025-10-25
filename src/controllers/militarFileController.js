const db = require('../config/database');
const AppError = require('../utils/AppError');
const xlsx = require('xlsx');
const fs = require('fs');

const militarFileController = {
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
      
      const rowsAsObjects = xlsx.utils.sheet_to_json(worksheet, { defval: null });

      if (rowsAsObjects.length === 0) {
        throw new AppError('A planilha está vazia ou em um formato inválido.', 400);
      }

      const existingMilitares = await db('militares').select('matricula');
      const existingMatriculas = new Set(existingMilitares.map(m => String(m.matricula).trim()));

      let inserted = 0;
      let updated = 0;
      const failedRows = [];

      await db.transaction(async trx => {
        for (let i = 0; i < rowsAsObjects.length; i++) {
          const row = rowsAsObjects[i];
          const linhaNumero = i + 2;

          const isRowEmpty = Object.values(row).every(value => value === null || String(value).trim() === '');
          if (isRowEmpty) continue;

          const matricula = row['RG'] || row['rg'];
          const nome_completo = row['Nome'] || row['nome'];
          
          if (!matricula || !nome_completo) {
            failedRows.push({ linha: linhaNumero, motivo: 'Matrícula (RG) ou Nome não preenchidos.' });
            continue;
          }

          const posto_graduacao = row['Graduação'] || row['graduacao'];
          const obm_nome = row['OBM'] || row['obm'];

          const militarData = {
            matricula: String(matricula).trim(),
            nome_completo: String(nome_completo).trim(),
            nome_guerra: '', // Campo não presente na planilha
            posto_graduacao: String(posto_graduacao || '').trim(),
            obm_nome: String(obm_nome || 'Não informada').trim(), // Salva como texto
            ativo: true, // Assume como ativo
          };

          try {
            if (existingMatriculas.has(militarData.matricula)) {
              await trx('militares').where('matricula', militarData.matricula).update({ ...militarData, updated_at: db.fn.now() });
              updated++;
            } else {
              await trx('militares').insert(militarData);
              inserted++;
            }
          } catch (error) {
            failedRows.push({ linha: linhaNumero, motivo: `Erro no banco: ${error.message}` });
          }
        }
      });

      res.status(200).json({
        message: `Sincronização concluída! Inseridos: ${inserted}, Atualizados: ${updated}, Falhas: ${failedRows.length}.`,
        inserted,
        updated,
        failures: failedRows,
      });

    } catch (error) {
      console.error("Erro durante a importação de militares:", error);
      throw new AppError(error.message || "Ocorreu um erro inesperado durante a importação.", 500);
    } finally {
      if (filePath && fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
  },
};

module.exports = militarFileController;
