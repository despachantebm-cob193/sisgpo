// Arquivo: src/controllers/obmController.js (Versão final limpa)

const db = require('../config/database');
const AppError = require('../utils/AppError');
const { parse } = require('csv-parser');

const obmController = {
  // ... (getAll, search, create, update, delete - sem alterações) ...
  getAll: async (req, res) => {
    const { nome, abreviatura, cidade } = req.query;
    const query = db('obms').select('*');
    if (nome) query.where('nome', 'ilike', `%${nome}%`);
    if (abreviatura) query.where('abreviatura', 'ilike', `%${abreviatura}%`);
    if (cidade) query.where('cidade', 'ilike', `%${cidade}%`);
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 15;
    const offset = (page - 1) * limit;
    const countQuery = query.clone().clearSelect().clearOrder().count({ count: '*' }).first();
    const dataQuery = query.clone().orderBy('nome', 'asc').limit(limit).offset(offset);
    const [data, totalResult] = await Promise.all([dataQuery, countQuery]);
    const totalRecords = parseInt(totalResult.count, 10);
    const totalPages = Math.ceil(totalRecords / limit);
    res.status(200).json({
      data,
      pagination: { currentPage: page, perPage: limit, totalPages, totalRecords },
    });
  },
  search: async (req, res) => {
    const { term } = req.query;
    if (!term || term.length < 2) {
      return res.status(200).json([]);
    }
    try {
      const obms = await db('obms')
        .where('nome', 'ilike', `%${term}%`)
        .orWhere('abreviatura', 'ilike', `%${term}%`)
        .select('id', 'nome', 'abreviatura')
        .limit(20);
      const options = obms.map(obm => ({
        value: obm.id,
        label: `${obm.abreviatura} - ${obm.nome}`,
      }));
      res.status(200).json(options);
    } catch (error) {
      console.error("Erro ao buscar OBMs:", error);
      throw new AppError("Não foi possível realizar a busca por OBMs.", 500);
    }
  },
  create: async (req, res) => {
    const { nome, abreviatura, cidade, telefone } = req.body; 
    const siglaExists = await db('obms').where('abreviatura', abreviatura).first(); 
    if (siglaExists) {
      throw new AppError('Abreviatura já cadastrada no sistema.', 409);
    }
    const [novaObm] = await db('obms').insert({ 
      nome, 
      abreviatura,
      cidade: cidade || null, 
      telefone: telefone || null 
    }).returning('*');
    res.status(201).json(novaObm);
  },
  update: async (req, res) => {
    const { id } = req.params;
    const { nome, abreviatura, cidade, telefone } = req.body; 
    const obmId = parseInt(id, 10);
    if (!nome || nome.trim() === '') {
      throw new AppError('O nome da OBM não pode ser vazio.', 400);
    }
    if (!abreviatura || abreviatura.trim() === '') {
      throw new AppError('A abreviatura da OBM não pode ser vazia.', 400);
    }
    const obmParaAtualizar = await db('obms').where({ id: obmId }).first();
    if (!obmParaAtualizar) {
      throw new AppError('OBM não encontrada.', 404);
    }
    if (abreviatura && abreviatura !== obmParaAtualizar.abreviatura) {
      const abreviaturaConflict = await db('obms')
        .where('abreviatura', abreviatura) 
        .andWhere('id', '!=', obmId)
        .first();
      if (abreviaturaConflict) {
        throw new AppError('A nova abreviatura já está em uso por outra OBM.', 409);
      }
    }
    const dadosAtualizacao = { 
      nome, 
      abreviatura, 
      cidade: cidade || null, 
      telefone: telefone || null, 
      updated_at: db.fn.now() 
    };
    const [obmAtualizada] = await db('obms')
      .where({ id: obmId })
      .update(dadosAtualizacao)
      .returning('*');
    res.status(200).json(obmAtualizada);
  },
  delete: async (req, res) => {
    const { id } = req.params;
    const result = await db('obms').where({ id }).del();
    if (result === 0) {
      throw new AppError('OBM não encontrada.', 404);
    }
    res.status(204).send();
  },

  /**
   * Faz upload de um arquivo CSV para ATUALIZAR ou CRIAR OBMs (Lógica UPSERT).
   */
  uploadCsv: async (req, res) => {
    if (!req.files || Object.keys(req.files).length === 0) {
      throw new AppError('Nenhum arquivo foi enviado.', 400);
    }

    const obmFile = req.files.file;
    const csvContent = obmFile.data.toString('utf8');
    let updatedCount = 0;
    let createdCount = 0;

    try {
      const records = await new Promise((resolve, reject) => {
        parse(csvContent, { 
          columns: true, 
          skip_empty_lines: true, 
          trim: true,
          // Converte cabeçalhos para minúsculo e remove BOM (caractere oculto)
          mapHeaders: ({ header }) => header.replace(/\uFEFF/g, '').toLowerCase(),
        }, (err, output) => {
          if (err) return reject(err);
          resolve(output);
        });
      });

      for (const record of records) {
        // Busca os cabeçalhos em minúsculo
        const { abreviatura, nome, cidade, telefone } = record;

        // Verifica se os campos mínimos (abreviatura e nome) existem
        if (abreviatura && nome) {
          const dadosOpm = {
            nome,
            abreviatura,
            cidade: cidade || null,
            telefone: telefone || null,
          };

          const obmExistente = await db('obms').where({ abreviatura }).first();

          if (obmExistente) {
            // Se existir, ATUALIZA
            await db('obms')
              .where({ id: obmExistente.id })
              .update({ 
                ...dadosOpm, 
                updated_at: db.fn.now() 
              });
            updatedCount++;
          } else {
            // Se não existir, CRIA
            await db('obms').insert(dadosOpm);
            createdCount++;
          }
        }
      }

      res.status(200).json({ 
        message: `Arquivo processado! OBMs Criadas: ${createdCount}. OBMs Atualizadas: ${updatedCount}.` 
      });

    } catch (error) {
      console.error("ERRO AO PROCESSAR ARQUIVO CSV DE OBMs:", error);
      throw new AppError("Erro ao processar o arquivo CSV. Verifique o formato.", 500);
    }
  },
};

module.exports = obmController;