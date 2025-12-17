import { Request, Response } from 'express';
import db from '../config/database';
import AppError from '../utils/AppError';
import xlsx from 'xlsx';
import fs from 'fs';
import path from 'path';

type UploadedFile = {
  path?: string;
  tempFilePath?: string;
  data?: Buffer;
};

const obmFileController = {
  upload: async (req: Request, res: Response) => {
    const uploaded =
      (req as any).file ||
      ((req as any).files &&
      (req as any).files.file
        ? Array.isArray((req as any).files.file)
          ? (req as any).files.file[0]
          : (req as any).files.file
        : null);

    if (!uploaded) {
      throw new AppError('Nenhum arquivo foi enviado.', 400);
    }

    const filePath = (uploaded as UploadedFile).path || (uploaded as UploadedFile).tempFilePath || null;

    try {
      const workbook = filePath ? xlsx.readFile(filePath) : xlsx.read((uploaded as any).data, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const rows = xlsx.utils.sheet_to_json(worksheet, { header: 1, defval: '' }) as any[];

      let updatedCount = 0;
      const processingErrors: string[] = [];

      const allObms = await db('obms').select('id', 'nome');
      const obmMap = new Map<string, number>(allObms.map((obm: any) => [obm.nome.toUpperCase().trim(), obm.id]));

      await db.transaction(async (trx) => {
        for (let i = 1; i < rows.length; i++) {
          const rowData = rows[i] as any[];

          const nomeObmPlanilha = rowData[6] ? String(rowData[6]).trim().toUpperCase() : null;

          if (!nomeObmPlanilha) continue;

          const obmId = obmMap.get(nomeObmPlanilha);

          if (obmId) {
            const dadosParaAtualizar: Record<string, any> = {
              cidade: rowData[5] ? String(rowData[5]).trim() : undefined,
              telefone: rowData[8] ? String(rowData[8]).trim() : undefined,
              updated_at: db.fn.now(),
            };

            Object.keys(dadosParaAtualizar).forEach(
              (key) => dadosParaAtualizar[key] === undefined && delete dadosParaAtualizar[key]
            );

            if (Object.keys(dadosParaAtualizar).length > 1) {
              await trx('obms').where({ id: obmId }).update(dadosParaAtualizar);
              updatedCount++;
            }
          } else {
            processingErrors.push(`Linha ${i + 1}: OBM "${rowData[6]}" nao encontrada no banco de dados.`);
          }
        }
      });

      return res.status(200).json({
        message: `Arquivo processado! OBMs atualizadas: ${updatedCount}.`,
        updated: updatedCount,
        errors: processingErrors,
      });
    } catch (error: any) {
      console.error('Erro durante a importacao de OBMs:', error);
      throw new AppError(error?.message || 'Ocorreu um erro inesperado durante a importacao.', 500);
    } finally {
      if (filePath && fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
  },
};

export = obmFileController;
