import { Request, Response } from 'express';
import PlantaoService from '../services/PlantaoService';
import AppError from '../utils/AppError';

const service = new PlantaoService();

const plantaoController = {
  create: async (req: Request, res: Response) => {
    const { data_plantao, viatura_id, obm_id, observacoes, guarnicao, hora_inicio, hora_fim } = req.body as any;
    const novoPlantao = await service.create({
      data_plantao,
      viatura_id,
      obm_id,
      observacoes,
      guarnicao,
      hora_inicio,
      hora_fim,
    });
    return res.status(201).json(novoPlantao);
  },

  getAll: async (req: Request, res: Response) => {
    const result = await service.list(req.query);
    return res.status(200).json(result);
  },

  getById: async (req: Request, res: Response) => {
    const { id } = req.params;
    const plantao = await service.getById(Number(id));
    return res.status(200).json(plantao);
  },

  update: async (req: Request, res: Response) => {
    const { id } = req.params;
    const { data_plantao, viatura_id, obm_id, observacoes, guarnicao, hora_inicio, hora_fim } = req.body as any;
    const atualizado = await service.update(Number(id), {
      data_plantao,
      viatura_id,
      obm_id,
      observacoes,
      guarnicao,
      hora_inicio,
      hora_fim,
    });
    return res.status(200).json(atualizado);
  },

  delete: async (req: Request, res: Response) => {
    const { id } = req.params;
    await service.delete(Number(id));
    return res.status(204).send();
  },

  addViatura: async (req: Request, res: Response) => {
    const { id } = req.params;
    const { viatura_id } = req.body as any;
    await service.addViatura(Number(id), Number(viatura_id));
    return res.status(200).json({ message: 'Viatura adicionada ao plantao.' });
  },

  removeViatura: async (req: Request, res: Response) => {
    const { plantaoId, viaturaId } = req.params as any;
    await service.removeViatura(Number(plantaoId), Number(viaturaId));
    return res.status(200).json({ message: 'Viatura removida do plantao.' });
  },

  addMilitar: async (req: Request, res: Response) => {
    const { id } = req.params;
    const { militar_id, funcao } = req.body as any;
    await service.addMilitar(Number(id), Number(militar_id), funcao);
    return res.status(200).json({ message: 'Militar adicionado ao plantao.' });
  },

  removeMilitar: async (req: Request, res: Response) => {
    const { plantaoId, militarId } = req.params as any;
    await service.removeMilitar(Number(plantaoId), Number(militarId));
    return res.status(200).json({ message: 'Militar removido do plantao.' });
  },

  getTotalMilitaresPlantao: async (_req: Request, res: Response) => {
    const total = await service.getTotalMilitaresPlantao();
    return res.status(200).json({ total });
  },
};

export = plantaoController;
