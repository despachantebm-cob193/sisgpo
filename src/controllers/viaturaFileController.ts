import { Request, Response } from 'express';
import db from '../config/database';
import AppError from '../utils/AppError';
import xlsx from 'xlsx';
import fs from 'fs';
import AIAssistedValidationService from '../services/aiAssistedValidationService';

type UploadedFile = {
  path?: string;
  tempFilePath?: string;
  data?: Buffer;
};

type ViaturaUpload = {
  prefixo: string;
  placa: string | null;
  cidade: string;
  obm: string | null;
  rowNumber: number;
  rawPrefixos: string;
  missingDelimiterHint: boolean;
};

const looksLikeMergedPrefixesWithoutDelimiter = (prefixosRaw: string) => {
  if (!prefixosRaw) return false;
  if (/[;,/]/.test(prefixosRaw)) return false;
  const hyphenParts = prefixosRaw
    .split('-')
    .map((part) => part.trim())
    .filter(Boolean);

  if (hyphenParts.length < 3) return false;

  const hasLetters = hyphenParts.some((part) => /[A-Za-z]/.test(part));
  const hasDigits = hyphenParts.some((part) => /\d/.test(part));

  return hasLetters && hasDigits;
};

const getUploadedFile = (req: Request): UploadedFile | null => {
  const uploaded =
    (req as any).file ||
    ((req as any).files &&
    (req as any).files.file
      ? Array.isArray((req as any).files.file)
        ? (req as any).files.file[0]
        : (req as any).files.file
      : null);
  return uploaded;
};

const viaturaFileController = {
  validateUpload: async (req: Request, res: Response) => {
    const uploaded = getUploadedFile(req);

    if (!uploaded) {
      throw new AppError('Nenhum arquivo foi enviado.', 400);
    }

    const filePath = (uploaded as UploadedFile).path || (uploaded as UploadedFile).tempFilePath || null;

    try {
      const workbook = filePath ? xlsx.readFile(filePath) : xlsx.read((uploaded as any).data, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const rows = xlsx.utils.sheet_to_json(worksheet, { header: 1, defval: '' }) as any[];

      if (rows.length <= 1) {
        throw new AppError('A planilha esta vazia ou contem apenas o cabecalho.', 400);
      }

      const viaturasToValidate: ViaturaUpload[] = [];
      for (let i = 1; i < rows.length; i++) {
        const rowData = rows[i];
        const tipoEscala = rowData[2] ? String(rowData[2]).trim().toUpperCase() : '';

        if (!tipoEscala.includes('VIATURA')) {
          continue;
        }

        const prefixosRaw = rowData[3] ? String(rowData[3]).trim() : '';
        const cidade = rowData[5] ? String(rowData[5]).trim() : 'Nao informada';
        const obm = rowData[6] ? String(rowData[6]).trim() : null;

        const prefixos = prefixosRaw.split(/[,;/]|\s{2,}/).map((p: string) => p.trim()).filter(Boolean);

        if (prefixos.length === 0) {
          continue;
        }

        const rowNumber = i + 1;
        const shouldWarnMissingDelimiter =
          prefixos.length === 1 && looksLikeMergedPrefixesWithoutDelimiter(prefixosRaw);

        for (let j = 0; j < prefixos.length; j++) {
          const viatura: ViaturaUpload = {
            prefixo: prefixos[j],
            placa: null,
            cidade: cidade,
            obm: obm,
            rowNumber,
            rawPrefixos: prefixosRaw,
            missingDelimiterHint: shouldWarnMissingDelimiter,
          };
          viaturasToValidate.push(viatura);
        }
      }

      const validationResult = await (AIAssistedValidationService as any).validateViaturaUpload(viaturasToValidate);

      return res.status(200).json(validationResult);
    } catch (error: any) {
      console.error('Erro durante a validacao de viaturas:', error);
      throw new AppError(error.message || 'Ocorreu um erro inesperado durante a validacao.', 500);
    } finally {
      if (filePath && fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
  },

  upload: async (req: Request, res: Response) => {
    const uploaded = getUploadedFile(req);

    if (!uploaded) {
      throw new AppError('Nenhum arquivo foi enviado.', 400);
    }

    const filePath = (uploaded as UploadedFile).path || (uploaded as UploadedFile).tempFilePath || null;

    try {
      const workbook = filePath ? xlsx.readFile(filePath) : xlsx.read((uploaded as any).data, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const rows = xlsx.utils.sheet_to_json(worksheet, { header: 1, defval: '' }) as any[];

      if (rows.length <= 1) {
        throw new AppError('A planilha esta vazia ou contem apenas o cabecalho.', 400);
      }

      const existingViaturas = await db('viaturas').select('id', 'prefixo');
      const viaturaMap = new Map<string, number>(
        existingViaturas.map((v: any) => [v.prefixo.toUpperCase().trim(), v.id])
      );

      let insertedCount = 0;
      let updatedCount = 0;
      let ignoredCount = 0;
      const processingErrors: string[] = [];

      await db.transaction(async (trx) => {
        for (let i = 1; i < rows.length; i++) {
          const rowData = rows[i];

          const tipoEscala = rowData[2] ? String(rowData[2]).trim().toUpperCase() : '';
          if (!tipoEscala.includes('VIATURA')) {
            continue;
          }

          const prefixosRaw = rowData[3] ? String(rowData[3]).trim() : '';
          const cidade = rowData[5] ? String(rowData[5]).trim() : 'Nao informada';
          const nomeObm = rowData[6] ? String(rowData[6]).trim() : null;
          const prefixos = prefixosRaw.split(/[,;/]|\s{2,}/).map((p: string) => p.trim()).filter(Boolean);

          if (prefixos.length === 0) {
            ignoredCount++;
            continue;
          }

          if (!nomeObm) {
            processingErrors.push(`Linha ${i + 1}: Nome da OBM nao preenchido.`);
            ignoredCount += prefixos.length;
            continue;
          }

          for (const prefixo of prefixos) {
            if (!prefixo) {
              processingErrors.push(`Linha ${i + 1}: Prefixo invalido ou ausente.`);
              ignoredCount++;
              continue;
            }

            const viaturaData = { prefixo, ativa: true, cidade, obm: nomeObm };
            const existingViaturaId = viaturaMap.get(prefixo.toUpperCase().trim());

            if (existingViaturaId) {
              await trx('viaturas').where({ id: existingViaturaId }).update({ ...viaturaData, updated_at: db.fn.now() });
              updatedCount++;
            } else {
              await trx('viaturas').insert(viaturaData);
              insertedCount++;
            }
          }
        }

        const lastUploadTime = new Date().toISOString();
        await trx('metadata')
          .insert({ key: 'viaturas_last_upload', value: lastUploadTime })
          .onConflict('key')
          .merge();
      });

      return res.status(200).json({
        message: `Arquivo processado! Inseridas: ${insertedCount}, Atualizadas: ${updatedCount}, Ignoradas: ${ignoredCount}.`,
        inserted: insertedCount,
        updated: updatedCount,
        errors: processingErrors,
      });
    } catch (error: any) {
      console.error('Erro durante a importacao de viaturas:', error);
      throw new AppError(error.message || 'Ocorreu um erro inesperado durante a importacao.', 500);
    } finally {
      if (filePath && fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
  },
};

export = viaturaFileController;
