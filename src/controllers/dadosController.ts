// api/src/controllers/dadosController.ts
import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import logger from '@/config/logger';

// Type guard simples para erros conhecidos do Prisma (baseado no campo 'code')
const isPrismaKnownError = (e: unknown): e is { code: string } =>
  !!e && typeof (e as any).code === 'string';

// Lista naturezas (exclui apenas o grupo "Relatorio de obitos")
export const getNaturezas = async (_req: Request, res: Response) => {
  try {
    const naturezas = await prisma.naturezaOcorrencia.findMany({
      where: { grupo: { not: 'Relatorio de obitos' } },
      orderBy: [{ grupo: 'asc' }, { subgrupo: 'asc' }],
    });
    return res.status(200).json(naturezas);
  } catch (error) {
    logger.error({ err: error }, 'Erro ao buscar naturezas.');
    return res.status(500).json({ message: 'Erro interno do servidor.' });
  }
};

// Busca naturezas por nomes de subgrupo
export const getNaturezasPorNomes = async (req: Request, res: Response) => {
  const { nomes } = req.body;

  if (!Array.isArray(nomes) || nomes.length === 0) {
    return res.status(400).json({ message: 'Um array de nomes de subgrupo e obrigatorio.' });
  }

  try {
    const naturezas = await prisma.naturezaOcorrencia.findMany({
      where: { subgrupo: { in: nomes } },
      select: { id: true, subgrupo: true },
      orderBy: { subgrupo: 'asc' },
    });
    return res.status(200).json(naturezas);
  } catch (error) {
    logger.error({ err: error, nomes }, 'Erro ao buscar naturezas por nomes.');
    return res.status(500).json({ message: 'Erro interno do servidor.' });
  }
};

export const criarNatureza = async (req: Request, res: Response) => {
  const { grupo, subgrupo, abreviacao } = req.body;
  if (!grupo || !subgrupo) {
    return res.status(400).json({ message: 'Os campos Grupo e Subgrupo sao obrigatorios.' });
  }
  try {
    const novaNatureza = await prisma.naturezaOcorrencia.create({
      data: {
        grupo,
        subgrupo,
        abreviacao: abreviacao || null,
      },
    });
    logger.info({ natureza: novaNatureza }, 'Nova natureza de ocorrencia criada.');
    return res.status(201).json(novaNatureza);
  } catch (error) {
    if (isPrismaKnownError(error) && error.code === 'P2002') {
      return res.status(409).json({
        message: 'A combinacao de Grupo e Subgrupo ja existe.',
      });
    }
    logger.error({ err: error, body: req.body }, 'Erro ao criar natureza.');
    return res.status(500).json({ message: 'Erro interno do servidor.' });
  }
};

export const atualizarNatureza = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { grupo, subgrupo, abreviacao } = req.body;
  if (!grupo || !subgrupo) {
    return res.status(400).json({ message: 'Os campos Grupo e Subgrupo sao obrigatorios.' });
  }
  try {
    const naturezaAtualizada = await prisma.naturezaOcorrencia.update({
      where: { id: Number(id) },
      data: {
        grupo,
        subgrupo,
        abreviacao: abreviacao || null,
      },
    });
    logger.info({ natureza: naturezaAtualizada }, 'Natureza de ocorrencia atualizada.');
    return res.status(200).json(naturezaAtualizada);
  } catch (error) {
    if (isPrismaKnownError(error)) {
      if (error.code === 'P2002') {
        return res.status(409).json({
          message: 'A combinacao de Grupo e Subgrupo ja existe.',
        });
      }
      if (error.code === 'P2025') {
        return res.status(404).json({ message: 'Natureza nao encontrada.' });
      }
    }
    logger.error({ err: error, params: req.params, body: req.body }, 'Erro ao atualizar natureza.');
    return res.status(500).json({ message: 'Erro interno do servidor.' });
  }
};

export const excluirNatureza = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await prisma.naturezaOcorrencia.delete({
      where: { id: Number(id) },
    });
    logger.info({ naturezaId: id }, 'Natureza de ocorrencia excluida.');
    return res.status(204).send();
  } catch (error) {
    if (isPrismaKnownError(error)) {
      if (error.code === 'P2003') {
        return res.status(400).json({
          message:
            'Nao e possivel excluir esta natureza, pois ela esta associada a registros existentes.',
        });
      }
      if (error.code === 'P2025') {
        return res.status(404).json({ message: 'Natureza nao encontrada.' });
      }
    }
    logger.error({ err: error, naturezaId: id }, 'Erro ao excluir natureza.');
    return res.status(500).json({ message: 'Erro interno do servidor.' });
  }
};
