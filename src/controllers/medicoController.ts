import { Request, Response } from 'express';
import db from '../config/database';
import AppError from '../utils/AppError';
import { normalizeText } from '../utils/textUtils';

const ACCENT_FROM = 'Ç?Ç?ÇŸÇ\'Ç"Ç­ÇÿÇœÇ½ÇÏÇ%Ç^ÇSÇ<Ç¸ÇùÇ¦Ç®Ç?ÇOÇZÇ?ÇðÇªÇ©ÇîÇ"Ç\'ÇÇ"Ç-ÇüÇýÇæÇïÇôÇsÇTÇ>ÇoÇ§ÇûÇ¯Ç¬ÇÎÇõÇ\'Çñ';
const ACCENT_TO = 'AAAAAaaaaaEEEEeeeeIIIIiiiiOOOOOoooooUUUUuuuuCcNn';

type MedicoRecord = {
  id: number;
  nome_completo: string;
  funcao: string;
  telefone?: string | null;
  observacoes?: string | null;
  ativo?: boolean;
};

const ensureBaseCivilForMedico = async (trx: typeof db, medico: MedicoRecord) => {
  const payload = {
    medico_id: medico.id,
    nome_completo: medico.nome_completo,
    funcao: medico.funcao,
    telefone: medico.telefone,
    observacoes: medico.observacoes,
    ativo: typeof medico.ativo === 'boolean' ? medico.ativo : true,
    status_servico: 'Presente',
  };

  const existente = await trx('civis')
    .where({ medico_id: medico.id })
    .whereNull('entrada_servico')
    .whereNull('saida_servico')
    .first();

  if (existente) {
    await trx('civis')
      .where({ id: existente.id })
      .update({ ...payload, updated_at: (trx as any).fn.now() });
    return existente;
  }

  const [registrado] = await trx('civis').insert(payload).returning('*');
  return registrado;
};

const deleteBaseCivilForMedico = async (trx: typeof db, medicoId: number | string) => {
  await trx('civis')
    .where({ medico_id: medicoId })
    .whereNull('entrada_servico')
    .whereNull('saida_servico')
    .del();
};

const medicoController = {
  getAll: async (req: Request, res: Response) => {
    const { nome_completo } = req.query as { nome_completo?: string };
    const page = parseInt((req.query.page as string) || '1', 10) || 1;
    const limit = parseInt((req.query.limit as string) || '20', 10) || 20;
    const offset = (page - 1) * limit;

    const query = db('medicos').select('*').orderBy('nome_completo', 'asc');

    if (nome_completo) {
      const normalizedQ = normalizeText(nome_completo);
      query.where((builder) => {
        builder
          .where(
            db.raw(`translate(lower(coalesce(nome_completo, '')), ?, ?) LIKE ?`, [
              ACCENT_FROM,
              ACCENT_TO,
              `%${normalizedQ}%`,
            ])
          )
          .orWhere(
            db.raw(`translate(lower(coalesce(funcao, '')), ?, ?) LIKE ?`, [ACCENT_FROM, ACCENT_TO, `%${normalizedQ}%`])
          )
          .orWhere(
            db.raw(`translate(lower(coalesce(telefone, '')), ?, ?) LIKE ?`, [ACCENT_FROM, ACCENT_TO, `%${normalizedQ}%`])
          );
      });
    }

    const countQuery = query.clone().clearSelect().clearOrder().count({ count: 'id' }).first();
    const totalResult = await countQuery;
    const totalRecords = Number((totalResult as any)?.count ?? 0);
    const totalPages = Math.ceil(totalRecords / limit) || 1;
    const medicos = await query.clone().limit(limit).offset(offset);

    return res.status(200).json({
      data: medicos,
      pagination: {
        currentPage: Number(page),
        totalPages,
        totalRecords,
      },
    });
  },

  create: async (req: Request, res: Response) => {
    const { nome_completo, funcao, telefone, observacoes } = req.body as {
      nome_completo?: string;
      funcao?: string;
      telefone?: string;
      observacoes?: string;
    };

    if (!nome_completo || !funcao) {
      throw new AppError('Nome completo e funcao sao obrigatorios.', 400);
    }

    const novoMedico = await db.transaction(async (trx) => {
      const [registrado] = await trx('medicos')
        .insert({
          nome_completo,
          funcao,
          telefone,
          observacoes,
          ativo: true,
        })
        .returning('*');

      await ensureBaseCivilForMedico(trx, registrado as MedicoRecord);
      return registrado;
    });

    return res.status(201).json(novoMedico);
  },

  update: async (req: Request, res: Response) => {
    const { id } = req.params;
    const { nome_completo, funcao, telefone, observacoes, ativo } = req.body as Partial<MedicoRecord>;

    const medico = await db('medicos').where({ id }).first();
    if (!medico) {
      throw new AppError('Medico nao encontrado.', 404);
    }

    const medicoAtualizado = await db.transaction(async (trx) => {
      const [registroAtualizado] = await trx('medicos')
        .where({ id })
        .update(
          {
            nome_completo,
            funcao,
            telefone,
            observacoes,
            ativo,
          },
          '*'
        );

      await ensureBaseCivilForMedico(trx, registroAtualizado as MedicoRecord);
      return registroAtualizado;
    });

    return res.status(200).json(medicoAtualizado);
  },

  delete: async (req: Request, res: Response) => {
    const { id } = req.params;

    await db.transaction(async (trx) => {
      const medico = await trx('medicos').where({ id }).first();
      if (!medico) {
        throw new AppError('Medico nao encontrado.', 404);
      }

      await deleteBaseCivilForMedico(trx, Number(id));
      await trx('medicos').where({ id }).del();
    });

    return res.status(200).json({ message: 'Medico removido com sucesso.' });
  },

  toggleActive: async (req: Request, res: Response) => {
    const { id } = req.params;

    const { medico, novoStatus } = await db.transaction(async (trx) => {
      const registro = await trx('medicos').where({ id }).first();
      if (!registro) {
        throw new AppError('Medico nao encontrado.', 404);
      }

      const status = !registro.ativo;
      await trx('medicos').where({ id }).update({ ativo: status });
      await trx('civis')
        .where({ medico_id: id })
        .whereNull('entrada_servico')
        .whereNull('saida_servico')
        .update({ ativo: status, updated_at: (trx as any).fn.now() });

      return { medico: registro, novoStatus: status };
    });

    return res.status(200).json({
      message: `Medico ${novoStatus ? 'ativado' : 'desativado'} com sucesso.`,
      medico: { ...medico, ativo: novoStatus },
    });
  },

  search: async (req: Request, res: Response) => {
    const { term } = req.query as { term?: string };
    const query = db('medicos').select('*');

    if (term) {
      const normalizedTerm = normalizeText(term);
      query.where(
        db.raw(`translate(lower(coalesce(nome_completo, '')), ?, ?) LIKE ?`, [ACCENT_FROM, ACCENT_TO, `%${normalizedTerm}%`])
      );
    }

    const medicos = await query;
    return res.status(200).json(medicos);
  },
};

export = medicoController;
