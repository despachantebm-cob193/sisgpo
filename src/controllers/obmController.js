const db = require('../config/database');
const AppError = require('../utils/AppError');
const csvParser = require('csv-parser');
const { Readable } = require('stream');
const { normalizeText } = require('../utils/textUtils');

const ACCENT_FROM = 'ÁÀÃÂÄáàãâäÉÈÊËéèêëÍÌÎÏíìîïÓÒÕÔÖóòõôöÚÙÛÜúùûüÇçÑñ';
const ACCENT_TO = 'AAAAAaaaaaEEEEeeeeIIIIiiiiOOOOOoooooUUUUuuuuCcNn';

const FIELD_LIMITS = {
  abreviatura: { limit: 20, label: 'Abreviatura' },
  nome: { limit: 100, label: 'Nome' },
  cidade: { limit: 50, label: 'Cidade' },
  telefone: { limit: 20, label: 'Telefone' },
};

const applyAccentInsensitiveFilter = (queryBuilder, column, value) => {
  const normalized = normalizeText(value);
  queryBuilder.whereRaw(
    `translate(lower(coalesce(${column}, '')), ?, ?) LIKE ?`,
    [ACCENT_FROM, ACCENT_TO, `%${normalized}%`]
  );
};

const obmController = {
  getAll: async (req, res) => {
    const { nome, abreviatura, cidade } = req.query;
    const query = db('obms').select('*');

    if (nome) {
      applyAccentInsensitiveFilter(query, 'nome', nome);
    }
    if (abreviatura) {
      applyAccentInsensitiveFilter(query, 'abreviatura', abreviatura);
    }
    if (cidade) {
      applyAccentInsensitiveFilter(query, 'cidade', cidade);
    }

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
      const normalizedTerm = normalizeText(term);
      const obms = await db('obms')
        .whereRaw(
          `translate(lower(coalesce(nome, '')), ?, ?) LIKE ?`,
          [ACCENT_FROM, ACCENT_TO, `%${normalizedTerm}%`]
        )
        .orWhereRaw(
          `translate(lower(coalesce(abreviatura, '')), ?, ?) LIKE ?`,
          [ACCENT_FROM, ACCENT_TO, `%${normalizedTerm}%`]
        )
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
    const { nome, abreviatura, cidade, telefone, crbm } = req.body;

    const nomeTrim = nome ? nome.trim() : '';
    const abreviaturaTrim = abreviatura ? abreviatura.trim() : '';

    if (!nomeTrim) {
      throw new AppError('O nome da OBM nao pode ser vazio.', 400);
    }
    if (!abreviaturaTrim) {
      throw new AppError('A abreviatura da OBM nao pode ser vazia.', 400);
    }

    const exists = await db('obms').where('abreviatura', abreviaturaTrim).first();
    if (exists) {
      throw new AppError('Abreviatura ja cadastrada no sistema.', 409);
    }

    const [novaObm] = await db('obms')
      .insert({
        nome: nomeTrim,
        abreviatura: abreviaturaTrim,
        cidade: cidade || null,
        telefone: telefone || null,
        crbm: crbm || null,
      })
      .returning('*');

    res.status(201).json(novaObm);
  },

  update: async (req, res) => {
    const { id } = req.params;
    const { nome, abreviatura, cidade, telefone, crbm } = req.body;

    const obmId = Number(id);
    const nomeTrim = nome ? nome.trim() : '';
    const abreviaturaTrim = abreviatura ? abreviatura.trim() : '';

    if (!nomeTrim) {
      throw new AppError('O nome da OBM nao pode ser vazio.', 400);
    }
    if (!abreviaturaTrim) {
      throw new AppError('A abreviatura da OBM nao pode ser vazia.', 400);
    }

    const obmPraAtualizar = await db('obms').where({ id: obmId }).first();
    if (!obmPraAtualizar) {
      throw new AppError('OBM nao encontrada.', 404);
    }

    if (abreviaturaTrim !== obmPraAtualizar.abreviatura) {
      const conflito = await db('obms')
        .where('abreviatura', abreviaturaTrim)
        .andWhere('id', '!=', obmId)
        .first();

      if (conflito) {
        throw new AppError('A nova abreviatura ja esta em uso por outra OBM.', 409);
      }
    }

    const [obmAtualizada] = await db('obms')
      .where({ id: obmId })
      .update({
        nome: nomeTrim,
        abreviatura: abreviaturaTrim,
        cidade: cidade || null,
        telefone: telefone || null,
        crbm: crbm || null,
        updated_at: db.fn.now(),
      })
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
    let createdCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;

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
              if (value === null || value === undefined) return false;
              return String(value).trim() !== '';
            });
            if (hasData) rows.push(row);
          })
          .on('end', () => resolve(rows))
          .on('error', reject);
      });

      const errors = [];

      for (let index = 0; index < records.length; index += 1) {
        const record = records[index];
        const lineNumber = index + 2;

        const abreviaturaValor = record.abreviatura ? String(record.abreviatura).trim() : '';
        const nomeValor = record.nome ? String(record.nome).trim() : '';
        const cidadeValor = record.cidade ? String(record.cidade).trim() : null;
        const telefoneValor = record.telefone ? String(record.telefone).trim() : null;
        const crbmValor = record.crbm ? String(record.crbm).trim() : null;

        if (!abreviaturaValor || !nomeValor) {
          skippedCount += 1;
          errors.push(`Linha ${lineNumber}: campos obrigatorios "abreviatura" e "nome" sao necessarios.`);
          continue;
        }

        const overflowField = Object.entries({
          abreviatura: abreviaturaValor,
          nome: nomeValor,
          cidade: cidadeValor,
          telefone: telefoneValor,
        }).find(([field, value]) => {
          if (!value) return false;
          const config = FIELD_LIMITS[field];
          return config ? value.length > config.limit : false;
        });

        if (overflowField) {
          const [field, value] = overflowField;
          const config = FIELD_LIMITS[field];
          errors.push(
            `Linha ${lineNumber}: o campo "${config.label}" excede o limite de ${config.limit} caracteres (recebeu ${value.length}).`
          );
          skippedCount += 1;
          continue;
        }

        const dados = {
          nome: nomeValor,
          abreviatura: abreviaturaValor,
          cidade: cidadeValor || null,
          telefone: telefoneValor || null,
          crbm: crbmValor || null,
        };

        const existente = await db('obms').where({ abreviatura: abreviaturaValor }).first();

        if (existente) {
          await db('obms').where({ id: existente.id }).update({
            ...dados,
            updated_at: db.fn.now(),
          });
          updatedCount += 1;
        } else {
          await db('obms').insert(dados);
          createdCount += 1;
        }
      }

      res.status(200).json({
        message: `Arquivo processado! OBMs Criadas: ${createdCount}. OBMs Atualizadas: ${updatedCount}. Registros ignorados: ${skippedCount}.`,
        summary: { created: createdCount, updated: updatedCount, skipped: skippedCount },
        errors,
      });
    } catch (error) {
      console.error('ERRO AO PROCESSAR ARQUIVO CSV DE OBMs:', error);

      if (error instanceof AppError) {
        throw error;
      }

      if (error && error.code === '22001') {
        throw new AppError('Um dos campos excedeu o tamanho maximo permitido pela base de dados.', 400);
      }

      throw new AppError('Erro ao processar o arquivo CSV. Verifique o formato.', 500);
    }
  },

  clearAll: async (_req, res) => {
    const totalRemovidos = await db('obms').del();
    res.status(200).json({
      message:
        totalRemovidos > 0
          ? `Todas as OBMs foram removidas (${totalRemovidos} registros excluidos).`
          : 'Nenhuma OBM encontrada para exclusao.',
    });
  },
};

module.exports = obmController;
