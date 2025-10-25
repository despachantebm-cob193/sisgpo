const db = require('../config/database');
const AppError = require('../utils/AppError');
const csvParser = require('csv-parser');
const { Readable } = require('stream');

const obmController = {
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

      const options = obms.map((obm) => ({
        value: obm.id,
        label: `${obm.abreviatura} - ${obm.nome}`,
      }));

      res.status(200).json(options);
    } catch (error) {
      console.error('Erro ao buscar OBMs:', error);
      throw new AppError('Nao foi possivel realizar a busca por OBMs.', 500);
    }
  },

  create: async (req, res) => {
    const { nome, abreviatura, cidade, telefone } = req.body;

    const abreviaturaTrim = abreviatura ? abreviatura.trim() : '';
    const nomeTrim = nome ? nome.trim() : '';

    if (!nomeTrim) {
      throw new AppError('O nome da OBM nao pode ser vazio.', 400);
    }
    if (!abreviaturaTrim) {
      throw new AppError('A abreviatura da OBM nao pode ser vazia.', 400);
    }

    const siglaExists = await db('obms').where('abreviatura', abreviaturaTrim).first();
    if (siglaExists) {
      throw new AppError('Abreviatura ja cadastrada no sistema.', 409);
    }

    const [novaObm] = await db('obms')
      .insert({
        nome: nomeTrim,
        abreviatura: abreviaturaTrim,
        cidade: cidade || null,
        telefone: telefone || null,
      })
      .returning('*');

    res.status(201).json(novaObm);
  },

  update: async (req, res) => {
    const { id } = req.params;
    const { nome, abreviatura, cidade, telefone } = req.body;

    const obmId = parseInt(id, 10);
    const nomeTrim = nome ? nome.trim() : '';
    const abreviaturaTrim = abreviatura ? abreviatura.trim() : '';

    if (!nomeTrim) {
      throw new AppError('O nome da OBM nao pode ser vazio.', 400);
    }
    if (!abreviaturaTrim) {
      throw new AppError('A abreviatura da OBM nao pode ser vazia.', 400);
    }

    const obmParaAtualizar = await db('obms').where({ id: obmId }).first();
    if (!obmParaAtualizar) {
      throw new AppError('OBM nao encontrada.', 404);
    }

    if (abreviaturaTrim !== obmParaAtualizar.abreviatura) {
      const abreviaturaConflict = await db('obms')
        .where('abreviatura', abreviaturaTrim)
        .andWhere('id', '!=', obmId)
        .first();

      if (abreviaturaConflict) {
        throw new AppError('A nova abreviatura ja esta em uso por outra OBM.', 409);
      }
    }

    const dadosAtualizacao = {
      nome: nomeTrim,
      abreviatura: abreviaturaTrim,
      cidade: cidade || null,
      telefone: telefone || null,
      updated_at: db.fn.now(),
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
      throw new AppError('OBM nao encontrada.', 404);
    }

    res.status(204).send();
  },

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
        const rows = [];

        Readable.from([csvContent])
          .pipe(
            csvParser({
              mapHeaders: ({ header }) => header.replace(/\uFEFF/g, '').toLowerCase(),
              mapValues: ({ value }) => (typeof value === 'string' ? value.trim() : value),
            })
          )
          .on('data', (row) => {
            const hasData = Object.values(row).some((value) => {
              if (value === null || value === undefined) {
                return false;
              }
              return String(value).trim() !== '';
            });

            if (hasData) {
              rows.push(row);
            }
          })
          .on('end', () => resolve(rows))
          .on('error', reject);
      });

      const MAX_ABREVIATURA_LENGTH = 20;

      for (let index = 0; index < records.length; index += 1) {
        const record = records[index];
        const lineNumber = index + 2; // considera cabeçalho na linha 1

        const abreviaturaValor = record.abreviatura ? String(record.abreviatura).trim() : '';
        const nomeValor = record.nome ? String(record.nome).trim() : '';
        const cidadeValor = record.cidade ? String(record.cidade).trim() : null;
        const telefoneValor = record.telefone ? String(record.telefone).trim() : null;

        if (!abreviaturaValor || !nomeValor) {
          continue;
        }

        if (abreviaturaValor.length > MAX_ABREVIATURA_LENGTH) {
          throw new AppError(
            `Linha ${lineNumber}: abreviatura "${abreviaturaValor}" ultrapassa o limite de ${MAX_ABREVIATURA_LENGTH} caracteres.`,
            400
          );
        }

        const dadosOpm = {
          nome: nomeValor,
          abreviatura: abreviaturaValor,
          cidade: cidadeValor || null,
          telefone: telefoneValor || null,
        };

        const obmExistente = await db('obms').where({ abreviatura: abreviaturaValor }).first();

        if (obmExistente) {
          await db('obms')
            .where({ id: obmExistente.id })
            .update({
              ...dadosOpm,
              updated_at: db.fn.now(),
            });
          updatedCount += 1;
        } else {
          await db('obms').insert(dadosOpm);
          createdCount += 1;
        }
      }

      res.status(200).json({
        message: `Arquivo processado! OBMs Criadas: ${createdCount}. OBMs Atualizadas: ${updatedCount}.`,
      });
    } catch (error) {
      console.error('ERRO AO PROCESSAR ARQUIVO CSV DE OBMs:', error);

      if (error instanceof AppError) {
        throw error;
      }

      if (error && error.code === '22001') {
        throw new AppError('Um dos campos excedeu o tamanho máximo permitido pela base de dados.', 400);
      }

      throw new AppError('Erro ao processar o arquivo CSV. Verifique o formato.', 500);
    }
  },
};

module.exports = obmController;
