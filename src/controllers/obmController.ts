import { Request, Response, NextFunction } from 'express';
import AppError from '../utils/AppError';
import ObmRepository from '../repositories/ObmRepository';
import ObmService from '../services/ObmService';

const repo = new ObmRepository();
const service = new ObmService(repo);

const getAllSimple = async (_req: Request, res: Response) => {
  const data = await service.listSimple();
  return res.status(200).json({ data });
};

const getAll = async (req: Request, res: Response) => {
  const { q, cidade, crbm } = req.query as { q?: string; cidade?: string; crbm?: string; page?: string; limit?: string };
  const page = parseInt((req.query.page as string) || '1', 10) || 1;
  const limit = parseInt((req.query.limit as string) || '15', 10) || 15;

  const result = await service.list({ q, cidade, crbm, page, limit });
  return res.status(200).json(result);
};

const search = async (req: Request, res: Response) => {
  const { term } = req.query as { term?: string };
  const options = await service.searchOptions(term);
  return res.status(200).json(options);
};

const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { nome, abreviatura, cidade, telefone, crbm } = req.body;
    const novaObm = await service.create({ nome, abreviatura, cidade, telefone, crbm });
    return res.status(201).json(novaObm);
  } catch (error) {
    return next(error);
  }
};

const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { nome, abreviatura, cidade, telefone, crbm } = req.body;
    const obmAtualizada = await service.update(Number(id), { nome, abreviatura, cidade, telefone, crbm });
    return res.status(200).json(obmAtualizada);
  } catch (error) {
    return next(error);
  }
};

const remove = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await service.delete(Number(id));
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
};

const uploadCsv = async (req: Request, res: Response) => {
  const files = (req as any).files;
  if (!files || Object.keys(files).length === 0) {
    throw new AppError('Nenhum arquivo foi enviado.', 400);
  }

  const obmFile = files.file;
  const result = await service.processCsv(obmFile.data);
  return res.status(200).json(result);
};

const clearAll = async (_req: Request, res: Response) => {
  const totalRemovidos = await service.clearAll();
  return res.status(200).json({
    message:
      totalRemovidos > 0
        ? `Todas as OBMs foram removidas (${totalRemovidos} registros excluidos).`
        : 'Nenhuma OBM encontrada para exclusao.',
  });
};

export = {
  getAllSimple,
  getAll,
  search,
  create,
  update,
  delete: remove,
  uploadCsv,
  clearAll,
};
