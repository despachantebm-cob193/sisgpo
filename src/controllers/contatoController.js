// src/controllers/contatoController.js
const db = require('../config/database');
const AppError = require('../utils/AppError');
const csv = require('csv-parser');
const fs = require('fs');

const contatoController = {
  /**
   * Lista todos os contatos com paginação e filtros.
   */
  getAll: async (req, res) => {
    // A paginação não é estritamente necessária aqui se o frontend usa virtualização,
    // mas mantemos a estrutura para consistência.
    const contatos = await db('contatos_telefonicos').select('*').orderBy('obm_local', 'asc').orderBy('secao_departamento', 'asc');
    
    res.status(200).json({
      data: contatos,
      pagination: null, // A paginação é controlada no frontend com a lista completa
    });
  },

  /**
   * Processa o upload de um arquivo CSV e atualiza o banco de dados.
   */
  upload: async (req, res) => {
    if (!req.file) {
      throw new AppError('Nenhum arquivo foi enviado.', 400);
    }

    const filePath = req.file.path;
    const contatosParaInserir = [];

    const stream = fs.createReadStream(filePath)
      .pipe(csv({
        mapHeaders: ({ header }) => header.trim().toUpperCase(),
        mapValues: ({ value }) => value.trim()
      }))
      .on('data', (row) => {
        // Validação mínima para garantir que as colunas essenciais existem
        if (row['ORGAO'] && row['SECAO/DEPARTAMENTO'] && row['TELEFONE']) {
          contatosParaInserir.push({
            orgao: row['ORGAO'],
            obm_local: row['OBM/LOCAL'] || null, // Permite valores nulos ou vazios
            secao_departamento: row['SECAO/DEPARTAMENTO'],
            telefone: row['TELEFONE'],
          });
        }
      })
      .on('end', async () => {
        try {
          if (contatosParaInserir.length === 0) {
            fs.unlinkSync(filePath); // Limpa o arquivo temporário
            throw new AppError('O arquivo CSV está vazio ou não contém as colunas necessárias.', 400);
          }

          // Usa uma transação para garantir a atomicidade da operação
          await db.transaction(async trx => {
            // 1. Limpa a tabela antiga
            await trx('contatos_telefonicos').del();
            // 2. Insere os novos dados em lote
            await trx.batchInsert('contatos_telefonicos', contatosParaInserir, 100);
          });

          fs.unlinkSync(filePath); // Limpa o arquivo temporário após o sucesso
          res.status(200).json({ message: `Lista telefônica atualizada com sucesso. ${contatosParaInserir.length} contatos importados.` });

        } catch (error) {
          fs.unlinkSync(filePath); // Garante a limpeza mesmo em caso de erro no DB
          console.error('Erro ao processar o arquivo CSV e inserir no banco:', error);
          throw new AppError('Ocorreu um erro ao salvar os dados da planilha.', 500);
        }
      })
      .on('error', (error) => {
        fs.unlinkSync(filePath); // Limpa o arquivo temporário
        console.error('Erro ao ler o arquivo CSV:', error);
        throw new AppError('Ocorreu um erro ao ler o arquivo CSV.', 500);
      });
  },

  /**
   * Retorna uma lista de nomes únicos de OBMs da tabela de contatos.
   */
  getObrasUnicas: async (req, res) => {
    try {
      const obmsUnicas = await db('contatos_telefonicos')
        .distinct('obm_local') // Seleciona apenas valores distintos
        .whereNotNull('obm_local') // Garante que valores nulos não sejam incluídos
        .andWhere('obm_local', '!=', '') // Garante que valores vazios não sejam incluídos
        .orderBy('obm_local', 'asc'); // Ordena alfabeticamente

      // O resultado é um array de objetos, ex: [{ obm_local: '1º BBM' }, { obm_local: 'ABM' }]
      // Vamos extrair apenas os nomes para retornar um array de strings.
      const nomesObms = obmsUnicas.map(item => item.obm_local);

      res.status(200).json(nomesObms);
    } catch (error) {
      console.error('Erro ao buscar OBMs únicas:', error);
      throw new AppError('Não foi possível carregar a lista de OBMs.', 500);
    }
  },
};

module.exports = contatoController;
