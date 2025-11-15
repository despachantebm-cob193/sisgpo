const db = require('../config/database');
const AppError = require('../utils/AppError');
const { normalizeText } = require('../utils/textUtils');

const parseBoolean = (value, defaultValue = false) => {
  if (value === undefined || value === null) {
    return defaultValue;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  return ['true', '1', 'yes', 'on'].includes(String(value).trim().toLowerCase());
};

const parsePositiveNumber = (value, defaultValue) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return defaultValue;
  }
  return parsed;
};

const buildObmAbbreviationMap = (obms) => {
  const map = new Map();

  obms.forEach((obm) => {
    const keys = new Set();
    const nome = obm.nome || '';
    const abreviatura = obm.abreviatura || '';

    const pushKey = (rawValue) => {
      if (!rawValue) return;
      const normalized = normalizeText(rawValue);
      if (normalized) {
        keys.add(normalized);
      }
    };

    pushKey(nome);
    pushKey(abreviatura);

    if (nome.includes('-')) {
      pushKey(nome.split('-')[0].trim());
    }

    keys.forEach((key) => {
      if (!map.has(key)) {
        map.set(key, { id: obm.id, abreviatura: obm.abreviatura });
      }
    });
  });

  return map;
};

const hydrateObmFallback = async (viaturas) => {
  const needsFallback = viaturas.some((viatura) => !viatura.obm_abreviatura && viatura.obm);
  if (!needsFallback) {
    return viaturas;
  }

  const obms = await db('obms').select('id', 'nome', 'abreviatura');
  const obmMap = buildObmAbbreviationMap(obms);

  viaturas.forEach((viatura) => {
    if (!viatura.obm || viatura.obm_abreviatura) return;

    const candidates = [];
    const normalized = normalizeText(viatura.obm);
    if (normalized) {
      candidates.push(normalized);
    }
    if (viatura.obm.includes('-')) {
      const firstSegment = viatura.obm.split('-')[0].trim();
      const normalizedFirst = normalizeText(firstSegment);
      if (normalizedFirst) {
        candidates.push(normalizedFirst);
      }
    }

    for (const key of candidates) {
      if (obmMap.has(key)) {
        const match = obmMap.get(key);
        viatura.obm_id = match.id;
        viatura.obm_abreviatura = match.abreviatura;
        break;
      }
    }
  });

  return viaturas;
};

exports.getAll = async (req, res, next) => {
  try {
    const page = parsePositiveNumber(req.query.page, 1);
    const limit = parsePositiveNumber(req.query.limit, 15);
    const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    const obm = typeof req.query.obm === 'string' ? req.query.obm.trim() : '';
    const cidade = typeof req.query.cidade === 'string' ? req.query.cidade.trim() : '';

    const baseQuery = db('viaturas as v')
      .leftJoin('obms as o', function joinObms() {
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
        'o.abreviatura as obm_abreviatura',
      );

    if (q) {
      baseQuery.where(function() {
        this.where(db.raw('v.prefixo::text'), 'ilike', `%${q}%`)
            .orWhere(db.raw('v.cidade::text'), 'ilike', `%${q}%`)
            .orWhere(db.raw('v.obm::text'), 'ilike', `%${q}%`)
            .orWhere(db.raw('o.abreviatura::text'), 'ilike', `%${q}%`);
      });
    }

    if (obm) {
        baseQuery.where('v.obm', obm);
    }

    if (cidade) {
        baseQuery.where('v.cidade', cidade);
    }

    const offset = (page - 1) * limit;

    const countQuery = baseQuery.clone().clearSelect().clearOrder().count({ count: 'v.id' }).first();
    const dataQuery = baseQuery.clone().orderBy('v.prefixo', 'asc').limit(limit).offset(offset);

    const [data, totalResult] = await Promise.all([dataQuery, countQuery]);
    await hydrateObmFallback(data);

    const totalRecords = Number(totalResult?.count ?? 0);
    const totalPages = Math.ceil(totalRecords / limit) || 1;

    return res.status(200).json({
      data,
      pagination: {
        currentPage: page,
        perPage: limit,
        totalPages,
        totalRecords,
      },
    });
  } catch (error) {
    return next(error);
  }
};

exports.getAllSimple = async (req, res, next) => {
  try {
    const targetObmRaw =
      typeof req.query.obm === 'string' && req.query.obm.trim().length > 0
        ? req.query.obm.trim()
        : 'COA';
    const targetLower = targetObmRaw.toLowerCase();
    const includeAereo = parseBoolean(req.query.includeAereo, true);

    const viaturasRaw = await db('viaturas as v')
      .leftJoin('obms as o', function joinObms() {
        this.on(db.raw('LOWER(v.obm)'), '=', db.raw('LOWER(o.nome)'));
      })
      .select('v.id', 'v.prefixo', 'v.obm', 'o.abreviatura as obm_abreviatura')
      .where('v.ativa', true)
      .orderBy('v.prefixo', 'asc');
    const viaturas = await hydrateObmFallback(viaturasRaw);

    const normalizedTarget = normalizeText(targetObmRaw);

    const filtered = viaturas.filter((viatura) => {
      const abrev = (viatura.obm_abreviatura || '').trim().toLowerCase();
      const nomeOriginal = viatura.obm || '';
      const nomeNormalized = normalizeText(nomeOriginal);

      const matchesSigla =
        abrev === targetLower ||
        nomeNormalized === normalizedTarget ||
        nomeOriginal.trim().toLowerCase() === targetLower;

      if (matchesSigla) return true;

      if (!includeAereo) return false;

      return nomeNormalized.includes('aereo');
    });

    const responseData = filtered.map(({ id, prefixo }) => ({ id, prefixo }));

    return res.status(200).json({ data: responseData });
  } catch (error) {
    console.error('[viaturaController.getAllSimple] Erro ao buscar prefixos:', error);
    return next(new AppError('Não foi possível carregar os prefixos de viatura.', 500));
  }
};

exports.countByObm = async (req, res, next) => {
  try {
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
    const count = result?.count ? parseInt(result.count, 10) : 0;

    return res.status(200).json({ count: Number.isNaN(count) ? 0 : count });
  } catch (error) {
    return next(error);
  }
};

exports.search = async (req, res, next) => {
  try {
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
  } catch (error) {
    return next(error);
  }
};

exports.create = async (req, res, next) => {
  try {
    const { prefixo, ativa, cidade, obm, telefone } = req.body;
    const viaturaExists = await db('viaturas').where({ prefixo }).first();

    if (viaturaExists) {
      throw new AppError('Prefixo já cadastrado no sistema.', 409);
    }

    const [novaViatura] = await db('viaturas')
      .insert({ prefixo, ativa: parseBoolean(ativa, true), cidade, obm, telefone })
      .returning('*');

    return res.status(201).json(novaViatura);
  } catch (error) {
    return next(error);
  }
};

exports.update = async (req, res, next) => {
  try {
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
      throw new AppError('Viatura não encontrada.', 404);
    }

    if (prefixo && prefixo !== viaturaAtual.prefixo) {
      const conflict = await db('viaturas').where({ prefixo }).andWhere('id', '!=', id).first();
      if (conflict) {
        throw new AppError('O novo prefixo já está em uso.', 409);
      }
    }

    const dadosAtualizacao = {
      prefixo,
      ativa: typeof ativa === 'undefined' ? viaturaAtual.ativa : parseBoolean(ativa),
      cidade,
      obm,
      telefone,
      updated_at: db.fn.now(),
    };

    const [viaturaAtualizada] = await db('viaturas').where({ id }).update(dadosAtualizacao).returning('*');

    const previousObm = typeof previousObmPayload === 'string' ? previousObmPayload.trim() : null;
    const shouldApplyBulk = parseBoolean(applyToDuplicates, false);

    if (shouldApplyBulk && previousObm && obm && previousObm !== obm) {
      await db('viaturas')
        .where('obm', previousObm)
        .andWhereNot('id', id)
        .update({ obm, updated_at: db.fn.now() });
    }

    return res.status(200).json(viaturaAtualizada);
  } catch (error) {
    return next(error);
  }
};

exports.delete = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deleted = await db('viaturas').where({ id }).del();

    if (!deleted) {
      throw new AppError('Viatura não encontrada.', 404);
    }

    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
};

exports.getDistinctObms = async (req, res, next) => {
  try {
    const distinctData = await db('viaturas')
      .distinct('obm', 'cidade')
      .whereNotNull('obm')
      .orderBy('obm', 'asc');

    const options = distinctData.map((item) => ({
      value: item.obm,
      label: item.obm,
      cidade: item.cidade,
    }));

    return res.status(200).json(options);
  } catch (error) {
    return next(error);
  }
};

exports.clearAll = async (req, res, next) => {
  try {
    // 1. Check for confirm=1 query parameter
    const confirmQuery = req.query.confirm;
    if (confirmQuery !== '1') {
      throw new AppError('Precondition Required: Adicione "?confirm=1" na URL para confirmar a operacao.', 412);
    }

    // 2. Check for X-Confirm-Purge: VIATURAS header
    const confirmHeader = req.headers['x-confirm-purge'];
    if (confirmHeader !== 'VIATURAS') {
      throw new AppError('Precondition Required: Adicione o cabecalho "X-Confirm-Purge: VIATURAS" para confirmar a operacao.', 412);
    }

    // 3. In production: require ALLOW_VIATURA_PURGE=true
    if (process.env.NODE_ENV === 'production' && process.env.ALLOW_VIATURA_PURGE !== 'true') {
      throw new AppError('Operacao nao permitida em producao sem a flag ALLOW_VIATURA_PURGE=true.', 403);
    }

    // Perform deletion
    await db('plantoes').del(); // This will delete viatura_plantao and militar_plantao due to CASCADE
    await db('viaturas').del();
    await db('metadata').where({ key: 'viaturas_last_upload' }).del();

    return res.status(200).json({ message: 'Tabela de viaturas limpa com sucesso!' });
  } catch (error) {
    console.error('Erro ao limpar viaturas:', error);
    if (error instanceof AppError) {
      return next(error);
    }
    return next(new AppError('Não foi possível limpar a tabela de viaturas.', 500));
  }
};

exports.getAeronaves = async (req, res, next) => {
  try {
    const aeronaves = await db('aeronaves').where('ativa', true).select('id', 'prefixo').orderBy('prefixo', 'asc');
    return res.status(200).json({ data: aeronaves });
  } catch (error) {
    return next(error);
  }
};

exports.toggleActive = async (req, res, next) => {
  try {
    const { id } = req.params;
    const viatura = await db('viaturas').where({ id }).first();

    if (!viatura) {
      throw new AppError('Viatura não encontrada.', 404);
    }

    const novaSituacao = !viatura.ativa;

    await db('viaturas')
      .where({ id })
      .update({ ativa: novaSituacao, updated_at: db.fn.now() });

    return res.status(200).json({
      message: novaSituacao ? 'Viatura ativada com sucesso.' : 'Viatura desativada com sucesso.',
      viatura: { ...viatura, ativa: novaSituacao },
    });
  } catch (error) {
    return next(error);
  }
};

exports.previewClearAll = async (req, res, next) => {
  try {
    // 1. Count total viaturas
    const totalViaturasResult = await db('viaturas').count('id as count').first();
    const totalViaturas = parseInt(totalViaturasResult.count, 10);

    // 2. Count plantoes related to these viaturas (present/future)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const relatedPlantoesResult = await db('plantoes as p')
      .join('viatura_plantao as vp', 'p.id', 'vp.plantao_id')
      .distinct('p.id')
      .where('p.data_plantao', '>=', today.toISOString().split('T')[0])
      .count('p.id as count') // Count distinct plantao IDs
      .first();
    const totalRelatedPlantoes = parseInt(relatedPlantoesResult.count, 10);

    // 3. Count vinculados (militar_plantao and viatura_plantao entries)
    // Get IDs of plantoes that will be affected
    const affectedPlantaoIds = await db('plantoes as p')
      .join('viatura_plantao as vp', 'p.id', 'vp.viatura_id') // Corrected join condition
      .distinct('p.id')
      .where('p.data_plantao', '>=', today.toISOString().split('T')[0])
      .pluck('p.id');

    let totalViaturaVinculos = 0;
    let totalMilitarVinculos = 0;

    if (affectedPlantaoIds.length > 0) {
      const viaturaVinculosResult = await db('viatura_plantao')
        .whereIn('plantao_id', affectedPlantaoIds)
        .count('id as count')
        .first();
      totalViaturaVinculos = parseInt(viaturaVinculosResult.count, 10);

      const militarVinculosResult = await db('militar_plantao')
        .whereIn('plantao_id', affectedPlantaoIds)
        .count('id as count')
        .first();
      totalMilitarVinculos = parseInt(militarVinculosResult.count, 10);
    }

    res.status(200).json({
      totalViaturas,
      totalRelatedPlantoes,
      totalViaturaVinculos,
      totalMilitarVinculos,
    });
  } catch (error) {
    console.error('Erro ao gerar preview de limpeza de viaturas:', error);
    return next(new AppError('Não foi possível gerar o preview de limpeza de viaturas.', 500));
  }
};