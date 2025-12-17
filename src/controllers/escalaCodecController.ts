import { Request, Response } from 'express';
import db from '../config/database';
import AppError from '../utils/AppError';

type Turno = 'diurno' | 'noturno';

type EscalaCodecRow = {
  id: number;
  data: string;
  turno: Turno;
  militar_id: number;
  ordem_plantonista: number;
  nome_plantonista: string;
};

type PlantonistaInput = {
  militar_id?: number;
  ordem_plantonista?: number;
};

const buildBaseQuery = () =>
  db('escala_codec as ec')
    .join('militares as m', 'ec.militar_id', 'm.id')
    .select(
      'ec.id',
      'ec.data',
      'ec.turno',
      'ec.militar_id',
      'ec.ordem_plantonista',
      db.raw("m.posto_graduacao || ' ' || m.nome_guerra as nome_plantonista") as any
    );

const splitByTurno = (registros: EscalaCodecRow[]) => {
  const diurno: PlantonistaInput[] = [];
  const noturno: PlantonistaInput[] = [];

  registros.forEach((registro) => {
    const destino = registro.turno === 'diurno' ? diurno : noturno;
    destino.push({
      id: registro.id,
      militar_id: registro.militar_id,
      ordem_plantonista: registro.ordem_plantonista,
      nome: registro.nome_plantonista,
    } as any);
  });

  return { diurno, noturno };
};

const prepararPlantonistas = (data: string, diurno: PlantonistaInput[] = [], noturno: PlantonistaInput[] = []) => {
  const inserir: Array<{ data: string; turno: Turno; militar_id: number; ordem_plantonista: number }> = [];
  const addedMilitarIdsDiurno = new Set<number>();
  const addedMilitarIdsNoturno = new Set<number>();

  diurno.forEach((p, index) => {
    if (p && p.militar_id && !addedMilitarIdsDiurno.has(p.militar_id)) {
      inserir.push({
        data,
        turno: 'diurno',
        militar_id: p.militar_id,
        ordem_plantonista: typeof p.ordem_plantonista === 'number' ? p.ordem_plantonista : index + 1,
      });
      addedMilitarIdsDiurno.add(p.militar_id);
    }
  });

  noturno.forEach((p, index) => {
    if (p && p.militar_id && !addedMilitarIdsNoturno.has(p.militar_id)) {
      inserir.push({
        data,
        turno: 'noturno',
        militar_id: p.militar_id,
        ordem_plantonista: typeof p.ordem_plantonista === 'number' ? p.ordem_plantonista : index + 1,
      });
      addedMilitarIdsNoturno.add(p.militar_id);
    }
  });

  return inserir;
};

const escalaCodecController = {
  getAll: async (req: Request, res: Response) => {
    const { data_inicio, data_fim } = req.query as { data_inicio?: string; data_fim?: string };
    const query = buildBaseQuery();

    if (data_inicio) {
      query.where('ec.data', '>=', data_inicio);
    }
    if (data_fim) {
      query.where('ec.data', '<=', data_fim);
    }

    const escalas = await query
      .orderBy('ec.data', 'desc')
      .orderBy('ec.turno', 'asc')
      .orderBy('ec.ordem_plantonista', 'asc');

    const agrupadas = splitByTurno(escalas as EscalaCodecRow[]);

    return res.status(200).json({ diurno: agrupadas.diurno, noturno: agrupadas.noturno, data: data_inicio || data_fim });
  },

  getById: async (req: Request, res: Response) => {
    const { id } = req.params;
    const registro = await buildBaseQuery().where('ec.id', id).first();

    if (!registro) {
      throw new AppError('Registro de escala nao encontrado.', 404);
    }

    const { diurno, noturno } = splitByTurno([registro as EscalaCodecRow]);
    return res.status(200).json({ diurno, noturno, data: registro.data });
  },

  create: async (req: Request, res: Response) => {
    const { data, diurno = [], noturno = [] } = req.body as {
      data: string;
      diurno?: PlantonistaInput[];
      noturno?: PlantonistaInput[];
    };

    if (!data) {
      throw new AppError('Data e obrigatoria.', 400);
    }

    await db.transaction(async (trx) => {
      await trx('escala_codec').where({ data }).del();

      const plantonistas = prepararPlantonistas(data, diurno, noturno);
      if (plantonistas.length > 0) {
        await trx('escala_codec').insert(plantonistas);
      }
    });

    return res.status(201).json({ message: 'Escala do CODEC salva com sucesso!' });
  },

  update: async (req: Request, res: Response) => {
    const { id } = req.params;
    const { data, diurno = [], noturno = [] } = req.body as {
      data?: string;
      diurno?: PlantonistaInput[];
      noturno?: PlantonistaInput[];
    };

    const registro = await db('escala_codec').where({ id }).first();
    if (!registro) {
      throw new AppError('Registro de escala nao encontrado.', 404);
    }

    const dataAlvo = data || registro.data;

    await db.transaction(async (trx) => {
      await trx('escala_codec').where({ data: registro.data }).del();

      const plantonistas = prepararPlantonistas(dataAlvo, diurno, noturno);
      if (plantonistas.length > 0) {
        await trx('escala_codec').insert(plantonistas);
      }
    });

    return res.status(200).json({ message: 'Escala do CODEC atualizada com sucesso!' });
  },

  delete: async (req: Request, res: Response) => {
    const { id } = req.params;
    const apagado = await db('escala_codec').where({ id }).del();
    if (apagado === 0) {
      throw new AppError('Registro de escala nao encontrado.', 404);
    }
    return res.status(204).send();
  },
};

export = escalaCodecController;
