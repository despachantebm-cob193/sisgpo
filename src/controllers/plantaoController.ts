import { Request, Response } from 'express';
import db from '../config/database';
import AppError from '../utils/AppError';

// Helpers to handle schema variations across deployments
async function resolvePlantaoVinculoMeta(knex: any) {
  const hasPm = await knex.schema.hasTable('plantoes_militares').catch(() => false);
  const hasMp = await knex.schema.hasTable('militar_plantao').catch(() => false);
  const table = hasPm ? 'plantoes_militares' : hasMp ? 'militar_plantao' : null;
  let hasFuncao = false;
  if (table) {
    hasFuncao = await knex.schema.hasColumn(table, 'funcao').catch(() => false);
  }
  return { table, hasFuncao };
}

async function resolvePlantoesDateExpr(knex: any, alias = 'p.') {
  const [hasDP, hasDI, hasDF] = await Promise.all([
    knex.schema.hasColumn('plantoes', 'data_plantao').catch(() => false),
    knex.schema.hasColumn('plantoes', 'data_inicio').catch(() => false),
    knex.schema.hasColumn('plantoes', 'data_fim').catch(() => false),
  ]);
  const cols: string[] = [];
  if (hasDP) cols.push(`${alias}data_plantao`);
  if (hasDI) cols.push(`${alias}data_inicio`);
  if (hasDF) cols.push(`${alias}data_fim`);
  if (cols.length === 0) return null;
  if (cols.length === 1) return cols[0];
  return `COALESCE(${cols.join(', ')})`;
}

const parsePositiveInt = (value: any) => {
  const numericValue = Number(value);
  return Number.isInteger(numericValue) && numericValue > 0 ? numericValue : null;
};

const sanitizeStringToken = (token?: string | null) => {
  if (!token) return null;
  return token
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toUpperCase();
};

const buildPlantaoNome = (prefixo: string, dataPlantao: string, viaturaId: number | string) => {
  const fallback = `VTR-${viaturaId}`;
  const token = sanitizeStringToken(prefixo) || sanitizeStringToken(fallback) || `PLANTAO-${viaturaId}`;
  return `PLANTAO-${token}-${dataPlantao}`;
};

const normalizeHorarioInput = (value: any) => {
  if (value === undefined || value === null) {
    return null;
  }
  const trimmed = String(value).trim();
  return trimmed.length ? trimmed : null;
};

const resolveViaturaContext = async (trx: any, viaturaId: number, providedObmId?: number | null) => {
  const viaturaData = await trx('viaturas as v')
    .leftJoin('obms as o', 'v.obm', 'o.nome')
    .select('v.prefixo', 'v.obm', 'o.id as obm_id')
    .where('v.id', viaturaId)
    .first();

  if (!viaturaData) {
    throw new AppError('Viatura nao encontrada.', 404);
  }

  let resolvedObmId = parsePositiveInt(providedObmId) || viaturaData.obm_id;

  if (!resolvedObmId && viaturaData.obm) {
    const obmMatch = await trx('obms').whereRaw('LOWER(nome) = LOWER(?)', [viaturaData.obm]).first();
    if (obmMatch) {
      resolvedObmId = obmMatch.id;
    }
  }

  if (!resolvedObmId) {
    throw new AppError(
      'Nao foi possivel identificar a OBM vinculada a viatura selecionada. Atualize o cadastro da viatura e tente novamente.',
      400
    );
  }

  return {
    obmId: resolvedObmId,
    prefixo: viaturaData.prefixo,
  };
};

const plantaoController = {
  create: async (req: Request, res: Response) => {
    const { data_plantao, viatura_id, obm_id, observacoes, guarnicao, hora_inicio, hora_fim } = req.body as any;

    await db.transaction(async (trx: any) => {
      const plantaoExists = await trx('plantoes').where({ data_plantao, viatura_id }).first();
      if (plantaoExists) {
        throw new AppError('Ja existe um plantao cadastrado para esta viatura nesta data.', 409);
      }

      const { obmId, prefixo } = await resolveViaturaContext(trx, viatura_id, obm_id);
      const plantaoNome = buildPlantaoNome(prefixo, data_plantao, viatura_id);
      const horaInicioNormalized = normalizeHorarioInput(hora_inicio);
      const horaFimNormalized = normalizeHorarioInput(hora_fim);

      const [novoPlantao] = await trx('plantoes')
        .insert({
          nome: plantaoNome,
          tipo: 'VIATURA',
          data_inicio: data_plantao,
          data_fim: data_plantao,
          data_plantao,
          viatura_id,
          obm_id: obmId,
          ativo: true,
          observacoes: observacoes || null,
          hora_inicio: horaInicioNormalized,
          hora_fim: horaFimNormalized,
        })
        .returning('*');

      if (Array.isArray(guarnicao) && guarnicao.length > 0) {
        const { table, hasFuncao } = await resolvePlantaoVinculoMeta(trx);
        if (table) {
          const payload = guarnicao
            .filter((m: any) => m.militar_id)
            .map((m: any) => ({
              plantao_id: novoPlantao.id,
              militar_id: m.militar_id,
              funcao: hasFuncao ? m.funcao || null : undefined,
            }))
            .map((p: any) => {
              if (!hasFuncao) {
                delete p.funcao;
              }
              return p;
            });
          if (payload.length > 0) {
            await trx(table).insert(payload);
          }
        }
      }
    });

    return res.status(201).json({ message: 'Plantao criado com sucesso.' });
  },

  getAll: async (req: Request, res: Response) => {
    const page = parseInt((req.query.page as string) || '1', 10) || 1;
    const limit = parseInt((req.query.limit as string) || '10', 10) || 10;
    const offset = (page - 1) * limit;

    const { data_inicio, data_fim, obm_id, viatura_prefixo } = req.query as any;
    const dateExpr = await resolvePlantoesDateExpr(db);

    let query = db('plantoes as p')
      .leftJoin('viaturas as v', 'p.viatura_id', 'v.id')
      .leftJoin('obms as o', 'p.obm_id', 'o.id')
      .select(
        'p.*',
        'v.prefixo as viatura_prefixo',
        'o.abreviatura as obm_abreviatura',
        'o.nome as obm_nome',
        'o.id as obm_id'
      )
      .orderBy('p.data_plantao', 'desc')
      .orderBy('p.id', 'desc');

    if (dateExpr) {
      if (data_inicio) {
        query = query.whereRaw(`${dateExpr} >= ?`, [data_inicio]);
      }
      if (data_fim) {
        query = query.whereRaw(`${dateExpr} <= ?`, [data_fim]);
      }
    }

    if (obm_id) {
      query = query.where('p.obm_id', obm_id);
    }
    if (viatura_prefixo) {
      query = query.whereRaw('LOWER(v.prefixo) = LOWER(?)', [viatura_prefixo]);
    }

    const countQuery = query.clone().clearSelect().clearOrder().count({ count: 'p.id' }).first();
    const dataQuery = query.clone().limit(limit).offset(offset);

    const [data, totalResult] = await Promise.all([dataQuery, countQuery]);
    const totalRecords = parseInt(((totalResult as any)?.count ?? 0) as any, 10);
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
  },

  getById: async (req: Request, res: Response) => {
    const { id } = req.params;
    const plantao = await db('plantoes as p')
      .leftJoin('viaturas as v', 'p.viatura_id', 'v.id')
      .leftJoin('obms as o', 'p.obm_id', 'o.id')
      .select('p.*', 'v.prefixo as viatura_prefixo', 'o.abreviatura as obm_abreviatura', 'o.nome as obm_nome')
      .where('p.id', id)
      .first();

    if (!plantao) {
      throw new AppError('Plantao nao encontrado.', 404);
    }

    const { table, hasFuncao } = await resolvePlantaoVinculoMeta(db);
    if (table) {
      const guarnicao = await db(`${table} as pm`)
        .join('militares as m', 'pm.militar_id', 'm.id')
        .where('pm.plantao_id', id)
        .select('pm.id', 'pm.militar_id', 'pm.funcao', 'm.nome_guerra', 'm.posto_graduacao');
      if (!hasFuncao) {
        guarnicao.forEach((g: any) => delete g.funcao);
      }
      (plantao as any).guarnicao = guarnicao;
    }

    return res.status(200).json(plantao);
  },

  update: async (req: Request, res: Response) => {
    const { id } = req.params;
    const { data_plantao, viatura_id, obm_id, observacoes, guarnicao, hora_inicio, hora_fim } = req.body as any;

    await db.transaction(async (trx: any) => {
      const plantao = await trx('plantoes').where({ id }).first();
      if (!plantao) {
        throw new AppError('Plantao nao encontrado.', 404);
      }

      const payload: any = {
        observacoes,
        hora_inicio: normalizeHorarioInput(hora_inicio),
        hora_fim: normalizeHorarioInput(hora_fim),
        updated_at: trx.fn.now(),
      };

      if (data_plantao) payload.data_plantao = data_plantao;
      if (viatura_id) payload.viatura_id = viatura_id;
      if (obm_id) payload.obm_id = obm_id;

      if (viatura_id) {
        const { obmId, prefixo } = await resolveViaturaContext(trx, viatura_id, obm_id);
        payload.obm_id = obmId;
        payload.nome = buildPlantaoNome(prefixo, data_plantao || plantao.data_plantao, viatura_id);
      }

      await trx('plantoes').where({ id }).update(payload);

      if (Array.isArray(guarnicao)) {
        const { table, hasFuncao } = await resolvePlantaoVinculoMeta(trx);
        if (table) {
          await trx(table).where({ plantao_id: id }).del();
          const payloadGuarnicao = guarnicao
            .filter((m: any) => m.militar_id)
            .map((m: any) => ({
              plantao_id: id,
              militar_id: m.militar_id,
              funcao: hasFuncao ? m.funcao || null : undefined,
            }))
            .map((p: any) => {
              if (!hasFuncao) delete p.funcao;
              return p;
            });
          if (payloadGuarnicao.length > 0) {
            await trx(table).insert(payloadGuarnicao);
          }
        }
      }
    });

    return res.status(200).json({ message: 'Plantao atualizado com sucesso.' });
  },

  delete: async (req: Request, res: Response) => {
    const { id } = req.params;
    const deletado = await db('plantoes').where({ id }).del();
    if (deletado === 0) {
      throw new AppError('Plantao nao encontrado.', 404);
    }
    return res.status(204).send();
  },

  addViatura: async (req: Request, res: Response) => {
    const { id } = req.params;
    const { viatura_id } = req.body as any;

    const plantao = await db('plantoes').where({ id }).first();
    if (!plantao) {
      throw new AppError('Plantao nao encontrado.', 404);
    }

    const viatura = await db('viaturas').where({ id: viatura_id }).first();
    if (!viatura) {
      throw new AppError('Viatura nao encontrada.', 404);
    }

    await db('viatura_plantao')
      .insert({ plantao_id: id, viatura_id, prefixo_viatura: viatura.prefixo })
      .onConflict(['plantao_id', 'viatura_id'])
      .ignore();

    return res.status(200).json({ message: 'Viatura adicionada ao plantao.' });
  },

  removeViatura: async (req: Request, res: Response) => {
    const { plantaoId, viaturaId } = req.params as any;
    await db('viatura_plantao').where({ plantao_id: plantaoId, viatura_id: viaturaId }).del();
    return res.status(200).json({ message: 'Viatura removida do plantao.' });
  },

  addMilitar: async (req: Request, res: Response) => {
    const { id } = req.params;
    const { militar_id, funcao } = req.body as any;

    const { table, hasFuncao } = await resolvePlantaoVinculoMeta(db);
    if (!table) {
      throw new AppError('Tabela de vinculo de militares nao encontrada.', 500);
    }

    await db(table)
      .insert({
        plantao_id: id,
        militar_id,
        funcao: hasFuncao ? funcao || null : undefined,
      })
      .onConflict(['plantao_id', 'militar_id'])
      .ignore();

    return res.status(200).json({ message: 'Militar adicionado ao plantao.' });
  },

  removeMilitar: async (req: Request, res: Response) => {
    const { plantaoId, militarId } = req.params as any;
    const { table } = await resolvePlantaoVinculoMeta(db);
    if (!table) {
      throw new AppError('Tabela de vinculo de militares nao encontrada.', 500);
    }
    await db(table).where({ plantao_id: plantaoId, militar_id: militarId }).del();
    return res.status(200).json({ message: 'Militar removido do plantao.' });
  },

  getTotalMilitaresPlantao: async (_req: Request, res: Response) => {
    try {
      const { table } = await resolvePlantaoVinculoMeta(db);
      if (!table) {
        return res.status(200).json({ total: 0 });
      }
      const total = await db(table).countDistinct({ total: 'militar_id' }).first();
      return res.status(200).json({ total: Number((total as any)?.total ?? 0) });
    } catch (error) {
      console.error('Erro ao calcular total de militares em plantoes:', error);
      throw new AppError('Nao foi possivel calcular o total de militares.', 500);
    }
  },
};

export = plantaoController;
