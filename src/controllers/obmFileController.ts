import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';
import AppError from '../utils/AppError';
import xlsx from 'xlsx';

type UploadedFile = {
  path?: string;
  tempFilePath?: string;
  data?: Buffer;
  buffer?: Buffer;
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

    const fileBuffer = (uploaded as UploadedFile).buffer || (uploaded as UploadedFile).data;
    const filePath = (uploaded as UploadedFile).path || (uploaded as UploadedFile).tempFilePath;

    try {
      let workbook: xlsx.WorkBook;
      if (fileBuffer) {
        workbook = xlsx.read(fileBuffer, { type: 'buffer' });
      } else if (filePath) {
        workbook = xlsx.readFile(filePath);
      } else {
        throw new AppError('Falha ao ler o arquivo enviado.', 400);
      }

      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const rows = xlsx.utils.sheet_to_json(worksheet, { header: 1, defval: '' }) as any[];

      let updatedCount = 0;
      const processingErrors: string[] = [];

      // Carregar OBMs existentes para mapear Nome -> ID
      const { data: allObms, error: obmError } = await supabaseAdmin
        .from('obms')
        .select('id, nome');

      if (obmError) throw new Error(`Erro ao carregar OBMs: ${obmError.message}`);

      const obmMap = new Map<string, number>(allObms?.map((obm: any) => [obm.nome.toUpperCase().trim(), obm.id]) || []);

      for (let i = 1; i < rows.length; i++) {
        const rowData = rows[i] as any[];
        const nomeObmPlanilha = rowData[6] ? String(rowData[6]).trim().toUpperCase() : null;

        if (!nomeObmPlanilha) continue;

        const obmId = obmMap.get(nomeObmPlanilha);

        if (obmId) {
          const dadosParaAtualizar: Record<string, any> = {
            cidade: rowData[5] ? String(rowData[5]).trim() : undefined,
            telefone: rowData[8] ? String(rowData[8]).trim() : undefined,
            updated_at: new Date(),
          };

          // Limpa undefineds
          Object.keys(dadosParaAtualizar).forEach(
            (key) => dadosParaAtualizar[key] === undefined && delete dadosParaAtualizar[key]
          );

          // Se tem algo util para atualizar (alem do updated_at)
          if (Object.keys(dadosParaAtualizar).length > 1) {
            const { error: updateError } = await supabaseAdmin
              .from('obms')
              .update(dadosParaAtualizar)
              .eq('id', obmId);

            if (updateError) {
              processingErrors.push(`Linha ${i + 1}: Erro ao atualizar OBM "${nomeObmPlanilha}": ${updateError.message}`);
            } else {
              updatedCount++;
            }
          }
        } else {
          // Opcional: nao logar erro se for OBM que nao existe no banco, ou logar como warning
          processingErrors.push(`Linha ${i + 1}: OBM "${rowData[6]}" nao encontrada no banco de dados.`);
        }
      }

      return res.status(200).json({
        message: `Arquivo processado! OBMs atualizadas: ${updatedCount}.`,
        updated: updatedCount,
        errors: processingErrors,
      });
    } catch (error: any) {
      console.error('Erro durante a importacao de OBMs:', error);
      throw new AppError(error?.message || 'Ocorreu um erro inesperado durante a importacao.', 500);
    }
  },
};

export = obmFileController;
