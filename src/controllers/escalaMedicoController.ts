import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';
import AppError from '../utils/AppError';

// Helper: normaliza string vazia para null
const normalizeOptionalText = (value: unknown) => {
  if (value === undefined || value === null) {
    return null;
  }
  const trimmed = value.toString().trim();
  return trimmed.length ? trimmed : null;
};

// CRUD Civis (Médicos/Enfermeiros Civis)
const listCivis = async (req: Request, res: Response) => {
  const { nome_completo, all, data_inicio, data_fim } = req.query as {
    nome_completo?: string;
    all?: string;
    data_inicio?: string;
    data_fim?: string;
  };

  let query = supabaseAdmin.from('civis').select('*', { count: 'exact' });

  if (nome_completo) {
    query = query.ilike('nome_completo', `%${nome_completo}%`);
  }
  if (data_inicio) {
    query = query.gte('entrada_servico', data_inicio);
  }
  if (data_fim) {
    query = query.lte('saida_servico', data_fim);
  }

  if (all === 'true') {
    const { data } = await query.order('nome_completo', { ascending: true });
    return res.status(200).json({ data: data || [], pagination: null });
  }

  const page = parseInt((req.query.page as string) || '1', 10) || 1;
  const limit = parseInt((req.query.limit as string) || '15', 10) || 15;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data, count, error } = await query
    .order('nome_completo', { ascending: true })
    .range(from, to);

  if (error) {
    throw new AppError('Erro ao listar civis.', 500);
  }

  const totalRecords = count || 0;
  const totalPages = Math.ceil(totalRecords / limit) || 1;

  return res.status(200).json({
    data,
    pagination: { currentPage: page, perPage: limit, totalPages, totalRecords },
  });
};

const getCivilById = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { data: registro } = await supabaseAdmin.from('civis').select('*').eq('id', id).single();

  if (!registro) {
    throw new AppError('Registro de medico ou escala nao encontrado.', 404);
  }
  return res.status(200).json(registro);
};

const createCivil = async (req: Request, res: Response) => {
  const { nome_completo, funcao, telefone, observacoes, ativo, entrada_servico, saida_servico, status_servico } =
    req.body;

  const payload: any = {
    nome_completo,
    funcao,
    telefone: normalizeOptionalText(telefone),
    observacoes: normalizeOptionalText(observacoes),
    ativo: typeof ativo === 'boolean' ? ativo : true,
    created_at: new Date(),
    updated_at: new Date()
  };

  if (entrada_servico !== undefined) payload.entrada_servico = entrada_servico;
  if (saida_servico !== undefined) payload.saida_servico = saida_servico;
  if (status_servico !== undefined) payload.status_servico = status_servico;

  const { data: novoRegistro, error } = await supabaseAdmin
    .from('civis')
    .insert(payload)
    .select()
    .single();

  if (error) throw new AppError(`Erro ao criar civil: ${error.message}`, 400);

  return res.status(201).json(novoRegistro);
};

const updateCivil = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { nome_completo, funcao, telefone, observacoes, ativo, entrada_servico, saida_servico, status_servico } =
    req.body;

  const { data: existing } = await supabaseAdmin.from('civis').select('id').eq('id', id).single();

  if (!existing) {
    throw new AppError('Registro de medico ou escala nao encontrado.', 404);
  }

  const dadosAtualizacao: any = {};
  if (nome_completo !== undefined) dadosAtualizacao.nome_completo = nome_completo;
  if (funcao !== undefined) dadosAtualizacao.funcao = funcao;
  if (telefone !== undefined) dadosAtualizacao.telefone = normalizeOptionalText(telefone);
  if (observacoes !== undefined) dadosAtualizacao.observacoes = normalizeOptionalText(observacoes);
  if (ativo !== undefined) dadosAtualizacao.ativo = ativo;
  if (entrada_servico !== undefined) dadosAtualizacao.entrada_servico = entrada_servico;
  if (saida_servico !== undefined) dadosAtualizacao.saida_servico = saida_servico;
  if (status_servico !== undefined) dadosAtualizacao.status_servico = status_servico;

  if (Object.keys(dadosAtualizacao).length > 0) {
    dadosAtualizacao.updated_at = new Date();

    const { data: registroAtualizado, error } = await supabaseAdmin
      .from('civis')
      .update(dadosAtualizacao)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new AppError('Erro ao atualizar registro.', 500);
    return res.status(200).json(registroAtualizado);
  }

  return res.status(200).json(existing);
};

const deleteCivil = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { error } = await supabaseAdmin.from('civis').delete().eq('id', id);
  if (error) {
    throw new AppError('Registro de medico ou escala nao encontrado ou erro ao deletar.', 404);
  }
  return res.status(204).send();
};

const searchCivis = async (req: Request, res: Response) => {
  const { term } = req.query as { term?: string };
  if (!term || term.length < 2) {
    return res.status(200).json([]);
  }

  const { data: civis } = await supabaseAdmin
    .from('civis')
    .select('id, nome_completo, funcao, telefone, medico_id')
    .ilike('nome_completo', `%${term}%`)
    .eq('ativo', true)
    .is('entrada_servico', null) // Filtra apenas cadastro base, nao escalas
    .is('saida_servico', null)
    .order('nome_completo', { ascending: true })
    .limit(15);

  const options = (civis || []).map((c: any) => ({
    value: c.id,
    label: c.funcao ? `${c.nome_completo} (${c.funcao})` : c.nome_completo,
    civil: c,
  }));
  return res.status(200).json(options);
};

const listEscalas = async (req: Request, res: Response) => {
  const { data_inicio, data_fim } = req.query as { data_inicio?: string; data_fim?: string };

  let query = supabaseAdmin.from('civis').select('*').not('entrada_servico', 'is', null);

  if (data_inicio) query = query.gte('entrada_servico', data_inicio);
  if (data_fim) query = query.lte('saida_servico', data_fim);

  const { data } = await query.order('entrada_servico', { ascending: false });
  return res.status(200).json(data || []);
};

const createEscala = async (req: Request, res: Response) => {
  const {
    civil_id,
    nome_completo,
    funcao,
    telefone,
    observacoes,
    ativo,
    entrada_servico,
    saida_servico,
    status_servico,
  } = req.body as any;

  let baseDados: any;
  let medicoId: number | null = null;

  if (civil_id) {
    // Buscar civil existente para auto-preencher dados
    const { data: civil } = await supabaseAdmin.from('civis').select('*').eq('id', civil_id).single();

    if (!civil) {
      throw new AppError('Medico nao encontrado para a escala.', 404);
    }
    baseDados = {
      nome_completo: civil.nome_completo,
      funcao: civil.funcao,
      telefone: civil.telefone,
      observacoes: observacoes !== undefined ? normalizeOptionalText(observacoes) : civil.observacoes,
      ativo: civil.ativo,
    };
    medicoId = civil.medico_id || null;
  } else {
    if (!nome_completo || !funcao) {
      throw new AppError('Informe os dados do medico ou selecione um registro existente.', 400);
    }
    baseDados = {
      nome_completo,
      funcao,
      telefone: normalizeOptionalText(telefone),
      observacoes: normalizeOptionalText(observacoes),
      ativo: typeof ativo === 'boolean' ? ativo : true,
    };
    medicoId = null;
  }

  // Cria um NOVO registro em 'civis' representando a escala (tabela hibrida no legado)
  const { data: novaEscala, error } = await supabaseAdmin
    .from('civis')
    .insert({
      ...baseDados,
      medico_id: medicoId,
      entrada_servico,
      saida_servico,
      status_servico,
      created_at: new Date(),
      updated_at: new Date()
    })
    .select()
    .single();

  if (error) throw new AppError(`Erro ao criar escala: ${error.message}`, 400);

  return res.status(201).json(novaEscala);
};

const deleteEscala = async (req: Request, res: Response) => {
  // Alias para deleteCivil, pois na pratica remove da tabela civis
  return deleteCivil(req, res);
};

const escalaMedicoController = {
  getAll: listCivis,
  getAllCivis: listCivis,
  getById: getCivilById,
  create: createCivil,
  createCivil,
  update: updateCivil,
  updateCivil,
  delete: deleteCivil,
  deleteCivil,
  searchCivis,
  getAllEscalas: listEscalas,
  createEscala,
  deleteEscala,
};

export = escalaMedicoController;
