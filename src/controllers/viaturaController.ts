import { Request, Response, NextFunction } from 'express';
import db from '../config/database';
import AppError from '../utils/AppError';
import { normalizeText } from '../utils/textUtils';

type ViaturaRow = {
  id: number;
  prefixo: string;
  ativa: boolean;
  cidade?: string | null;
  obm?: string | null;
  telefone?: string | null;
  obm_id?: number | null;
  obm_abreviatura?: string | null;
};

const parseBoolean = (value: unknown, defaultValue = false): boolean => {
  if (value === undefined || value === null) {
    return defaultValue;
  }
  if (typeof value === 'boolean') return value;
  return ['true', '1', 'yes', 'on'].includes(String(value).trim().toLowerCase());
};

const parsePositiveNumber = (value: unknown, defaultValue: number): number => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return defaultValue;
  }
  return parsed;
};

const buildObmAbbreviationMap = (obms: Array<{ id: number; nome?: string; abreviatura?: string }>) => {
  const map = new Map<string, { id: number; abreviatura?: string }>();

  obms.forEach((obm) => {
    const keys = new Set<string>();
    const nome = obm.nome || '';
    const abreviatura = obm.abreviatura || '';

    const pushKey = (rawValue: string) => {
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

const hydrateObmFallback = async (viaturas: ViaturaRow[]) => {
  const needsFallback = viaturas.some((viatura) => !viatura.obm_abreviatura && viatura.obm);
  if (!needsFallback) {
    return viaturas;
  }

  const obms = await db('obms').select('id', 'nome', 'abreviatura');
  const obmMap = buildObmAbbreviationMap(obms);

  viaturas.forEach((viatura) => {
    if (!viatura.obm || viatura.obm_abreviatura) return;

    const candidates: string[] = [];
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
        const match = obmMap.get(key)!;
        viatura.obm_id = match.id;
        viatura.obm_abreviatura = match.abreviatura || null;
        break;
      }
    }
  });

  return viaturas;
};

const viaturaController = {
  getAll: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = parsePositiveNumber(req.query.page, 1);
      const limit = parsePositiveNumber(req.query.limit, 15);
      const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
      const obm = typeof req.query.obm === 'string' ? req.query.obm.trim() : '';
      const cidade = typeof req.query.cidade === 'string' ? req.query.cidade.trim() : '';

      const baseQuery = db('viaturas as v')
        .leftJoin('obms as o', db.raw('LOWER(v.obm) = LOWER(o.nome)'))
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

      if (q) {
        baseQuery.where(function () {
          this.whereRaw('v.prefixo::text ilike ?', [`%${q}%`])
            .orWhereRaw('v.cidade::text ilike ?', [`%${q}%`])
            .orWhereRaw('v.obm::text ilike ?', [`%${q}%`])
            .orWhereRaw('o.abreviatura::text ilike ?', [`%${q}%`]);
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

      const [dataRaw, totalResult] = await Promise.all([dataQuery, countQuery]);
      const data = await hydrateObmFallback(dataRaw as ViaturaRow[]);

      const totalRecords = Number((totalResult as any)?.count ?? 0);
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
  },

  getAllSimple: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const targetObmRaw =
        typeof req.query.obm === 'string' && req.query.obm.trim().length > 0 ? req.query.obm.trim() : 'COA';
      const targetLower = targetObmRaw.toLowerCase();
      const includeAereo = parseBoolean(req.query.includeAereo, true);

      const viaturasRaw = await db('viaturas as v')
        .leftJoin('obms as o', db.raw('LOWER(v.obm) = LOWER(o.nome)'))
        .select('v.id', 'v.prefixo', 'v.obm', 'o.abreviatura as obm_abreviatura')
        .where('v.ativa', true)
        .orderBy('v.prefixo', 'asc');
      const viaturas = await hydrateObmFallback(viaturasRaw as ViaturaRow[]);

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
      return next(new AppError('Nao foi possivel carregar os prefixos de viatura.', 500));
    }
  },

  countByObm: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const obm = typeof req.query.obm === 'string' ? req.query.obm.trim() : '';
      const excludeId = req.query.exclude_id as string | undefined;

      if (!obm) {
        return res.status(200).json({ count: 0 });
      }

      const query = db('viaturas').where('obm', obm);
      if (excludeId) {
        query.andWhere('id', '!=', excludeId);
      }

      const result = await query.count({ count: '*' }).first();
      const count = Number((result as any)?.count ?? 0);
      return res.status(200).json({ count });
    } catch (error) {
      return next(error);
    }
  },

  search: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
      const ativa = parseBoolean(req.query.ativa, true);

      const query = db('viaturas')
        .select('id', 'prefixo', 'tipo', 'cidade', 'obm', 'telefone', 'ativa')
        .orderBy('prefixo', 'asc');

      if (q) {
        query.where(function () {
          this.whereRaw('prefixo ilike ?', [`%${q}%`])
            .orWhereRaw('tipo ilike ?', [`%${q}%`])
            .orWhereRaw('cidade ilike ?', [`%${q}%`])
            .orWhereRaw('obm ilike ?', [`%${q}%`]);
        });
      }

      if (ativa) {
        query.andWhere('ativa', true);
      }

      const viaturas = await query;
      return res.status(200).json({ data: viaturas });
    } catch (error) {
      return next(error);
    }
  },

  create: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { prefixo, tipo, ativa = true, cidade, obm, telefone } = req.body;
      const normalizedPrefixo = (prefixo || '').trim().toUpperCase();
      if (!normalizedPrefixo) {
        throw new AppError('Prefixo e obrigatorio.', 400);
      }

      const existing = await db('viaturas').whereRaw('LOWER(prefixo) = LOWER(?)', [normalizedPrefixo]).first();
      if (existing) {
        throw new AppError('Ja existe uma viatura com esse prefixo.', 409);
      }

      const payload = {
        prefixo: normalizedPrefixo,
        tipo: tipo || null,
        ativa: Boolean(ativa),
        cidade: cidade || null,
        obm: obm || null,
        telefone: telefone || null,
      };

      const [novaViatura] = await db('viaturas').insert(payload).returning('*');
      return res.status(201).json(novaViatura);
    } catch (error) {
      return next(error);
    }
  },

  update: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { prefixo, tipo, ativa, cidade, obm, telefone } = req.body;

      const viatura = await db('viaturas').where({ id }).first();
      if (!viatura) {
        throw new AppError('Viatura nao encontrada.', 404);
      }

      if (prefixo && prefixo !== viatura.prefixo) {
        const normalizedPrefixo = prefixo.trim().toUpperCase();
        const existing = await db('viaturas')
          .whereRaw('LOWER(prefixo) = LOWER(?)', [normalizedPrefixo])
          .andWhereNot({ id })
          .first();
        if (existing) {
          throw new AppError('Ja existe uma viatura com esse prefixo.', 409);
        }
      }

      const payload = {
        prefixo: prefixo ? prefixo.trim().toUpperCase() : viatura.prefixo,
        tipo: typeof tipo !== 'undefined' ? tipo : viatura.tipo,
        ativa: typeof ativa !== 'undefined' ? Boolean(ativa) : viatura.ativa,
        cidade: typeof cidade !== 'undefined' ? cidade : viatura.cidade,
        obm: typeof obm !== 'undefined' ? obm : viatura.obm,
        telefone: typeof telefone !== 'undefined' ? telefone : viatura.telefone,
        updated_at: db.fn.now(),
      };

      const [viaturaAtualizada] = await db('viaturas').where({ id }).update(payload).returning('*');
      return res.status(200).json(viaturaAtualizada);
    } catch (error) {
      return next(error);
    }
  },

  delete: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const result = await db('viaturas').where({ id }).del();
      if (result === 0) {
        throw new AppError('Viatura nao encontrada.', 404);
      }
      return res.status(204).send();
    } catch (error) {
      return next(error);
    }
  },

  getDistinctObms: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const rows = await db('viaturas')
        .distinct('obm')
        .whereNotNull('obm')
        .andWhere('obm', '!=', '')
        .orderBy('obm', 'asc');
      const data = rows.map((r: any) => r.obm);
      return res.status(200).json({ data });
    } catch (error) {
      return next(error);
    }
  },

  previewClearAll: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const [viaturasCount, plantoesCount, vinculosCount] = await Promise.all([
        db('viaturas').count({ count: '*' }).first(),
        db('plantoes').count({ count: '*' }).first(),
        db('viatura_plantao').count({ count: '*' }).first(),
      ]);

      return res.status(200).json({
        viaturas: Number((viaturasCount as any)?.count ?? 0),
        plantoes: Number((plantoesCount as any)?.count ?? 0),
        vinculos: Number((vinculosCount as any)?.count ?? 0),
      });
    } catch (error) {
      return next(error);
    }
  },

  clearAll: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const confirm = req.query.confirm === '1';
      if (!confirm) {
        throw new AppError('Confirme a limpeza com ?confirm=1', 400);
      }

      const confirmHeader = req.headers['x-confirm-purge'];
      if (confirmHeader !== 'VIATURAS') {
        throw new AppError(
          'Precondition Required: Adicione o cabecalho "X-Confirm-Purge: VIATURAS" para confirmar a operacao.',
          412
        );
      }

      if (process.env.NODE_ENV === 'production' && process.env.ALLOW_VIATURA_PURGE !== 'true') {
        throw new AppError('Operacao nao permitida em producao sem a flag ALLOW_VIATURA_PURGE=true.', 403);
      }

      await db('plantoes').del();
      await db('viaturas').del();
      await db('metadata').where({ key: 'viaturas_last_upload' }).del();

      return res.status(200).json({ message: 'Tabela de viaturas limpa com sucesso!' });
    } catch (error) {
      console.error('Erro ao limpar viaturas:', error);
      if (error instanceof AppError) {
        return next(error);
      }
      return next(new AppError('Nao foi possivel limpar a tabela de viaturas.', 500));
    }
  },

  getAeronaves: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const aeronaves = await db('aeronaves').where('ativa', true).select('id', 'prefixo').orderBy('prefixo', 'asc');
      return res.status(200).json({ data: aeronaves });
    } catch (error) {
      return next(error);
    }
  },

  toggleActive: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const viatura = await db('viaturas').where({ id }).first();

      if (!viatura) {
        throw new AppError('Viatura nao encontrada.', 404);
      }

      const novaSituacao = !viatura.ativa;

      await db('viaturas').where({ id }).update({ ativa: novaSituacao, updated_at: db.fn.now() });

      return res.status(200).json({
        message: novaSituacao ? 'Viatura ativada com sucesso.' : 'Viatura desativada com sucesso.',
        viatura: { ...viatura, ativa: novaSituacao },
      });
    } catch (error) {
      return next(error);
    }
  },
};

export = viaturaController;
