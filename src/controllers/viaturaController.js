// Arquivo: src/controllers/viaturaController.js (VERSÃO CORRIGIDA)

const db = require('../config/database');
const AppError = require('../utils/AppError');
const { normalizeText } = require('../utils/textUtils');

const buildObmAbbreviationMap = (obms) => {
  const map = new Map();

  obms.forEach((obm) => {
    const possibleKeys = new Set();
    const nome = obm.nome || '';
    const abreviatura = obm.abreviatura || '';

    const pushKey = (value) => {
      if (!value) return;
      const normalized = normalizeText(value);
      if (normalized) {
        possibleKeys.add(normalized);
      }
    };

    pushKey(nome);
    pushKey(abreviatura);

    if (nome.includes('-')) {
      const firstSegment = nome.split('-')[0].trim();
      pushKey(firstSegment);
    }

    possibleKeys.forEach((key) => {
      if (!map.has(key)) {
        map.set(key, abreviatura);
      }
    });
  });

  return map;
};

// Cada função é anexada diretamente ao objeto 'exports'
// Isso garante que elas estarão disponíveis no momento da importação.

exports.getAll = async (req, res) => {
  const { page = 1, limit = 15, prefixo } = req.query;
  const offset = (page - 1) * limit;

  const query = db('viaturas as v')
    .leftJoin('obms as o', function () {
      this.on(db.raw('LOWER(v.obm)'), '=', db.raw('LOWER(o.nome)'));
    })
    .select(
      'v.id',
      'v.prefixo',
      'v.ativa',
      'v.cidade',
      'v.obm',
      'v.telefone',
      'o.id as obm_id',
      'o.abreviatura as obm_abreviatura'
    );

  if (prefixo) {
    query.where('v.prefixo', 'ilike', `%${prefixo}%`);
  }

  const countQuery = query.clone().clearSelect().clearOrder().count({ count: 'v.id' }).first();
  const dataQuery = query.clone().orderBy('v.prefixo', 'asc').limit(limit).offset(offset);
  
  const [data, totalResult] = await Promise.all([dataQuery, countQuery]);

  const needsFallback = data.some((viatura) => !viatura.obm_abreviatura && viatura.obm);
  if (needsFallback) {
    const obms = await db('obms').select('nome', 'abreviatura');
    const obmMap = buildObmAbbreviationMap(obms);

    data.forEach((viatura) => {
      if (viatura.obm && !viatura.obm_abreviatura) {
        const keysToTry = [];
        const normalized = normalizeText(viatura.obm);
        if (normalized) keysToTry.push(normalized);
        if (viatura.obm.includes('-')) {
          const firstSegment = viatura.obm.split('-')[0].trim();
          const normalizedFirst = normalizeText(firstSegment);
          if (normalizedFirst) keysToTry.push(normalizedFirst);
        }

        for (const key of keysToTry) {
          if (obmMap.has(key)) {
            viatura.obm_abreviatura = obmMap.get(key);
            break;
          }
        }
      }
    });
  }
  const totalRecords = parseInt(totalResult.count, 10);
  const totalPages = Math.ceil(totalRecords / limit);

  return res.status(200).json({
    data,
    pagination: { currentPage: Number(page), perPage: Number(limit), totalPages, totalRecords },
  });
};

exports.getAllSimple = async (req, res) => {
  const { obm } = req.query;
  const normalizedObm = obm ? String(obm).trim() : null;

  const viaturasQuery = db('viaturas as v')
    .leftJoin('obms as o', function () {
      this.on(db.raw('LOWER(v.obm)'), '=', db.raw('LOWER(o.nome)'));
    })
    .select('v.id', 'v.prefixo', 'v.obm', 'o.id as obm_id', 'o.abreviatura as obm_abreviatura')
    .where('v.ativa', true)
    .orderBy('v.prefixo', 'asc');

  if (normalizedObm) {
    viaturasQuery.andWhere('v.obm', 'ilike', normalizedObm);
  }

  const viaturas = await viaturasQuery;

  const needsFallback = viaturas.some((viatura) => !viatura.obm_abreviatura && viatura.obm);
  if (needsFallback) {
    const obms = await db('obms').select('nome', 'abreviatura');
    const obmMap = buildObmAbbreviationMap(obms);

    viaturas.forEach((viatura) => {
      if (viatura.obm && !viatura.obm_abreviatura) {
        const keysToTry = [];
        const normalized = normalizeText(viatura.obm);
        if (normalized) keysToTry.push(normalized);
        if (viatura.obm.includes('-')) {
          const firstSegment = viatura.obm.split('-')[0].trim();
          const normalizedFirst = normalizeText(firstSegment);
          if (normalizedFirst) keysToTry.push(normalizedFirst);
        }

        for (const key of keysToTry) {
          if (obmMap.has(key)) {
            viatura.obm_abreviatura = obmMap.get(key);
            break;
          }
        }
      }
    });
  }

  return res.status(200).json({ data: viaturas });
};

exports.countByObm = async (req, res) => {
  const obm = typeof req.query.obm === 'string' ? req.query.obm.trim() : '';
  const excludeId = req.query.exclude_id;

  if (!obm) {
    return res.status(200).json({ count: 0 });
  }

  const query = db('viaturas').where('obm', obm);
  if (excludeId) {
    query.andWhere('id', '!=', excludeId);
  }

  const result = await query.count({ count: 'id' }).first();
  const count = result && result.count !== undefined ? parseInt(result.count, 10) : 0;

  return res.status(200).json({ count: Number.isNaN(count) ? 0 : count });
};


exports.search = async (req, res) => {
  const term = typeof req.query.term === 'string' ? req.query.term.trim() : '';

  if (!term || term.length < 2) {
    return res.status(200).json([]);
  }

  const viaturas = await db('viaturas')
    .where('prefixo', 'ilike', `%${term}%`)
    .orWhere('obm', 'ilike', `%${term}%`)
    .orderBy('prefixo', 'asc')
    .select('id', 'prefixo', 'obm', 'cidade', 'ativa');

  const options = viaturas.map((viatura) => ({
    value: viatura.id,
    label: viatura.obm ? `${viatura.prefixo} - ${viatura.obm}` : viatura.prefixo,
    viatura,
  }));

  return res.status(200).json(options);
};

exports.create = async (req, res) => {
  const { prefixo, ativa, cidade, obm, telefone } = req.body;
  const viaturaExists = await db('viaturas').where({ prefixo }).first();
  if (viaturaExists) {
    throw new AppError('Prefixo já cadastrado no sistema.', 409);
  }
  const [novaViatura] = await db('viaturas').insert({ prefixo, ativa, cidade, obm, telefone }).returning('*');
  return res.status(201).json(novaViatura);
};

exports.update = async (req, res) => {
  const { id } = req.params;
  const {
    prefixo,
    ativa,
    cidade,
    obm,
    telefone,
    applyToDuplicates,
    previous_obm: previousObmPayload,
  } = req.body;

  const viaturaAtual = await db('viaturas').where({ id }).first();
  if (!viaturaAtual) {
    throw new AppError('Viatura n�o encontrada.', 404);
  }

  if (prefixo && prefixo !== viaturaAtual.prefixo) {
    const conflict = await db('viaturas').where({ prefixo }).andWhere('id', '!=', id).first();
    if (conflict) throw new AppError('O novo prefixo j� est� em uso.', 409);
  }

  const dadosAtualizacao = { prefixo, ativa, cidade, obm, telefone, updated_at: db.fn.now() };
  const [viaturaAtualizada] = await db('viaturas').where({ id }).update(dadosAtualizacao).returning('*');

  const previousObm = typeof previousObmPayload === 'string' ? previousObmPayload.trim() : null;
  const shouldApplyBulk =
    typeof applyToDuplicates === 'boolean'
      ? applyToDuplicates
      : typeof applyToDuplicates === 'string'
        ? ['true', '1', 'on', 'yes'].includes(applyToDuplicates.toLowerCase())
        : false;

  if (shouldApplyBulk && previousObm && obm && previousObm !== obm) {
    await db('viaturas')
      .where('obm', previousObm)
      .andWhereNot('id', id)
      .update({ obm, updated_at: db.fn.now() });
  }

  return res.status(200).json(viaturaAtualizada);
};

exports.delete = async (req, res) => {
  const { id } = req.params;
  const result = await db('viaturas').where({ id }).del();
  if (result === 0) {
    throw new AppError('Viatura não encontrada.', 404);
  }
  return res.status(204).send();
};

exports.getDistinctObms = async (req, res) => {
    const distinctData = await db('viaturas').distinct('obm', 'cidade').whereNotNull('obm').orderBy('obm', 'asc');
    const options = distinctData.map(item => ({ value: item.obm, label: item.obm, cidade: item.cidade }));
    return res.status(200).json(options);
};

// --- INÍCIO DA CORREÇÃO ---
exports.clearAll = async (req, res, next) => { // Adicionado 'next'
  try {
    // 1. Usar .del() em vez de TRUNCATE.
    // As regras 'onDelete' nas migrações cuidarão das tabelas relacionadas.
    await db('viaturas').del();

    // 2. Limpar os metadados
    await db('metadata').where({ key: 'viaturas_last_upload' }).del();

    return res.status(200).json({ message: 'Tabela de viaturas limpa com sucesso!' });
  } catch (error) {
    // 3. Adicionar tratamento de erro
    console.error("ERRO AO LIMPAR VIATURAS:", error);
    next(new AppError("Não foi possível limpar a tabela de viaturas.", 500));
  }
};
// --- FIM DA CORREÇÃO ---

exports.getAeronaves = async (req, res) => {
    const aeronaves = await db('aeronaves').where('ativa', true).select('id', 'prefixo').orderBy('prefixo', 'asc');
    return res.status(200).json({ data: aeronaves });
};

exports.toggleActive = async (req, res) => {
  const { id } = req.params;

  const viatura = await db('viaturas').where({ id }).first();
  if (!viatura) {
    throw new AppError('Viatura nǜo encontrada.', 404);
a }

  const novaSituacao = !viatura.ativa;

  await db('viaturas')
    .where({ id })
    .update({ ativa: novaSituacao, updated_at: db.fn.now() });

  return res.status(200).json({
    message: novaSituacao ? 'Viatura ativada com sucesso.' : 'Viatura desativada com sucesso.',
    viatura: { ...viatura, ativa: novaSituacao },
  });
};



