import { google } from 'googleapis';
import AppError from '../utils/AppError';
import db from '../config/database';
import env from '../config/env';

let sheetsClient: any = null;

function getSheetsClient(): any {
  if (sheetsClient) {
    return sheetsClient;
  }

  console.log('[Google Sheets] Tentando inicializar o cliente da API...');

  try {
    const credentials = {
      type: process.env.GOOGLE_CREDENTIALS_TYPE,
      project_id: process.env.GOOGLE_CREDENTIALS_PROJECT_ID,
      private_key_id: process.env.GOOGLE_CREDENTIALS_PRIVATE_KEY_ID,
      private_key: Buffer.from(process.env.GOOGLE_CREDENTIALS_PRIVATE_KEY_BASE64 || '', 'base64').toString('utf8'),
      client_email: process.env.GOOGLE_CREDENTIALS_CLIENT_EMAIL,
      client_id: process.env.GOOGLE_CREDENTIALS_CLIENT_ID,
      auth_uri: process.env.GOOGLE_CREDENTIALS_AUTH_URI,
      token_uri: process.env.GOOGLE_CREDENTIALS_TOKEN_URI,
      auth_provider_x509_cert_url: process.env.GOOGLE_CREDENTIALS_AUTH_PROVIDER_CERT_URL,
      client_x509_cert_url: process.env.GOOGLE_CREDENTIALS_CLIENT_CERT_URL,
    };

    if (!credentials.client_email || !credentials.private_key || !credentials.project_id) {
      throw new Error(
        'Credenciais essenciais do Google (project_id, client_email, private_key_base64) não foram encontradas ou estão vazias.',
      );
    }

    const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];
    const auth = new google.auth.GoogleAuth({ credentials, scopes: SCOPES });

    sheetsClient = google.sheets({ version: 'v4', auth });

    console.log('[Google Sheets] Cliente da API inicializado com sucesso!');
    return sheetsClient;
  } catch (error: any) {
    console.error('FALHA CRÍTICA AO INICIALIZAR O GOOGLE SHEETS SERVICE:', error?.message);
    throw new AppError(`Falha ao inicializar o serviço do Google Sheets: ${error?.message}`, 500);
  }
}

type SyncResult = {
  totalRows: number;
  inserted: number;
  updated: number;
  failed: number;
};

const sheetsService = {
  syncMilitaresFromSheet: async (): Promise<SyncResult> => {
    const sheets = getSheetsClient();
    const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID;
    const RANGE = 'Militares!A2:F';

    if (!SPREADSHEET_ID) {
      throw new AppError('O ID da planilha do Google Sheets (GOOGLE_SHEET_ID) não está configurado.', 500);
    }

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: RANGE,
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      console.log('Nenhum dado encontrado na planilha para sincronizar.');
      return { totalRows: 0, inserted: 0, updated: 0, failed: 0 };
    }

    const [obms, existingMilitares] = await Promise.all([
      db('obms').select('id', 'abreviatura'),
      db('militares').select('matricula'),
    ]);

    const obmMap = new Map(obms.map((obm: any) => [String(obm.abreviatura).toUpperCase(), obm.id]));
    const existingMatriculas = new Set(existingMilitares.map((m: any) => m.matricula));

    let inserted = 0;
    let updated = 0;
    let failed = 0;

    await db.transaction(async (trx) => {
      for (const row of rows) {
        const [matricula, nome_completo, nome_guerra, posto_graduacao, obm_abreviatura, ativo_str] = row;

        if (!matricula || !nome_completo || !obm_abreviatura) {
          console.warn(`[AVISO] Linha ignorada por falta de dados essenciais: ${row.join(', ')}`);
          failed++;
          continue;
        }

        const obm_id = obmMap.get(String(obm_abreviatura).toUpperCase());
        if (!obm_id) {
          console.warn(`[AVISO] OBM "${obm_abreviatura}" não encontrada para o militar ${nome_completo}. Linha ignorada.`);
          failed++;
          continue;
        }

        const ativo = ativo_str ? String(ativo_str).toUpperCase() === 'SIM' : true;
        const militarData = { matricula, nome_completo, nome_guerra, posto_graduacao, obm_id, ativo };

        try {
          if (existingMatriculas.has(matricula)) {
            await trx('militares').where('matricula', matricula).update({ ...militarData, updated_at: db.fn.now() });
            updated++;
          } else {
            await trx('militares').insert(militarData);
            inserted++;
          }
        } catch (error) {
          console.error(`[ERRO] Falha ao processar militar com matrícula ${matricula}:`, error);
          failed++;
        }
      }
    });

    console.log(`Processamento concluído. Inseridos: ${inserted}, Atualizados: ${updated}, Falhas: ${failed}`);
    return { totalRows: rows.length, inserted, updated, failed };
  },
};

export default sheetsService;
