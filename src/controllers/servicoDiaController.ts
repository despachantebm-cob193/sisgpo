import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../config/supabase';
import AppError from '../utils/AppError';

type PessoaType = 'militar' | 'civil';

type ServicoDiaRow = {
  data_inicio: string;
  data_fim: string;
  funcao: string;
  pessoa_id: number;
  pessoa_type: PessoaType;
};

type ServicoDiaInput = {
  funcao: string;
  pessoa_id: number;
  pessoa_type: PessoaType;
};

type ServicoDiaResult = {
  funcao: string;
  pessoa_id: number;
  pessoa_type: PessoaType;
  nome_guerra: string | null;
  posto_graduacao: string | null;
};

const toIsoDate = (value?: string): string => {
  const date = value ? new Date(value) : new Date();
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
};

const servicoDiaController = {
  getByDate: async (req: Request, res: Response, next: NextFunction) => {
    const { data } = req.query as { data?: string };
    const dataBusca = toIsoDate(data);

    try {
      // 1. Achar "último plantão" ou "plantão vigente" para a data
      // O original buscava intervalo: data_inicio <= busca <= data_fim (Ponto no tempo)
      // MUDANÇA: Buscar INTERSEÇÃO (Overlap) com o dia da busca, igual ao Dashboard.

      const requestDate = new Date(dataBusca);
      requestDate.setHours(0, 0, 0, 0);
      const startOfDay = requestDate.toISOString();

      requestDate.setHours(23, 59, 59, 999);
      const endOfDay = requestDate.toISOString();

      const { data: ultimoPlantao } = await supabaseAdmin
        .from('servico_dia')
        .select('data_inicio')
        // (Start < EndOfDay) AND (End > StartOfDay)
        .lt('data_inicio', endOfDay)
        .gt('data_fim', startOfDay)
        .order('data_inicio', { ascending: false })
        .limit(1)
        .single();

      if (!ultimoPlantao) {
        return res.status(200).json([]);
      }

      // 2. Pegar todos os registros desse dia
      // O original usava ultimoPlantao.data_inicio como chave para buscar todos.
      // Suponto que 'servico_dia' agrupa escalas por 'data_inicio'.
      const { data: servicosFetch } = await supabaseAdmin
        .from('servico_dia')
        .select('*')
        .eq('data_inicio', ultimoPlantao.data_inicio);

      const servicos = (servicosFetch || []) as ServicoDiaRow[];

      const servicoMilitares = servicos.filter((s) => s.pessoa_type === 'militar');
      const servicoCivis = servicos.filter((s) => s.pessoa_type === 'civil');

      // 3. Hydrate Militares
      let militaresData: Array<{ id: number; posto_graduacao: string | null; nome_guerra: string | null }> = [];
      if (servicoMilitares.length > 0) {
        // Busca IDs
        const ids = servicoMilitares.map((s) => s.pessoa_id);
        const { data: mils } = await supabaseAdmin
          .from('militares')
          .select('id, posto_graduacao, nome_guerra, nome_completo')
          .in('id', ids);

        militaresData = (mils || []).map((m: any) => ({
          id: m.id,
          posto_graduacao: m.posto_graduacao,
          // Lógica de fallback nome_guerra
          nome_guerra: (m.nome_guerra && m.nome_guerra.trim()) ? m.nome_guerra : m.nome_completo
        }));
      }

      // 4. Hydrate Civis
      let civisData: Array<{ id: number; posto_graduacao: string | null; nome_guerra: string | null }> = [];
      if (servicoCivis.length > 0) {
        const ids = servicoCivis.map((sc) => sc.pessoa_id);
        const { data: civs } = await supabaseAdmin
          .from('civis')
          .select('id, nome_completo')
          .in('id', ids);

        civisData = (civs || []).map((c: any) => ({
          id: c.id,
          posto_graduacao: 'MÉDICO',
          nome_guerra: c.nome_completo
        }));
      }

      // 5. Merge
      const resultadoFinal: ServicoDiaResult[] = servicos.map((servico) => {
        const pessoaData =
          servico.pessoa_type === 'militar'
            ? militaresData.find((m) => m.id === servico.pessoa_id)
            : civisData.find((c) => c.id === servico.pessoa_id);

        return {
          funcao: servico.funcao,
          pessoa_id: servico.pessoa_id,
          pessoa_type: servico.pessoa_type,
          nome_guerra: pessoaData?.nome_guerra ?? null,
          posto_graduacao: pessoaData?.posto_graduacao ?? null,
        };
      });

      return res.status(200).json(resultadoFinal);
    } catch (error) {
      console.error('ERRO AO BUSCAR SERVICO DO DIA:', error);
      return next(new AppError('Nao foi possivel carregar os dados do servico de dia.', 500));
    }
  },

  save: async (req: Request, res: Response, next: NextFunction) => {
    const { data_inicio, data_fim, servicos } = req.body as {
      data_inicio?: string;
      data_fim?: string;
      servicos?: ServicoDiaInput[];
    };

    if (!data_inicio || !data_fim || !servicos || !Array.isArray(servicos)) {
      return next(
        new AppError('Formato de dados invalido. Data de inicio, fim e lista de servicos sao obrigatorios.', 400)
      );
    }

    try {
      // "Transaction" Manual
      // 1. Delete existentes para data_inicio
      await supabaseAdmin.from('servico_dia').delete().eq('data_inicio', data_inicio);

      // 2. Prepare Unique Inserts
      const uniqueServicos: ServicoDiaInput[] = [];
      const seen = new Set<string>();

      servicos.forEach((s) => {
        if (s.funcao && s.pessoa_id && s.pessoa_type) {
          const key = `${s.pessoa_type}-${s.pessoa_id}-${s.funcao}`;
          if (!seen.has(key)) {
            uniqueServicos.push(s);
            seen.add(key);
          }
        }
      });

      const servicosParaInserir = uniqueServicos
        .filter((s) => s.funcao && s.pessoa_id && s.pessoa_type)
        .map((s) => ({
          data_inicio,
          data_fim,
          funcao: s.funcao,
          pessoa_id: Number(s.pessoa_id),
          pessoa_type: s.pessoa_type,
        }));

      // 3. Insert
      if (servicosParaInserir.length > 0) {
        const { error } = await supabaseAdmin.from('servico_dia').insert(servicosParaInserir);
        if (error) throw error;
      }

      return res.status(200).json({ message: 'Servico do dia salvo com sucesso!' });
    } catch (error) {
      console.error('ERRO AO SALVAR SERVICO DO DIA:', error);
      return next(new AppError('Ocorreu um erro ao salvar o servico do dia.', 500));
    }
  },

  deleteByDate: async (req: Request, res: Response, next: NextFunction) => {
    const { data } = req.query as { data?: string };
    if (!data) return next(new AppError('Data obrigatoria.', 400));

    const dataBusca = toIsoDate(data);

    try {
      // Buscar data exata da escala vigente
      // MUDANÇA: Buscar INTERSEÇÃO (Overlap) com o dia da busca, para garantir que encontre a escala visível
      const requestDate = new Date(dataBusca);
      requestDate.setHours(0, 0, 0, 0);
      const startOfDay = requestDate.toISOString();

      requestDate.setHours(23, 59, 59, 999);
      const endOfDay = requestDate.toISOString();

      const { data: ultimoPlantao } = await supabaseAdmin
        .from('servico_dia')
        .select('data_inicio')
        .lt('data_inicio', endOfDay)
        .gt('data_fim', startOfDay)
        .order('data_inicio', { ascending: false })
        .limit(1)
        .single();

      if (!ultimoPlantao) {
        return res.status(200).json({ message: 'Nenhuma escala ativa encontrada para esta data.' });
      }

      const { error } = await supabaseAdmin
        .from('servico_dia')
        .delete()
        .eq('data_inicio', ultimoPlantao.data_inicio);

      if (error) throw error;

      return res.status(200).json({ message: 'Escala do dia limpa com sucesso!' });
    } catch (error) {
      console.error('ERRO AO DELETAR SERVICO DO DIA:', error);
      return next(new AppError('Ocorreu um erro ao limpar a escala.', 500));
    }
  },
};

export = {
  ...servicoDiaController,
  getServicoDia: servicoDiaController.getByDate,
  updateServicoDia: servicoDiaController.save,
  deleteServicoDia: servicoDiaController.deleteByDate,
};
