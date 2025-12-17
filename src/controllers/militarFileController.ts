import { Request, Response } from 'express';
import db from '../config/database';
import AppError from '../utils/AppError';
import xlsx from 'xlsx';
import fs from 'fs';

type UploadedFile = {
  path?: string;
  tempFilePath?: string;
  data?: Buffer;
};

const militarFileController = {
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

      const rowsAsObjects = xlsx.utils.sheet_to_json(worksheet, { defval: null }) as Record<string, any>[];

      if (rowsAsObjects.length === 0) {
        throw new AppError('A planilha esta vazia ou em um formato invalido.', 400);
      }

      const existingMilitares = await db('militares').select('matricula');
      const existingMatriculas = new Set(existingMilitares.map((m: any) => String(m.matricula).trim()));

      let inserted = 0;
      let updated = 0;
      const failedRows: Array<{ linha: number; motivo: string }> = [];

      await db.transaction(async (trx) => {
        for (let i = 0; i < rowsAsObjects.length; i++) {
          const row = rowsAsObjects[i];
          const linhaNumero = i + 2;

          const isRowEmpty = Object.values(row).every((value) => value === null || String(value).trim() === '');
          if (isRowEmpty) continue;

          const matricula = row['RG'] || row['rg'];
          const nome_completo = row['Nome'] || row['nome'];

          if (!matricula || !nome_completo) {
            failedRows.push({ linha: linhaNumero, motivo: 'Matricula (RG) ou Nome nao preenchidos.' });
            continue;
          }

          const posto_graduacao = row['Graduacao'] || row['Graduação'] || row['graduacao'] || row['Graduaçao'];
          const obm_nome = row['OBM'] || row['obm'];

          const militarData = {
            matricula: String(matricula).trim(),
            nome_completo: String(nome_completo).trim(),
            nome_guerra: '',
            posto_graduacao: String(posto_graduacao || '').trim(),
            obm_nome: String(obm_nome || 'Nao informada').trim(),
            ativo: true,
          };

          try {
            if (existingMatriculas.has(militarData.matricula)) {
              await trx('militares')
                .where('matricula', militarData.matricula)
                .update({ ...militarData, updated_at: trx.fn.now() });
              updated++;
            } else {
              await trx('militares').insert(militarData);
              inserted++;
            }
          } catch (error: any) {
            failedRows.push({ linha: linhaNumero, motivo: `Erro no banco: ${error.message}` });
          }
        }
      });

      return res.status(200).json({
        message: `Sincronizacao concluida! Inseridos: ${inserted}, Atualizados: ${updated}, Falhas: ${failedRows.length}.`,
        inserted,
        updated,
        failures: failedRows,
      });
    } catch (error: any) {
      console.error('Erro durante a importacao de militares:', error);
      throw new AppError(error.message || 'Ocorreu um erro inesperado durante a importacao.', 500);
    } finally {
      if (filePath && fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
  },
};

export = militarFileController;
