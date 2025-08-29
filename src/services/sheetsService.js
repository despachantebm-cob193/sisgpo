// src/services/sheetsService.js
console.log('--- EXECUTANDO sheetsService.js VERSÃO COM VARIÁVEIS DE AMBIENTE (com try-catch e Base64) ---');

const { google } = require('googleapis');
const pool = require('../config/database');
const AppError = require('../utils/AppError');

let sheets; // Declarado fora do try-catch para ser acessível em todo o módulo

try {
  // --- Lógica de Credenciais ---
  // Monta o objeto de credenciais a partir das variáveis de ambiente do Render.
  const credentials = {
    type: process.env.GOOGLE_CREDENTIALS_TYPE,
    project_id: process.env.GOOGLE_CREDENTIALS_PROJECT_ID,
    private_key_id: process.env.GOOGLE_CREDENTIALS_PRIVATE_KEY_ID,
    
    // ESTA É A PARTE CRUCIAL:
    // 1. Pega a chave privada codificada em Base64 da variável de ambiente.
    // 2. Buffer.from(..., 'base64') decodifica a string Base64 para o formato binário original.
    // 3. .toString('utf8') converte o binário de volta para a string de texto da chave, com as quebras de linha corretas.
    private_key: Buffer.from(process.env.GOOGLE_CREDENTIALS_PRIVATE_KEY_BASE64 || '', 'base64').toString('utf8'),
    
    client_email: process.env.GOOGLE_CREDENTIALS_CLIENT_EMAIL,
    client_id: process.env.GOOGLE_CREDENTIALS_CLIENT_ID,
    auth_uri: process.env.GOOGLE_CREDENTIALS_AUTH_URI,
    token_uri: process.env.GOOGLE_CREDENTIALS_TOKEN_URI,
    auth_provider_x509_cert_url: process.env.GOOGLE_CREDENTIALS_AUTH_PROVIDER_CERT_URL,
    client_x509_cert_url: process.env.GOOGLE_CREDENTIALS_CLIENT_CERT_URL,
  };

  // Valida se as credenciais essenciais foram carregadas do ambiente para evitar erros silenciosos.
  if (!credentials.client_email || !credentials.private_key || !credentials.project_id) {
    throw new Error('Credenciais essenciais do Google (project_id, client_email, private_key_base64) não foram encontradas ou estão vazias nas variáveis de ambiente.');
  }

  const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];
  const auth = new google.auth.GoogleAuth({ credentials, scopes: SCOPES } );
  
  // Inicializa o cliente da API do Google Sheets
  sheets = google.sheets({ version: 'v4', auth });

} catch (error) {
  // Se qualquer parte da configuração de credenciais falhar, o erro é capturado aqui.
  console.error('!!!!!!!!!! FALHA CRÍTICA AO INICIALIZAR O GOOGLE SHEETS SERVICE !!!!!!!!!!');
  console.error(error.message);
  // A variável 'sheets' permanecerá indefinida, e a rota de sync irá falhar de forma controlada,
  // mas o resto da API (login, CRUDs, etc.) continuará funcionando.
}

// --- Lógica de Sincronização ---
const sheetsService = {
  /**
   * Lê os dados da planilha e sincroniza com o banco de dados.
   * @returns {Promise<{totalRows: number, inserted: number, updated: number, failed: number}>}
   */
  syncMilitaresFromSheet: async () => {
    // Verifica se a inicialização do serviço sheets foi bem-sucedida.
    if (!sheets) {
      throw new AppError('O serviço de sincronização com o Google Sheets não foi inicializado corretamente. Verifique os logs do servidor para mais detalhes.', 500);
    }

    const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID;
    const RANGE = 'Militares!A2:F'; // Ex: 'NomeDaAba!A2:F'

    if (!SPREADSHEET_ID) {
      throw new AppError('O ID da planilha do Google Sheets não está configurado no .env', 500);
    }

    // 1. Buscar dados da planilha
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: RANGE,
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      console.log('Nenhum dado encontrado na planilha.');
      return { totalRows: 0, inserted: 0, updated: 0, failed: 0 };
    }

    // 2. Buscar todas as OBMs para mapear abreviatura -> id
    const obmsResult = await pool.query('SELECT id, abreviatura FROM obms');
    const obmMap = new Map(obmsResult.rows.map(obm => [obm.abreviatura.toUpperCase(), obm.id]));

    // 3. Processar cada linha da planilha
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
      console.error('Erro na transação, rollback executado:', error);
      throw new AppError(`Erro durante a transação no banco de dados: ${error.message}`, 500);
    } finally {
      client.release();
    }

    return { totalRows: rows.length, inserted, updated, failed };
  },
};

module.exports = sheetsService;
