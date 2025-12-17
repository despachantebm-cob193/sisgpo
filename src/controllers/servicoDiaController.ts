import { Request, Response, NextFunction } from 'express';
import db from '../config/database';
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
      const ultimoPlantao = await db('servico_dia')
        .where('data_inicio', '<=', dataBusca)
        .andWhere('data_fim', '>=', dataBusca)
        .orderBy('data_inicio', 'desc')
        .first<{ data_inicio: string }>('data_inicio');

      if (!ultimoPlantao) {
        return res.status(200).json([]);
      }

      const servicos = await db<ServicoDiaRow>('servico_dia').where({ data_inicio: ultimoPlantao.data_inicio });

      const servicoMilitares = servicos.filter((s) => s.pessoa_type === 'militar');
      const servicoCivis = servicos.filter((s) => s.pessoa_type === 'civil');

      let militaresData: Array<{ id: number; posto_graduacao: string | null; nome_guerra: string | null }> = [];
      if (servicoMilitares.length > 0) {
        militaresData = await db('militares')
          .select(
            'id',
            'posto_graduacao',
            db.raw("COALESCE(NULLIF(TRIM(nome_guerra), ''), nome_completo) as nome_guerra") as any
          )
          .whereIn(
            'id',
            servicoMilitares.map((s) => s.pessoa_id)
          );
      }

      let civisData: Array<{ id: number; posto_graduacao: string | null; nome_guerra: string | null }> = [];
      if (servicoCivis.length > 0) {
        civisData = await db('civis')
          .select('id', db.raw("'MÉDICO' as posto_graduacao") as any, 'nome_completo as nome_guerra')
          .whereIn(
            'id',
            servicoCivis.map((c) => c.pessoa_id)
          );
      }

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
      await db.transaction(async (trx) => {
        await trx('servico_dia').where({ data_inicio }).del();

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

        if (servicosParaInserir.length > 0) {
          await trx('servico_dia').insert(servicosParaInserir);
        }
      });

      return res.status(200).json({ message: 'Servico do dia salvo com sucesso!' });
    } catch (error) {
      console.error('ERRO AO SALVAR SERVICO DO DIA:', error);
      return next(new AppError('Ocorreu um erro ao salvar o servico do dia.', 500));
    }
  },

  deleteByDate: async (req: Request, res: Response, next: NextFunction) => {
    const { data } = req.query as { data?: string };
    if (!data) {
      return next(new AppError('A data e obrigatoria para excluir a escala.', 400));
    }

    const dataBusca = toIsoDate(data);

    try {
      const ultimoPlantao = await db('servico_dia')
        .where('data_inicio', '<=', dataBusca)
        .andWhere('data_fim', '>=', dataBusca)
        .orderBy('data_inicio', 'desc')
        .first<{ data_inicio: string }>('data_inicio');

      if (!ultimoPlantao) {
        return res.status(200).json({ message: 'Nenhuma escala ativa encontrada para esta data.' });
      }

      await db('servico_dia').where({ data_inicio: ultimoPlantao.data_inicio }).del();

      return res.status(200).json({ message: 'Escala do dia limpa com sucesso!' });
    } catch (error) {
      console.error('ERRO AO DELETAR SERVICO DO DIA:', error);
      return next(new AppError('Ocorreu um erro ao limpar a escala do dia.', 500));
    }
  },
};

export = {
  ...servicoDiaController,
  getServicoDia: servicoDiaController.getByDate,
  updateServicoDia: servicoDiaController.save,
  deleteServicoDia: servicoDiaController.deleteByDate,
};
