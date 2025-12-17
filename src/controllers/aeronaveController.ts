import { Request, Response, NextFunction } from 'express';
import db from '../config/database';
import AppError from '../utils/AppError';

type AeronavePayload = {
  prefixo?: string;
  tipo_asa?: string;
  ativa?: boolean;
  updated_at?: any;
};

const buildUpdatePayload = ({ prefixo, tipo_asa, ativa }: AeronavePayload) => {
  const payload: AeronavePayload = {};
  if (typeof prefixo !== 'undefined') payload.prefixo = prefixo;
  if (typeof tipo_asa !== 'undefined') payload.tipo_asa = tipo_asa;
  if (typeof ativa !== 'undefined') payload.ativa = ativa;
  if (Object.keys(payload).length > 0) {
    payload.updated_at = db.fn.now() as any;
  }
  return payload;
};

const getAeronaves = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { term } = req.query as { term?: string };

    const query = db('aeronaves').select('id', 'prefixo', 'tipo_asa', 'ativa').orderBy('prefixo', 'asc');

    if (term) {
      query.where('prefixo', 'ilike', `%${term}%`);
    }

    const aeronaves = await query;

    if (term) {
      return res.json(aeronaves);
    }

    return res.json({ data: aeronaves });
  } catch (error) {
    return next(error);
  }
};

const createAeronave = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { prefixo, tipo_asa, ativa: ativaInput } = req.body as {
      prefixo: string;
      tipo_asa: string;
      ativa?: boolean;
    };

    const existente = await db('aeronaves').whereRaw('LOWER(prefixo) = LOWER(?)', [prefixo]).first();

    if (existente) {
      throw new AppError('Prefixo de aeronave ja cadastrado.', 409);
    }

    const ativa = typeof ativaInput === 'boolean' ? ativaInput : true;

    const [aeronave] = await db('aeronaves')
      .insert({ prefixo, tipo_asa, ativa })
      .returning('*');

    return res.status(201).json(aeronave);
  } catch (error) {
    return next(error);
  }
};

const updateAeronave = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { prefixo } = req.body as { prefixo?: string };
    const payload = buildUpdatePayload(req.body);

    const aeronaveAtual = await db('aeronaves').where({ id }).first();
    if (!aeronaveAtual) {
      throw new AppError('Aeronave nao encontrada.', 404);
    }

    if (prefixo && prefixo !== aeronaveAtual.prefixo) {
      const conflito = await db('aeronaves')
        .whereRaw('LOWER(prefixo) = LOWER(?)', [prefixo])
        .andWhereNot('id', id)
        .first();

      if (conflito) {
        throw new AppError('Outro registro ja utiliza este prefixo.', 409);
      }
    }

    if (Object.keys(payload).length === 0) {
      return res.json(aeronaveAtual);
    }

    const [aeronaveAtualizada] = await db('aeronaves').where({ id }).update(payload).returning('*');

    return res.json(aeronaveAtualizada);
  } catch (error) {
    return next(error);
  }
};

const deleteAeronave = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const apagado = await db('aeronaves').where({ id }).delete();

    if (!apagado) {
      throw new AppError('Aeronave nao encontrada.', 404);
    }

    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
};

export = {
  getAeronaves,
  createAeronave,
  updateAeronave,
  deleteAeronave,
  getAll: getAeronaves,
  create: createAeronave,
  update: updateAeronave,
  delete: deleteAeronave,
};
