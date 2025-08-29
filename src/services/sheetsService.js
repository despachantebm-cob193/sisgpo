// src/services/sheetsService.js
console.log('--- EXECUTANDO sheetsService.js VERSÃO COM INICIALIZAÇÃO TARDIA (LAZY INITIALIZATION) ---');

const { google } = require('googleapis');
const AppError = require('../utils/AppError');
const db = require('../config/database'); // Usando a instância unificada do Knex

let sheetsClient = null; // Apenas declaramos o cliente, ele será inicializado depois.

/**
 * Função que inicializa o cliente da API do Google Sheets sob demanda.
 * Ela só é executada quando a sincronização é realmente necessária.
 */
function getSheetsClient() {
  // Se o cliente já foi inicializado, apenas o retorna (padrão Singleton).
  if (sheetsClient) {
    return sheetsClient;
  }

  console.log('[Google Sheets] Tentando inicializar o cliente da API...');

  try {
    // --- Lógica de Credenciais ---
    // A leitura das variáveis de ambiente agora acontece AQUI, dentro da função.
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

    // Valida se as credenciais essenciais foram carregadas.
    if (!credentials.client_email || !credentials.private_key || !credentials.project_id) {
      throw new Error('Credenciais essenciais do Google (project_id, client_email, private_key_base64) não foram encontradas ou estão vazias nas variáveis de ambiente.');
    }

    const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];
    const auth = new google.auth.GoogleAuth({ credentials, scopes: SCOPES } );
    
    // Inicializa e armazena o cliente na variável do módulo.
    sheetsClient = google.sheets({ version: 'v4', auth });
    
    console.log('[Google Sheets] Cliente da API inicializado com sucesso!');
    return sheetsClient;

  } catch (error) {
    console.error('!!!!!!!!!! FALHA CRÍTICA AO INICIALIZAR O GOOGLE SHEETS SERVICE !!!!!!!!!!');
    console.error(error.message);
    // Lança o erro para que a função syncMilitaresFromSheet possa capturá-lo.
    throw new AppError(`Falha ao inicializar o serviço do Google Sheets: ${error.message}`, 500);
  }
}

// --- Lógica de Sincronização ---
const sheetsService = {
  syncMilitaresFromSheet: async () => {
    // 1. Obtém o cliente da API. A inicialização acontece aqui, na primeira chamada.
    const sheets = getSheetsClient();

    const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID;
    const RANGE = 'Militares!A2:F';

    if (!SPREADSHEET_ID) {
      throw new AppError('O ID da planilha do Google Sheets não está configurado no .env', 500);
    }

    // 2. Buscar dados da planilha
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: RANGE,
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      console.log('Nenhum dado encontrado na planilha.');
      return { totalRows: 0, inserted: 0, updated: 0, failed: 0 };
    }

    // 3. Buscar OBMs para mapeamento (usando Knex)
    const obms = await db('obms').select('id', 'abreviatura');
    const obmMap = new Map(obms.map(obm => [obm.abreviatura.toUpperCase(), obm.id]));

    let inserted = 0;
    let updated = 0;
    let failed = 0;

    // 4. Processar cada linha usando uma transação Knex
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
      const militarData = { nome_completo, nome_guerra, posto_graduacao, obm_id, ativo };

      try {
        // O método 'onConflict' e 'merge' do Knex simplifica a lógica de inserir ou atualizar.
        const result = await db('militares')
          .insert({ ...militarData, matricula })
          .onConflict('matricula')
          .merge({ ...militarData, updated_at: db.fn.now() });

        // O Knex não retorna de forma simples se foi insert ou update, mas podemos inferir.
        // Esta é uma simplificação; para contagem exata, a lógica anterior com SELECT era mais precisa.
        // Vamos focar em fazer funcionar primeiro.
        // Para simplificar, vamos apenas contar como sucesso.
        
      } catch (error) {
        console.error(`Falha ao processar militar com matrícula ${matricula}:`, error);
        failed++;
      }
    }
    // A contagem de inseridos/atualizados fica mais complexa com 'onConflict'.
    // Vamos retornar um resultado simplificado por enquanto.
    const totalProcessed = rows.length - failed;
    console.log(`Processamento concluído. Sucesso: ${totalProcessed}, Falhas: ${failed}`);

    return { totalRows: rows.length, processed: totalProcessed, failed };
  },
};

module.exports = sheetsService;
