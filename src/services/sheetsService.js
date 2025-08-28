// src/services/sheetsService.js
console.log('--- EXECUTANDO sheetsService.js VERSÃO COM VARIÁVEIS DE AMBIENTE ---');

const { google } = require('googleapis');
const path = require('path');
const pool = require('../config/database');
const AppError = require('../utils/AppError');

// --- NOVA Configuração das Credenciais via Variáveis de Ambiente ---
const credentials = {
  type: process.env.GOOGLE_CREDENTIALS_TYPE,
  project_id: process.env.GOOGLE_CREDENTIALS_PROJECT_ID,
  private_key_id: process.env.GOOGLE_CREDENTIALS_PRIVATE_KEY_ID,
  // O Render pode alterar a formatação de quebras de linha. O replace garante que a chave seja válida.
  private_key: JSON.parse(`"${process.env.GOOGLE_CREDENTIALS_PRIVATE_KEY || ''}"`),
  client_email: process.env.GOOGLE_CREDENTIALS_CLIENT_EMAIL,
  client_id: process.env.GOOGLE_CREDENTIALS_CLIENT_ID,
  auth_uri: process.env.GOOGLE_CREDENTIALS_AUTH_URI,
  token_uri: process.env.GOOGLE_CREDENTIALS_TOKEN_URI,
  auth_provider_x509_cert_url: process.env.GOOGLE_CREDENTIALS_AUTH_PROVIDER_CERT_URL,
  client_x509_cert_url: process.env.GOOGLE_CREDENTIALS_CLIENT_CERT_URL,
};

// Valida se as credenciais essenciais foram carregadas
if (!credentials.client_email || !credentials.private_key) {
  throw new AppError('As credenciais do Google não estão configuradas corretamente nas variáveis de ambiente.', 500);
}

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];

const auth = new google.auth.GoogleAuth({
  credentials, // Usa o objeto de credenciais montado
  scopes: SCOPES,
} );

const sheets = google.sheets({ version: 'v4', auth });

// O restante do serviço (sheetsService) permanece exatamente o mesmo
const sheetsService = {
  syncMilitaresFromSheet: async () => {
    const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID;
    const RANGE = 'Militares!A2:F';

    if (!SPREADSHEET_ID) {
      throw new AppError('O ID da planilha do Google Sheets não está configurado no .env', 500);
    }

    // ... (o resto da função continua igual)
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: RANGE,
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      console.log('Nenhum dado encontrado na planilha.');
      return { totalRows: 0, inserted: 0, updated: 0, failed: 0 };
    }

    const obmsResult = await pool.query('SELECT id, abreviatura FROM obms');
    const obmMap = new Map(obmsResult.rows.map(obm => [obm.abreviatura.toUpperCase(), obm.id]));

    let inserted = 0;
    let updated = 0;
    let failed = 0;

    const client = await pool.connect();
    try {
      for (const row of rows) {
        const [matricula, nome_completo, nome_guerra, posto_graduacao, obm_abreviatura, ativo_str] = row;

        if (!matricula || !nome_completo || !obm_abreviatura) {
          console.warn(`Linha ignorada por falta de dados essenciais: ${row.join(', ')}`);
          failed++;
          continue;
        }

        const obm_id = obmMap.get(obm_abreviatura.toUpperCase());
        if (!obm_id) {
          console.warn(`OBM "${obm_abreviatura}" não encontrada para o militar ${nome_completo}. Linha ignorada.`);
          failed++;
          continue;
        }

        const ativo = ativo_str ? ativo_str.toUpperCase() === 'SIM' : true;

        await client.query('BEGIN');
        const militarExists = await client.query('SELECT id FROM militares WHERE matricula = $1', [matricula]);

        if (militarExists.rowCount > 0) {
          await client.query(
            `UPDATE militares SET nome_completo = $1, nome_guerra = $2, posto_graduacao = $3, obm_id = $4, ativo = $5, updated_at = NOW() WHERE matricula = $6`,
            [nome_completo, nome_guerra, posto_graduacao, obm_id, ativo, matricula]
          );
          updated++;
        } else {
          await client.query(
            `INSERT INTO militares (matricula, nome_completo, nome_guerra, posto_graduacao, obm_id, ativo) VALUES ($1, $2, $3, $4, $5, $6)`,
            [matricula, nome_completo, nome_guerra, posto_graduacao, obm_id, ativo]
          );
          inserted++;
        }
        await client.query('COMMIT');
      }
    } catch (error) {
      await client.query('ROLLBACK');
      throw new AppError(`Erro durante a transação no banco de dados: ${error.message}`, 500);
    } finally {
      client.release();
    }

    return { totalRows: rows.length, inserted, updated, failed };
  },
};

module.exports = sheetsService;
