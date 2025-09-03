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

      const allObms = await db('obms').select('id', 'nome');
      const obmNomeMap = new Map(allObms.map(obm => [obm.nome.toUpperCase().trim(), obm.id]));

      const allViaturas = await db('viaturas').select('id', 'prefixo');
      const viaturaMap = new Map(allViaturas.map(vtr => [vtr.prefixo.toUpperCase().trim(), vtr.id]));

      let insertedCount = 0;
      let updatedCount = 0;
      const processingErrors = [];
      let ignoredCount = 0;

      await db.transaction(async trx => {
        for (let i = 1; i < rows.length; i++) {
          const rowData = rows[i];
          const tipoEscala = rowData[2] ? String(rowData[2]).trim().toUpperCase() : '';

          if (!tipoEscala.includes('VIATURA')) {
            ignoredCount++;
            continue;
          }

          const prefixo = rowData[3] ? String(rowData[3]).trim() : null;
          const nomeUnidadePlanilha = rowData[6] ? String(rowData[6]).trim() : null;
          
          // --- CORREÇÃO AQUI: Lendo as colunas corretas para cidade e telefone ---
          const cidadePlanilha = rowData[5] ? String(rowData[5]).trim() : 'Não informada'; // Coluna F (índice 5)
          const telefonePlanilha = rowData[8] ? String(rowData[8]).trim() : null; // Coluna I (índice 8)
          // ----------------------------------------------------------------------

          if (!prefixo || !nomeUnidadePlanilha) continue;

          let obmId = obmNomeMap.get(nomeUnidadePlanilha.toUpperCase());

          if (!obmId) {
            try {
              const [novaObm] = await trx('obms')
                .insert({
                  nome: nomeUnidadePlanilha,
                  abreviatura: nomeUnidadePlanilha.substring(0, 20),
                  cidade: cidadePlanilha, // <-- Usando a variável correta
                  telefone: telefonePlanilha, // <-- Usando a variável correta
                })
                .returning('id');
              
              obmId = novaObm.id;
              obmNomeMap.set(nomeUnidadePlanilha.toUpperCase(), obmId);
            } catch (error) {
              processingErrors.push(`Erro ao criar OBM "${nomeUnidadePlanilha}": ${error.message}`);
              continue;
            }
          } else {
            // Opcional: Atualizar cidade e telefone se a OBM já existir
            await trx('obms').where({ id: obmId }).update({
              cidade: cidadePlanilha,
              telefone: telefonePlanilha,
            });
          }

          const viaturaData = {
            prefixo: prefixo,
            obm_id: obmId,
            ativa: true,
          };

          try {
            const existingViaturaId = viaturaMap.get(prefixo.toUpperCase());
            if (existingViaturaId) {
              await trx('viaturas').where({ id: existingViaturaId }).update({ ...viaturaData, updated_at: db.fn.now() });
              updatedCount++;
            } else {
              await trx('viaturas').insert(viaturaData);
              insertedCount++;
            }
          } catch (error) {
            processingErrors.push(`Erro de banco ao processar a viatura ${prefixo}: ${error.message}`);
          }
        }
      });

      res.status(200).json({
        message: `Arquivo processado! ${ignoredCount} linhas foram ignoradas.`,
        inserted: insertedCount,
        updated: updatedCount,
        errors: processingErrors,
      });

    } catch (error) {
      console.error("Erro durante a importação:", error);
      throw new AppError(error.message, 500);
    } finally {
      if (req.file && req.file.path) {
        fs.unlinkSync(filePath);
      }
    }
  },
};

module.exports = viaturaFileController;
