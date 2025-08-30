// src/services/sheetsService.js
const { google } = require('googleapis');
const AppError = require('../utils/AppError');
const db = require('../config/database'); // Usando a instância unificada do Knex

let sheetsClient = null;

function getSheetsClient() {
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
      throw new Error('Credenciais essenciais do Google (project_id, client_email, private_key_base64) não foram encontradas ou estão vazias.');
    }

    const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];
    const auth = new google.auth.GoogleAuth({ credentials, scopes: SCOPES } );
    
    sheetsClient = google.sheets({ version: 'v4', auth });
    
    console.log('[Google Sheets] Cliente da API inicializado com sucesso!');
    return sheetsClient;

  } catch (error) {
    console.error('FALHA CRÍTICA AO INICIALIZAR O GOOGLE SHEETS SERVICE:', error.message);
    throw new AppError(`Falha ao inicializar o serviço do Google Sheets: ${error.message}`, 500);
  }
}

const sheetsService = {
  syncMilitaresFromSheet: async () => {
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

    // Busca todas as OBMs e matrículas existentes de uma só vez para otimizar
    const [obms, existingMilitares] = await Promise.all([
      db('obms').select('id', 'abreviatura'),
      db('militares').select('matricula')
    ]);
    
    const obmMap = new Map(obms.map(obm => [obm.abreviatura.toUpperCase(), obm.id]));
    const existingMatriculas = new Set(existingMilitares.map(m => m.matricula));

    let inserted = 0;
    let updated = 0;
    let failed = 0;

    // Usar uma transação para garantir a atomicidade da operação
    await db.transaction(async trx => {
      for (const row of rows) {
        const [matricula, nome_completo, nome_guerra, posto_graduacao, obm_abreviatura, ativo_str] = row;

        if (!matricula || !nome_completo || !obm_abreviatura) {
          console.warn(`[AVISO] Linha ignorada por falta de dados essenciais: ${row.join(', ')}`);
          failed++;
          continue;
        }

        const obm_id = obmMap.get(obm_abreviatura.toUpperCase());
        if (!obm_id) {
          console.warn(`[AVISO] OBM "${obm_abreviatura}" não encontrada para o militar ${nome_completo}. Linha ignorada.`);
          failed++;
          continue;
        }

        const ativo = ativo_str ? ativo_str.toUpperCase() === 'SIM' : true;
        const militarData = { matricula, nome_completo, nome_guerra, posto_graduacao, obm_id, ativo };

        try {
          if (existingMatriculas.has(matricula)) {
            // Se a matrícula já existe, ATUALIZA
            await trx('militares').where('matricula', matricula).update({ ...militarData, updated_at: db.fn.now() });
            updated++;
          } else {
            // Se não existe, INSERE
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

module.exports = sheetsService;
