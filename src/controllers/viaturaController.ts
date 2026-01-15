import { Request, Response, NextFunction } from 'express';
import AppError from '../utils/AppError';
import ViaturaService from '../services/ViaturaService';
import { CreateViaturaDTO, UpdateViaturaDTO } from '../validators/viaturaValidator';

const service = new ViaturaService();

const parseBoolean = (value: unknown, defaultValue = false) => {
  if (value === undefined || value === null) return defaultValue;
  if (typeof value === 'boolean') return value;
  return ['true', '1', 'yes', 'on'].includes(String(value).trim().toLowerCase());
};

const viaturaController = {
  getAll: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await service.list(req.query);
      return res.status(200).json(result);
    } catch (error) {
      return next(error);
    }
  },

  getAllSimple: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const obm = typeof req.query.obm === 'string' ? req.query.obm : undefined;
      const includeAereo = parseBoolean(req.query.includeAereo, true);
      const data = await service.getAllSimple({ obm, includeAereo });
      return res.status(200).json({ data });
    } catch (error) {
      console.error('[viaturaController.getAllSimple] Erro ao buscar prefixos:', error);
      return next(new AppError('Nao foi possivel carregar os prefixos de viatura.', 500));
    }
  },

  search: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const q = typeof req.query.q === 'string' ? req.query.q : undefined;
      const ativa = parseBoolean(req.query.ativa, true);
      const data = await service.search(q, ativa);
      return res.status(200).json({ data });
    } catch (error) {
      return next(error);
    }
  },

  create: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const payload = req.body as CreateViaturaDTO & { tipo?: string | null };
      const novaViatura = await service.create(payload);
      return res.status(201).json(novaViatura);
    } catch (error) {
      return next(error);
    }
  },

  update: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const payload = req.body as UpdateViaturaDTO & { tipo?: string | null };
      const viaturaAtualizada = await service.update(Number(id), payload);
      return res.status(200).json(viaturaAtualizada);
    } catch (error) {
      return next(error);
    }
  },

  delete: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      await service.delete(Number(id));
      return res.status(204).send();
    } catch (error) {
      return next(error);
    }
  },

  toggleActive: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const result = await service.toggleActive(Number(id));
      return res.status(200).json(result);
    } catch (error) {
      return next(error);
    }
  },

  getDistinctObms: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await service.getDistinctObms();
      return res.status(200).json({ data });
    } catch (error) {
      return next(error);
    }
  },

  countByObm: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const obm = typeof req.query.obm === 'string' ? req.query.obm.trim() : '';
      const excludeId = req.query.exclude_id as string | undefined;
      if (!obm) {
        return res.status(200).json({ count: 0 });
      }
      const count = await service.countByObm(obm, excludeId);
      return res.status(200).json({ count });
    } catch (error) {
      return next(error);
    }
  },

  previewClearAll: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const summary = await service.previewClearAll();
      return res.status(200).json(summary);
    } catch (error) {
      return next(error);
    }
  },

  clearAll: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const confirm = req.query.confirm as string | undefined;
      const confirmHeader = req.headers['x-confirm-purge'];
      const result = await service.clearAll(confirm, confirmHeader);
      return res.status(200).json(result);
    } catch (error) {
      console.error('Erro ao limpar viaturas:', error);
      return next(error instanceof AppError ? error : new AppError('Nao foi possivel limpar a tabela de viaturas.', 500));
    }
  },

  handleExternalStatusChange: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { status, ocorrenciaId } = req.body;

      if (!status || typeof status !== 'string') {
        throw new AppError('Campo "status" é obrigatório e deve ser string', 400);
      }

      const result = await service.updateStatusExternal(
        Number(id),
        status,
        ocorrenciaId
      );

      return res.status(200).json(result);
    } catch (error) {
      console.error('[viaturaController.handleExternalStatusChange] Erro:', error);
      return next(error);
    }
  },
};

export = viaturaController;
