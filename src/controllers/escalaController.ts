import { Request, Response } from 'express';
import db from '../config/database';
import AppError from '../utils/AppError';

const escalaController = {
  getAllCivis: async (req: Request, res: Response) => {
    const { nome_completo, all } = req.query as { nome_completo?: string; all?: string };
    const query = db('civis').select('id', 'nome_completo', 'funcao', 'telefone', 'observacoes', 'ativo');
    if (nome_completo) query.where('nome_completo', 'ilike', `%${nome_completo}%`);

    if (all === 'true') {
      const registros = await query.orderBy('nome_completo', 'asc');
      return res.status(200).json({ data: registros, pagination: null });
    }

    const page = parseInt((req.query.page as string) || '1', 10) || 1;
    const limit = parseInt((req.query.limit as string) || '15', 10) || 15;
    const offset = (page - 1) * limit;

    const countQuery = query.clone().clearSelect().clearOrder().count({ count: 'id' }).first();
    const dataQuery = query.clone().orderBy('nome_completo', 'asc').limit(limit).offset(offset);

    const [data, totalResult] = await Promise.all([dataQuery, countQuery]);
    const totalRecords = parseInt((totalResult as any).count, 10);
    const totalPages = Math.ceil(totalRecords / limit) || 1;

    return res.status(200).json({
      data,
      pagination: { currentPage: page, perPage: limit, totalPages, totalRecords },
    });
  },

  createCivil: async (req: Request, res: Response) => {
    const { nome_completo, funcao, telefone, observacoes, ativo } = req.body;
    const [novoRegistro] = await db('civis')
      .insert({ nome_completo, funcao, telefone, observacoes, ativo: ativo !== false })
      .returning('*');
    return res.status(201).json(novoRegistro);
  },

  updateCivil: async (req: Request, res: Response) => {
    const { id } = req.params;
    const { nome_completo, funcao, telefone, observacoes, ativo } = req.body;
    const registroExists = await db('civis').where({ id }).first();
    if (!registroExists) throw new AppError('Registro de medico nao encontrado.', 404);

    const dadosAtualizacao = { nome_completo, funcao, telefone, observacoes, ativo, updated_at: db.fn.now() };
    const [registroAtualizado] = await db('civis').where({ id }).update(dadosAtualizacao).returning('*');
    return res.status(200).json(registroAtualizado);
  },

  deleteCivil: async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await db('civis').where({ id }).del();
    if (result === 0) throw new AppError('Registro de medico nao encontrado.', 404);
    return res.status(204).send();
  },

  searchCivis: async (req: Request, res: Response) => {
    const { term } = req.query as { term?: string };
    if (!term || term.length < 2) return res.status(200).json([]);

    const civis = await db('civis')
      .where('nome_completo', 'ilike', `%${term}%`)
      .andWhere('ativo', true)
      .select('id', 'nome_completo', 'funcao')
      .limit(15);

    const options = civis.map((c: any) => ({
      value: c.id,
      label: c.nome_completo,
      civil: c,
    }));
    return res.status(200).json(options);
  },

  getAllEscalas: async (req: Request, res: Response) => {
    const { data_inicio, data_fim } = req.query as { data_inicio?: string; data_fim?: string };
    const query = db('escala_medicos as em')
      .join('civis as c', 'em.civil_id', 'c.id')
      .select(
        'em.id',
        'em.civil_id',
        'em.entrada_servico',
        'em.saida_servico',
        'em.status_servico',
        'em.observacoes',
        'c.nome_completo',
        'c.funcao'
      );

    if (data_inicio) query.where('em.entrada_servico', '>=', data_inicio);
    if (data_fim) query.where('em.saida_servico', '<=', data_fim);

    const escalas = await query.orderBy('em.entrada_servico', 'desc');
    return res.status(200).json(escalas);
  },

  createEscala: async (req: Request, res: Response) => {
    const { civil_id, entrada_servico, saida_servico, status_servico, observacoes } = req.body;
    const [novaEscala] = await db('escala_medicos')
      .insert({ civil_id, entrada_servico, saida_servico, status_servico, observacoes })
      .returning('*');
    return res.status(201).json(novaEscala);
  },

  deleteEscala: async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await db('escala_medicos').where({ id }).del();
    if (result === 0) throw new AppError('Registro de escala nao encontrado.', 404);
    return res.status(204).send();
  },
};

export = {
  ...escalaController,
  getEscala: escalaController.getAllEscalas,
  updateEscala: async () => {
    throw new AppError(
      'O endpoint /escala foi descontinuado. Utilize as rotas de /escala-medicos para gerenciar registros.',
      410
    );
  },
};
