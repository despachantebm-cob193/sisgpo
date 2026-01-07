import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';
import AppError from '../utils/AppError';

type EscalaAeronaveInput = {
  data: string;
  status?: string;
  aeronave_id?: number;
  aeronave_prefixo?: string;
  primeiro_piloto_id?: number | null;
  segundo_piloto_id?: number | null;
};

// Helper para formatar nome do piloto similar ao SQL original
const formatPilotName = (piloto: any) => {
  if (!piloto) return 'N/A';
  const posto = piloto.posto_graduacao ? piloto.posto_graduacao.trim() : '';
  const nomeGuerra = piloto.nome_guerra ? piloto.nome_guerra.trim() : '';
  const nomeCompleto = piloto.nome_completo ? piloto.nome_completo.trim() : '';

  // Logic: Posto + (Guerra OR Primeiro Nome de Completo)
  const nomeFinal = nomeGuerra || nomeCompleto.split(' ')[0];
  return `${posto} ${nomeFinal}`.trim();
};

const resolveAeronaveId = async (
  { aeronaveId, prefixo }: { aeronaveId?: number | null; prefixo?: string | null }
) => {
  if (aeronaveId) {
    const { data } = await supabaseAdmin.from('aeronaves').select('id').eq('id', aeronaveId).single();
    if (data) return data.id;
  }

  if (!prefixo) {
    throw new AppError('Informe o id ou prefixo da aeronave.', 400);
  }

  const { data: aeronave } = await supabaseAdmin
    .from('aeronaves')
    .select('id')
    .ilike('prefixo', prefixo)
    .single();

  if (aeronave) return aeronave.id;

  // Insert new if not found
  const { data: novaCorresp, error } = await supabaseAdmin
    .from('aeronaves')
    .insert({
      prefixo: prefixo,
      tipo_asa: 'rotativa',
      ativa: true,
    })
    .select()
    .single();

  if (error || !novaCorresp) throw new AppError(`Erro ao criar aeronave: ${error?.message}`, 500);

  return novaCorresp.id;
};

const escalaAeronaveController = {
  getAll: async (req: Request, res: Response) => {
    const { data_inicio, data_fim } = req.query as { data_inicio?: string; data_fim?: string };

    let query = supabaseAdmin
      .from('escala_aeronaves')
      .select(`
        *,
        aeronaves(prefixo),
        p1:militares!primeiro_piloto_id(posto_graduacao, nome_guerra, nome_completo),
        p2:militares!segundo_piloto_id(posto_graduacao, nome_guerra, nome_completo)
      `);

    if (data_inicio) query = query.gte('data', data_inicio);
    if (data_fim) query = query.lte('data', data_fim);

    const { data: escalas, error } = await query.order('data', { ascending: false });

    if (error) throw new AppError(error.message, 500);

    // Transformação para manter contrato JSON original
    const response = escalas.map((escala: any) => ({
      id: escala.id,
      data: escala.data,
      aeronave_id: escala.aeronave_id,
      status: escala.status,
      primeiro_piloto_id: escala.primeiro_piloto_id,
      segundo_piloto_id: escala.segundo_piloto_id,
      aeronave_prefixo: escala.aeronaves?.prefixo,
      primeiro_piloto: formatPilotName(escala.p1),
      segundo_piloto: formatPilotName(escala.p2)
    }));

    return res.status(200).json(response);
  },

  getById: async (req: Request, res: Response) => {
    const { id } = req.params;
    const { data: escala, error } = await supabaseAdmin
      .from('escala_aeronaves')
      .select(`
        *,
        aeronaves(prefixo),
        p1:militares!primeiro_piloto_id(posto_graduacao, nome_guerra, nome_completo),
        p2:militares!segundo_piloto_id(posto_graduacao, nome_guerra, nome_completo)
      `)
      .eq('id', id)
      .single();

    if (error || !escala) throw new AppError('Escala nao encontrada.', 404);

    const formatted = {
      id: escala.id,
      data: escala.data,
      aeronave_id: escala.aeronave_id,
      status: escala.status,
      primeiro_piloto_id: escala.primeiro_piloto_id,
      segundo_piloto_id: escala.segundo_piloto_id,
      aeronave_prefixo: escala?.aeronaves?.prefixo,
      primeiro_piloto: formatPilotName(escala.p1),
      segundo_piloto: formatPilotName(escala.p2)
    };

    return res.status(200).json(formatted);
  },

  create: async (req: Request, res: Response) => {
    const { data, status, aeronave_id, aeronave_prefixo, primeiro_piloto_id, segundo_piloto_id } =
      req.body as EscalaAeronaveInput;

    const resolvedAeronaveId = await resolveAeronaveId({ aeronaveId: aeronave_id, prefixo: aeronave_prefixo });

    // Check conflict
    const { data: conflito } = await supabaseAdmin
      .from('escala_aeronaves')
      .select('id')
      .eq('data', data)
      .eq('aeronave_id', resolvedAeronaveId)
      .single();

    if (conflito) throw new AppError('Ja existe uma escala para esta aeronave nesta data.', 409);

    const { error } = await supabaseAdmin.from('escala_aeronaves').insert({
      data,
      status: status ?? 'Ativa',
      aeronave_id: resolvedAeronaveId,
      primeiro_piloto_id: primeiro_piloto_id || null,
      segundo_piloto_id: segundo_piloto_id || null,
    });

    if (error) throw new AppError(error.message, 500);

    return res.status(201).json({ message: 'Escala cadastrada com sucesso!' });
  },

  update: async (req: Request, res: Response) => {
    const { id } = req.params;
    const { data, status, aeronave_id, aeronave_prefixo, primeiro_piloto_id, segundo_piloto_id } =
      req.body as EscalaAeronaveInput;

    // Get Current
    const { data: registroAtual, error: fetchError } = await supabaseAdmin
      .from('escala_aeronaves')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !registroAtual) throw new AppError('Registro de escala nao encontrado.', 404);

    const resolvedAeronaveId = await resolveAeronaveId({
      aeronaveId: aeronave_id || registroAtual.aeronave_id,
      prefixo: aeronave_prefixo,
    });

    // Validar conflito se data mudar ou aeronave mudar
    if (data || aeronave_id) {
      const targetData = data || registroAtual.data;
      const { data: conflito } = await supabaseAdmin
        .from('escala_aeronaves')
        .select('id')
        .eq('data', targetData)
        .eq('aeronave_id', resolvedAeronaveId)
        .neq('id', id) // Exclude self
        .single();

      if (conflito) throw new AppError('Ja existe uma escala para esta aeronave nesta data.', 409);
    }

    const payload = {
      data: data || registroAtual.data,
      status: status !== undefined ? status : registroAtual.status,
      aeronave_id: resolvedAeronaveId,
      primeiro_piloto_id: primeiro_piloto_id === undefined ? registroAtual.primeiro_piloto_id : (primeiro_piloto_id || null),
      segundo_piloto_id: segundo_piloto_id === undefined ? registroAtual.segundo_piloto_id : (segundo_piloto_id || null),
      updated_at: new Date()
    };

    const { data: updated, error: updateError } = await supabaseAdmin
      .from('escala_aeronaves')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw new AppError(updateError.message, 500);

    return res.status(200).json(updated);
  },

  delete: async (req: Request, res: Response) => {
    const { id } = req.params;
    const { error } = await supabaseAdmin.from('escala_aeronaves').delete().eq('id', id);
    if (error) throw new AppError(error.message, 500);
    return res.status(204).send();
  },
};

export = escalaAeronaveController;
