// Arquivo: backend/src/controllers/contatoController.js (Versão Super Flexível)

const db = require('../config/database');
const AppError = require('../utils/AppError');
const csv = require('csv-parser');
const fs = require('fs');

const contatoController = {
  upload: async (req, res) => {
    if (!req.file) {
      throw new AppError('Nenhum arquivo foi enviado.', 400);
    }

    const filePath = req.file.path;
    const contatosDoCSV = [];
    let ignoredCount = 0;
    let firstRowHeaders = null;

    try {
      await new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
          .pipe(csv({
            mapHeaders: ({ header }) => header.trim().toLowerCase(),
          }))
          .on('data', (row) => {
            if (!firstRowHeaders) {
              firstRowHeaders = Object.keys(row);
            }

            // **CORREÇÃO FINAL:** Adiciona todas as variações encontradas
            const orgao = row['orgao'] || row['órgão'];
            const secao = row['secao_departamento'] || row['seção/departamento'] || row['seção_departamento'] || row['secão / departamento'];
            const telefone = row['telefone'];
            const obm_local = row['obm_local'] || row['obm local'] || row['obm / local'];

            if (orgao && secao && telefone) {
              contatosDoCSV.push({
                orgao: orgao.trim(),
                obm_local: (obm_local || '').trim(),
                secao_departamento: secao.trim(),
                telefone: telefone.trim(),
              });
            } else {
              ignoredCount++;
            }
          })
          .on('end', resolve)
          .on('error', reject);
      });

      if (contatosDoCSV.length === 0) {
        const headersFound = firstRowHeaders ? `Cabeçalhos encontrados: [${firstRowHeaders.join(', ')}]` : 'Nenhum cabeçalho foi lido.';
        throw new AppError(`Nenhum registro válido no CSV. Verifique se as colunas "orgao", "secao/departamento" e "telefone" existem e estão preenchidas. ${headersFound}`, 400);
      }

      await db.transaction(async trx => {
        await trx('contatos_telefonicos').del();
        await trx('contatos_telefonicos').insert(contatosDoCSV);
      });

      res.status(200).json({
        message: `Lista telefônica atualizada! ${contatosDoCSV.length} contatos importados e ${ignoredCount} linhas ignoradas.`,
      });

    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      console.error("Erro inesperado durante o processamento do CSV:", error);
      throw new AppError("Ocorreu um erro inesperado durante a importação.", 500);
    } finally {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
  },

  getAll: async (req, res) => {
    const contatos = await db('contatos_telefonicos').orderBy('orgao').orderBy('obm_local').orderBy('secao_departamento');
    res.status(200).json({ data: contatos, pagination: null });
  },

  getObrasUnicas: async (req, res) => {
    const obms = await db('contatos_telefonicos')
      .distinct('obm_local')
      .whereNotNull('obm_local')
      .orderBy('obm_local', 'asc');
    res.status(200).json(obms.map(item => item.obm_local));
  },
};

module.exports = contatoController;
