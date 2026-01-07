import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';
import AppError from '../utils/AppError';
import xlsx from 'xlsx';

type UploadedFile = {
  path?: string;
  tempFilePath?: string;
  data?: Buffer;
  buffer?: Buffer; // Multer memoryStorage puts content here
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

    // Adaptacao para Memory Storage: Buffer tem prioridade, path deve ser ignorado se nao existir
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

      const rowsAsObjects = xlsx.utils.sheet_to_json(worksheet, { defval: null }) as Record<string, any>[];

      if (rowsAsObjects.length === 0) {
        throw new AppError('A planilha esta vazia ou em um formato invalido.', 400);
      }

      // Buscar Matriculas Existentes para verificar duplicação/update
      // Otimização: Buscar apenas matriculas
      const { data: existingMilitares, error: fetchError } = await supabaseAdmin
        .from('militares')
        .select('matricula');

      if (fetchError) throw new Error(`Erro ao buscar militares: ${fetchError.message}`);

      const existingMatriculas = new Set(existingMilitares?.map((m: any) => String(m.matricula).trim()));

      let inserted = 0;
      let updated = 0;
      const failedRows: Array<{ linha: number; motivo: string }> = [];

      // Processamento Sequencial (Supabase nao suporta transacao tao simples via JS client, faremos loop)
      // Para performance em lotes grandes, ideal seria `upsert` em batch, 
      // mas precisamos de validacao linha a linha e feedback detalhado.

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
          nome_guerra: '', // Default vazio, user atualiza depois
          posto_graduacao: String(posto_graduacao || '').trim(),
          obm_nome: String(obm_nome || 'Nao informada').trim(),
          ativo: true,
          updated_at: new Date()
        };

        try {
          if (existingMatriculas.has(militarData.matricula)) {
            // Update
            const { error: updateError } = await supabaseAdmin
              .from('militares')
              .update(militarData)
              .eq('matricula', militarData.matricula);

            if (updateError) throw updateError;
            updated++;
          } else {
            // Insert
            const { error: insertError } = await supabaseAdmin
              .from('militares')
              .insert({ ...militarData, created_at: new Date() }); // Add created_at

            if (insertError) throw insertError;
            inserted++;
          }
        } catch (error: any) {
          failedRows.push({ linha: linhaNumero, motivo: `Erro no banco: ${error.message}` });
        }
      }

      return res.status(200).json({
        message: `Sincronizacao concluida! Inseridos: ${inserted}, Atualizados: ${updated}, Falhas: ${failedRows.length}.`,
        inserted,
        updated,
        failures: failedRows,
      });

    } catch (error: any) {
      console.error('Erro durante a importacao de militares:', error);
      throw new AppError(error.message || 'Ocorreu um erro inesperado durante a importacao.', 500);
    }
    // Finally block removido pois nao ha arquivo em disco para deletar (MemoryStorage)
  },
};

export = militarFileController;
