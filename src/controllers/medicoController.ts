import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';
import AppError from '../utils/AppError';
import { normalizeText } from '../utils/textUtils';

type MedicoRecord = {
  id: number;
  nome_completo: string;
  funcao: string;
  telefone?: string | null;
  observacoes?: string | null;
  ativo?: boolean;
};

// Helper para sincronizar tabela 'civis' (base para portaria/acesso)
const ensureBaseCivilForMedico = async (medico: MedicoRecord) => {
  const payload = {
    medico_id: medico.id,
    nome_completo: medico.nome_completo,
    funcao: medico.funcao,
    telefone: medico.telefone,
    observacoes: medico.observacoes,
    ativo: typeof medico.ativo === 'boolean' ? medico.ativo : true,
    status_servico: 'Presente',
  };

  // Verifica se já existe civil vinculado a este médico (sem data de saída definida, ou seja, cadastro ativo)
  // Lógica original: whereNull('entrada_servico') AND whereNull('saida_servico')
  // Assumindo que 'civis' aqui funciona como 'cadastro de civis' e não 'log de acesso'.
  const { data: existente } = await supabaseAdmin
    .from('civis')
    .select('*')
    .eq('medico_id', medico.id)
    .is('entrada_servico', null)
    .is('saida_servico', null)
    .single();

  if (existente) {
    await supabaseAdmin
      .from('civis')
      .update({ ...payload, updated_at: new Date() })
      .eq('id', existente.id);
    return existente;
  }

  const { data: registrado } = await supabaseAdmin
    .from('civis')
    .insert(payload)
    .select()
    .single();

  return registrado;
};

const deleteBaseCivilForMedico = async (medicoId: number | string) => {
  await supabaseAdmin
    .from('civis')
    .delete()
    .eq('medico_id', medicoId)
    .is('entrada_servico', null)
    .is('saida_servico', null);
};

const medicoController = {
  getAll: async (req: Request, res: Response) => {
    const { nome_completo } = req.query as { nome_completo?: string };
    const page = parseInt((req.query.page as string) || '1', 10) || 1;
    const limit = parseInt((req.query.limit as string) || '20', 10) || 20;

    let query = supabaseAdmin.from('medicos').select('*', { count: 'exact' });

    if (nome_completo) {
      // Simplificação: ILIKE padrão. 
      // Busca complexa de acentos removida. Supabase com unaccent seria ideal futuramente.
      query = query.ilike('nome_completo', `%${nome_completo}%`);
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data: medicos, count, error } = await query
      .order('nome_completo', { ascending: true })
      .range(from, to);

    if (error) throw new AppError('Erro ao listar medicos', 500);

    const totalRecords = count || 0;
    const totalPages = Math.ceil(totalRecords / limit) || 1;

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
    const { nome_completo, funcao, telefone, observacoes } = req.body as Partial<MedicoRecord>;

    if (!nome_completo || !funcao) {
      throw new AppError('Nome completo e funcao sao obrigatorios.', 400);
    }

    // Transaction simulada
    // 1. Criar médico
    const { data: novoMedico, error } = await supabaseAdmin
      .from('medicos')
      .insert({
        nome_completo,
        funcao,
        telefone,
        observacoes,
        ativo: true,
      })
      .select()
      .single();

    if (error || !novoMedico) {
      throw new AppError(`Erro ao criar medico: ${error?.message}`, 500);
    }

    // 2. Sincronizar Civil (fallback com rollback manual se falhar seria o ideal, mas improvável aqui)
    try {
      await ensureBaseCivilForMedico(novoMedico as MedicoRecord);
    } catch (err) {
      console.error('Erro ao sincronizar civil para o médico criado. O médico foi criado mas civil falhou.', err);
      // Opcional: rollback (delete medico)
    }

    return res.status(201).json(novoMedico);
  },

  update: async (req: Request, res: Response) => {
    const { id } = req.params;
    const { nome_completo, funcao, telefone, observacoes, ativo } = req.body as Partial<MedicoRecord>;

    // 1. Atualizar médico
    const { data: medicoAtualizado, error } = await supabaseAdmin
      .from('medicos')
      .update({
        nome_completo,
        funcao,
        telefone,
        observacoes,
        ativo,
        updated_at: new Date(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error || !medicoAtualizado) {
      throw new AppError('Medico nao encontrado ou erro na atualizacao.', 404);
    }

    // 2. Sync Civil
    await ensureBaseCivilForMedico(medicoAtualizado as MedicoRecord);

    return res.status(200).json(medicoAtualizado);
  },

  delete: async (req: Request, res: Response) => {
    const { id } = req.params;

    // 1. Remover civil associado (base)
    await deleteBaseCivilForMedico(Number(id));

    // 2. Remover médico
    const { error } = await supabaseAdmin
      .from('medicos')
      .delete()
      .eq('id', id);

    if (error) {
      throw new AppError('Erro ao deletar medico.', 500);
    }

    return res.status(200).json({ message: 'Medico removido com sucesso.' });
  },

  toggleActive: async (req: Request, res: Response) => {
    const { id } = req.params;

    const { data: medico } = await supabaseAdmin.from('medicos').select('*').eq('id', id).single();
    if (!medico) throw new AppError('Medico nao encontrado.', 404);

    const novoStatus = !medico.ativo;

    // 1. Update Medico
    const { data: atualizado } = await supabaseAdmin
      .from('medicos')
      .update({ ativo: novoStatus })
      .eq('id', id)
      .select()
      .single();

    // 2. Update Civil
    await supabaseAdmin
      .from('civis')
      .update({ ativo: novoStatus, updated_at: new Date() })
      .eq('medico_id', id)
      .is('entrada_servico', null)
      .is('saida_servico', null);

    return res.status(200).json({
      message: `Medico ${novoStatus ? 'ativado' : 'desativado'} com sucesso.`,
      medico: atualizado,
    });
  },

  search: async (req: Request, res: Response) => {
    const { term } = req.query as { term?: string };

    let query = supabaseAdmin.from('medicos').select('*');

    if (term) {
      const search = `%${term}%`;
      query = query.or(`nome_completo.ilike.${search},funcao.ilike.${search},telefone.ilike.${search}`);
    }

    const { data } = await query.limit(50);
    return res.status(200).json(data || []);
  },
};

export = medicoController;
