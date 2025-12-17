import { Request, Response } from 'express';
import db from '../config/database';
import AppError from '../utils/AppError';

const isTruthy = (value: unknown) => {
  if (typeof value !== 'string') return false;
  const normalized = value.trim().toLowerCase();
  return ['true', '1', 'yes', 'on', 'escalado'].includes(normalized);
};

const toInt = (value: unknown, fallback: number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const militarController = {
  /**
   * Lista militares com filtros e paginação.
   */
  getAll: async (req: Request, res: Response) => {
    const { q, ativo, posto_graduacao, obm_nome, escalado } = req.query as {
      q?: string;
      ativo?: string;
      posto_graduacao?: string;
      obm_nome?: string;
      escalado?: string;
      page?: string;
      limit?: string;
    };

    const query = db('militares').select(
      'id',
      'matricula',
      'nome_completo',
      'nome_guerra',
      'posto_graduacao',
      'ativo',
      'obm_nome',
      'telefone'
    );

    if (q) {
      query.where(function () {
        this.where(db.raw('??::text', ['nome_completo']), 'ilike', `${q}%`)
          .orWhere(db.raw('??::text', ['nome_completo']), 'ilike', `% ${q}%`)
          .orWhere(db.raw('??::text', ['nome_guerra']), 'ilike', `${q}%`)
          .orWhere(db.raw('??::text', ['nome_guerra']), 'ilike', `% ${q}%`)
          .orWhere(db.raw('??::text', ['matricula']), 'ilike', `${q}%`)
          .orWhere(db.raw('??::text', ['posto_graduacao']), 'ilike', `${q}%`)
          .orWhere(db.raw('??::text', ['posto_graduacao']), 'ilike', `% ${q}%`)
          .orWhere(db.raw('??::text', ['obm_nome']), 'ilike', `${q}%`)
          .orWhere(db.raw('??::text', ['obm_nome']), 'ilike', `% ${q}%`);
      });
    }

    if (posto_graduacao) {
      query.where('posto_graduacao', '=', posto_graduacao);
    }

    if (obm_nome) {
      query.where('obm_nome', '=', obm_nome);
    }

    if (ativo) {
      query.where('ativo', '=', ativo);
    }

    const escaladoFlag = isTruthy(escalado);
    if (escaladoFlag) {
      const [hasPm, hasMp] = await Promise.all([
        db.schema.hasTable('plantoes_militares').catch(() => false),
        db.schema.hasTable('militar_plantao').catch(() => false),
      ]);
      const pmTable = hasPm ? 'plantoes_militares' : hasMp ? 'militar_plantao' : null;

      if (pmTable) {
        const [hasDP, hasDI, hasDF] = await Promise.all([
          db.schema.hasColumn('plantoes', 'data_plantao').catch(() => false),
          db.schema.hasColumn('plantoes', 'data_inicio').catch(() => false),
          db.schema.hasColumn('plantoes', 'data_fim').catch(() => false),
        ]);
        const cols: string[] = [];
        if (hasDP) cols.push('p.data_plantao');
        if (hasDI) cols.push('p.data_inicio');
        if (hasDF) cols.push('p.data_fim');
        const dateExpr = cols.length > 1 ? `COALESCE(${cols.join(', ')})` : cols[0] || null;

        let sub = db(`${pmTable} as pm`).join('plantoes as p', 'pm.plantao_id', 'p.id');
        if (dateExpr) sub = sub.whereRaw(`${dateExpr} >= CURRENT_DATE`);
        query.whereIn('id', sub.select('pm.militar_id'));
      } else {
        query.whereRaw('1=0');
      }
    }

    const page = toInt(req.query.page, 1);
    const limit = toInt(req.query.limit, 50);
    const offset = (page - 1) * limit;

    const countQuery = query.clone().clearSelect().clearOrder().count({ count: 'id' }).first();
    const dataQuery = query.clone().orderBy('nome_completo', 'asc').limit(limit).offset(offset);

    const [data, totalResult] = await Promise.all([dataQuery, countQuery]);
    const totalRecords = parseInt((totalResult as any)?.count ?? 0, 10);
    const totalPages = Math.ceil(totalRecords / limit) || 1;

    return res.status(200).json({
      data,
      pagination: { currentPage: page, perPage: limit, totalPages, totalRecords },
    });
  },

  /**
   * Busca para selects assíncronos.
   */
  search: async (req: Request, res: Response) => {
    const { term } = req.query as { term?: string };

    if (!term || term.length < 2) {
      return res.status(200).json([]);
    }

    try {
      const militares = await db('militares')
        .where('nome_completo', 'ilike', `%${term}%`)
        .orWhere('nome_guerra', 'ilike', `%${term}%`)
        .orWhere('matricula', 'ilike', `%${term}%`)
        .andWhere('ativo', true)
        .select('id', 'matricula', 'nome_completo', 'posto_graduacao', 'nome_guerra', 'telefone')
        .limit(15);

      const options = militares.map((m) => {
        const nomeExibicao =
          m.nome_guerra && m.nome_guerra.trim().length > 0 ? m.nome_guerra.trim() : m.nome_completo?.trim() || '';

        return {
          value: m.id,
          label: nomeExibicao,
          militar: { ...m, nome_exibicao: nomeExibicao },
        };
      });

      return res.status(200).json(options);
    } catch (error) {
      console.error('Erro ao buscar militares:', error);
      throw new AppError('Nao foi possivel realizar a busca por militares.', 500);
    }
  },

  getByMatricula: async (req: Request, res: Response) => {
    const { matricula } = req.params;
    if (!matricula) {
      throw new AppError('Matricula nao fornecida.', 400);
    }
    const militar = await db('militares')
      .select('id', 'nome_completo', 'posto_graduacao', 'telefone')
      .where({ matricula, ativo: true })
      .first();

    if (!militar) {
      throw new AppError('Militar nao encontrado ou inativo para esta matricula.', 404);
    }
    return res.status(200).json(militar);
  },

  create: async (req: Request, res: Response) => {
    const { matricula, nome_completo, nome_guerra, posto_graduacao, ativo, obm_nome, telefone } = req.body;
    const matriculaExists = await db('militares').where({ matricula }).first();
    if (matriculaExists) {
      throw new AppError('Matricula ja cadastrada no sistema.', 409);
    }
    const [novoMilitar] = await db('militares')
      .insert({ matricula, nome_completo, nome_guerra, posto_graduacao, ativo, obm_nome, telefone })
      .returning('*');
    return res.status(201).json(novoMilitar);
  },

  update: async (req: Request, res: Response) => {
    const { id } = req.params;
    const { matricula, nome_completo, nome_guerra, posto_graduacao, ativo, obm_nome, telefone } = req.body;

    const militarParaAtualizar = await db('militares').where({ id }).first();
    if (!militarParaAtualizar) {
      throw new AppError('Militar nao encontrado.', 404);
    }
    if (matricula && matricula !== militarParaAtualizar.matricula) {
      const matriculaConflict = await db('militares')
        .where('matricula', matricula)
        .andWhere('id', '!=', id)
        .first();
      if (matriculaConflict) {
        throw new AppError('A nova matricula ja esta em uso por outro militar.', 409);
      }
    }
    const dadosAtualizacao = {
      matricula,
      nome_completo,
      nome_guerra,
      posto_graduacao,
      ativo,
      obm_nome,
      telefone,
      updated_at: db.fn.now(),
    };
    const [militarAtualizado] = await db('militares').where({ id }).update(dadosAtualizacao).returning('*');
    return res.status(200).json(militarAtualizado);
  },

  toggleActive: async (req: Request, res: Response) => {
    const { id } = req.params;

    const militar = await db('militares').where({ id }).first();
    if (!militar) {
      throw new AppError('Militar nao encontrado.', 404);
    }

    const novoStatus = !militar.ativo;
    const [militarAtualizado] = await db('militares')
      .where({ id })
      .update({ ativo: novoStatus, updated_at: db.fn.now() })
      .returning('*');

    return res.status(200).json({
      message: novoStatus ? 'Militar ativado com sucesso.' : 'Militar desativado com sucesso.',
      militar: militarAtualizado,
    });
  },

  delete: async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await db('militares').where({ id }).del();
    if (result === 0) {
      throw new AppError('Militar nao encontrado.', 404);
    }
    return res.status(204).send();
  },
};

export = militarController;
