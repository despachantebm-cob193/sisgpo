import { Request, Response } from 'express';
import AppError from '../utils/AppError';
import MilitarRepository from '../repositories/MilitarRepository';
import MilitarService from '../services/MilitarService';
import { CreateMilitarDTO, UpdateMilitarDTO } from '../validators/militarValidator';

const repo = new MilitarRepository();
const service = new MilitarService(repo);

const militarController = {
  getAll: async (req: Request, res: Response) => {
    console.log('[MilitarController] getAll called with Query:', req.query);
    const result = await service.list(req.query);
    return res.status(200).json(result);
  },

  search: async (req: Request, res: Response) => {
    const { term } = req.query as { term?: string };
    try {
      const options = await service.searchOptions(term);
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
    const militar = await service.getActiveByMatricula(matricula);
    return res.status(200).json(militar);
  },

  create: async (req: Request, res: Response) => {
    const payload = req.body as CreateMilitarDTO;
    const novoMilitar = await service.create(payload);
    return res.status(201).json(novoMilitar);
  },

  update: async (req: Request, res: Response) => {
    const { id } = req.params;
    const payload = req.body as UpdateMilitarDTO;
    const militarAtualizado = await service.update(Number(id), payload);
    return res.status(200).json(militarAtualizado);
  },

  toggleActive: async (req: Request, res: Response) => {
    const { id } = req.params;
    const militarAtualizado = await service.toggleActive(Number(id));

    return res.status(200).json({
      message: militarAtualizado.ativo ? 'Militar ativado com sucesso.' : 'Militar desativado com sucesso.',
      militar: militarAtualizado,
    });
  },

  delete: async (req: Request, res: Response) => {
    const { id } = req.params;
    await service.delete(Number(id));
    return res.status(204).send();
  },
};

export = militarController;
