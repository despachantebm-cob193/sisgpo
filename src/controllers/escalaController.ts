import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';
import AppError from '../utils/AppError';

const escalaController = {
  getAllCivis: async (req: Request, res: Response) => {
    const { nome_completo, all } = req.query as { nome_completo?: string; all?: string };

    let query = supabaseAdmin.from('civis').select('id, nome_completo, funcao, telefone, observacoes, ativo', { count: 'exact' });

    if (nome_completo) {
      query = query.ilike('nome_completo', `%${nome_completo}%`);
    }

    if (all === 'true') {
      const { data } = await query.order('nome_completo', { ascending: true });
      return res.status(200).json({ data: data || [], pagination: null });
    }

    const page = parseInt((req.query.page as string) || '1', 10) || 1;
    const limit = parseInt((req.query.limit as string) || '15', 10) || 15;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, count } = await query
      .order('nome_completo', { ascending: true })
      .range(from, to);

    const totalRecords = count || 0;
    const totalPages = Math.ceil(totalRecords / limit) || 1;

    return res.status(200).json({
      data: data || [],
      pagination: { currentPage: page, perPage: limit, totalPages, totalRecords },
    });
  },

  createCivil: async (req: Request, res: Response) => {
    const { nome_completo, funcao, telefone, observacoes, ativo } = req.body;

    const { data, error } = await supabaseAdmin
      .from('civis')
      .insert({ nome_completo, funcao, telefone, observacoes, ativo: ativo !== false })
      .select()
      .single();

    if (error) throw new AppError(`Erro ao criar civil: ${error.message}`, 400);

    return res.status(201).json(data);
  },

  updateCivil: async (req: Request, res: Response) => {
    const { id } = req.params;
    const { nome_completo, funcao, telefone, observacoes, ativo } = req.body;

    const { data, error } = await supabaseAdmin
      .from('civis')
      .update({
        nome_completo,
        funcao,
        telefone,
        observacoes,
        ativo,
        updated_at: new Date()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new AppError('Erro ao atualizar ou civil nao encontrado.', 404);

    return res.status(200).json(data);
  },

  deleteCivil: async (req: Request, res: Response) => {
    const { id } = req.params;
    const { error } = await supabaseAdmin.from('civis').delete().eq('id', id);
    if (error) throw new AppError('Erro ao deletar civil.', 500);
    return res.status(204).send();
  },

  searchCivis: async (req: Request, res: Response) => {
    const { term } = req.query as { term?: string };
    if (!term || term.length < 2) return res.status(200).json([]);

    const { data: civis } = await supabaseAdmin
      .from('civis')
      .select('id, nome_completo, funcao')
      .ilike('nome_completo', `%${term}%`)
      .eq('ativo', true)
      .limit(15);

    const options = (civis || []).map((c: any) => ({
      value: c.id,
      label: c.nome_completo,
      civil: c,
    }));
    return res.status(200).json(options);
  },

  getAllEscalas: async (req: Request, res: Response) => {
    const { data_inicio, data_fim } = req.query as { data_inicio?: string; data_fim?: string };

    // Supabase permite join em queries.
    // FK: escala_medicos.civil_id -> civis.id
    // Syntax: select(*, civis(nome_completo, funcao))
    let query = supabaseAdmin
      .from('escala_medicos')
      .select(`
        id,
        civil_id,
        entrada_servico,
        saida_servico,
        status_servico,
        observacoes,
        civis (nome_completo, funcao)
      `);

    if (data_inicio) query = query.gte('entrada_servico', data_inicio);
    if (data_fim) query = query.lte('saida_servico', data_fim);

    const { data, error } = await query.order('entrada_servico', { ascending: false });

    if (error) throw new AppError(`Erro ao buscar escalas: ${error.message}`, 500);

    const flatData = (data || []).map((e: any) => ({
      ...e,
      nome_completo: e.civis?.nome_completo,
      funcao: e.civis?.funcao
    }));

    return res.status(200).json(flatData);
  },

  createEscala: async (req: Request, res: Response) => {
    const { civil_id, entrada_servico, saida_servico, status_servico, observacoes } = req.body;

    const { data, error } = await supabaseAdmin
      .from('escala_medicos')
      .insert({ civil_id, entrada_servico, saida_servico, status_servico, observacoes })
      .select()
      .single();

    if (error) throw new AppError(`Erro ao criar escala: ${error.message}`, 400);

    return res.status(201).json(data);
  },

  deleteEscala: async (req: Request, res: Response) => {
    const { id } = req.params;
    const { error } = await supabaseAdmin.from('escala_medicos').delete().eq('id', id);
    if (error) throw new AppError('Erro ao deletar escala.', 500);
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
