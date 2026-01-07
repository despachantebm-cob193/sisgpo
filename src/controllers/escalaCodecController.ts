import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';
import AppError from '../utils/AppError';

type Turno = 'diurno' | 'noturno';

type EscalaCodecRow = {
  id: number;
  data: string;
  turno: Turno;
  militar_id: number;
  ordem_plantonista: number;
  nome_plantonista?: string;
  militares?: {
    posto_graduacao: string;
    nome_guerra: string;
    nome_completo: string;
  }
};

type PlantonistaInput = {
  militar_id?: number;
  ordem_plantonista?: number;
};

const splitByTurno = (registros: EscalaCodecRow[]) => {
  const diurno: PlantonistaInput[] = [];
  const noturno: PlantonistaInput[] = [];

  registros.forEach((registro) => {
    const destino = registro.turno === 'diurno' ? diurno : noturno;

    // Formatar nome a partir da relação militares
    let nome = '';
    if (registro.militares) {
      nome = `${registro.militares.posto_graduacao} ${registro.militares.nome_guerra || registro.militares.nome_completo}`;
    }

    destino.push({
      id: registro.id,
      militar_id: registro.militar_id,
      ordem_plantonista: registro.ordem_plantonista,
      nome: nome,
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

    let query = supabaseAdmin
      .from('escala_codec')
      .select('*, militares(posto_graduacao, nome_guerra, nome_completo)');

    if (data_inicio) query = query.gte('data', data_inicio);
    if (data_fim) query = query.lte('data', data_fim);

    const { data: escalas, error } = await query
      .order('data', { ascending: false })
      .order('turno', { ascending: true })
      .order('ordem_plantonista', { ascending: true });

    if (error) throw new AppError(`Erro ao buscar escalas: ${error.message}`, 500);

    const agrupadas = splitByTurno(escalas as unknown as EscalaCodecRow[]);

    return res.status(200).json({ diurno: agrupadas.diurno, noturno: agrupadas.noturno, data: data_inicio || data_fim });
  },

  getById: async (req: Request, res: Response) => {
    // Nota: A API original parece buscar 'registro' pelo ID. 
    // Como a escala é dia+turno composto, um ID só retorna 1 linha (1 plantonista).
    // O original fazia getById e split, retornando "diurno/noturno" arrays de 1 item?
    // Analisando original: const registro = await buildBaseQuery().where('ec.id', id).first();
    // Sim, ele retorna structure completa mas só preenche com o plantonista daquele ID.
    // Comportamento estranho mas vamos manter.

    const { id } = req.params;
    const { data: registro, error } = await supabaseAdmin
      .from('escala_codec')
      .select('*, militares(posto_graduacao, nome_guerra, nome_completo)')
      .eq('id', id)
      .single();

    if (error || !registro) {
      throw new AppError('Registro de escala nao encontrado.', 404);
    }

    const { diurno, noturno } = splitByTurno([registro as unknown as EscalaCodecRow]);
    // O original retornava data do registro.
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

    // 1. Delete existing for date
    const { error: deleteError } = await supabaseAdmin
      .from('escala_codec')
      .delete()
      .eq('data', data);

    if (deleteError) throw new AppError(deleteError.message, 500);

    // 2. Insert new
    const plantonistas = prepararPlantonistas(data, diurno, noturno);
    if (plantonistas.length > 0) {
      const { error: insertError } = await supabaseAdmin
        .from('escala_codec')
        .insert(plantonistas);

      if (insertError) throw new AppError(insertError.message, 500);
    }

    return res.status(201).json({ message: 'Escala do CODEC salva com sucesso!' });
  },

  update: async (req: Request, res: Response) => {
    // Update no original funciona por ID, mas deleta TODA a escala do dia daquele ID e recria.
    // É basicamente um "Edit Day" disparado por um ID de registro qualquer daquele dia.
    const { id } = req.params;
    const { data, diurno = [], noturno = [] } = req.body as {
      data?: string; // Nova data alvo (opcional)
      diurno?: PlantonistaInput[];
      noturno?: PlantonistaInput[];
    };

    // Buscar registro original para saber a data original
    const { data: registro, error: fetchError } = await supabaseAdmin
      .from('escala_codec')
      .select('data')
      .eq('id', id)
      .single();

    if (fetchError || !registro) {
      throw new AppError('Registro de escala nao encontrado.', 404);
    }

    const dataOriginal = registro.data;
    const dataAlvo = data || dataOriginal;

    // Transaction logic: Delete old content (from dataOriginal) -> Insert new (to dataAlvo)
    // Se data mudou, deletamos da dataAntiga E da dataNova (para evitar duplicidade)? 
    // O original: db.transaction -> query(data: registro.data).del() -> insert(dataAlvo)
    // Ele deletava onde data = registro.data (limpa o dia antigo).
    // Se dataAlvo for diferente, ele cria no novo dia.
    // Porem, se ja tinha coisa no dia novo, ele NÃO limpava o dia novo explicitamente no original, 
    // mas o insert costuma ser aditivo. 
    // Vamos replicar exato: delete by dataOriginal, insert by dataAlvo.

    const { error: deleteError } = await supabaseAdmin
      .from('escala_codec')
      .delete()
      .eq('data', dataOriginal); // Deleta do dia original

    if (deleteError) throw new AppError(deleteError.message, 500);

    const plantonistas = prepararPlantonistas(dataAlvo, diurno, noturno);
    if (plantonistas.length > 0) {
      const { error: insertError } = await supabaseAdmin
        .from('escala_codec')
        .insert(plantonistas);

      if (insertError) throw new AppError(insertError.message, 500);
    }

    return res.status(200).json({ message: 'Escala do CODEC atualizada com sucesso!' });
  },

  delete: async (req: Request, res: Response) => {
    const { id } = req.params;
    const { error } = await supabaseAdmin.from('escala_codec').delete().eq('id', id);
    if (error) throw new AppError(error.message, 500);
    // Supabase nao retorna rowCount no delete by default sem select. 
    // Assumimos sucesso se nao deu erro.
    return res.status(204).send();
  },
};

export = escalaCodecController;
