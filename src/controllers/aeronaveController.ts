import { Request, Response, NextFunction } from 'express';
import AeronaveRepository from '../repositories/AeronaveRepository';
import AeronaveService from '../services/AeronaveService';

const repo = new AeronaveRepository();
const service = new AeronaveService(repo);

const getAeronaves = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { term } = req.query as { term?: string };
    const aeronaves = await service.list(term);
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
    const aeronave = await service.create(req.body);
    return res.status(201).json(aeronave);
  } catch (error) {
    return next(error);
  }
};

const updateAeronave = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const aeronaveAtualizada = await service.update(Number(id), req.body);
    return res.json(aeronaveAtualizada);
  } catch (error) {
    return next(error);
  }
};

const deleteAeronave = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await service.delete(Number(id));
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
