// src/services/sheetsService.js
const { google } = require('googleapis');
const path = require('path');
const pool = require('../config/database');
const AppError = require('../utils/AppError');

// --- Configuração das Credenciais e da API ---
const KEYFILEPATH = path.join(process.cwd(), 'credentials.json');
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];

const auth = new google.auth.GoogleAuth({
  keyFile: KEYFILEPATH,
  scopes: SCOPES,
} );

const sheets = google.sheets({ version: 'v4', auth });

// --- Lógica de Sincronização ---
const sheetsService = {
  /**
   * Lê os dados da planilha e sincroniza com o banco de dados.
   * @returns {Promise<{totalRows: number, inserted: number, updated: number, failed: number}>}
   */
  syncMilitaresFromSheet: async () => {
    // ID da sua planilha e o nome/range da aba
    const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID;
    const RANGE = 'Militares!A2:F'; // Ex: 'NomeDaAba!A2:F' (da coluna A até F, começando da linha 2)

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

        // Validação mínima dos dados da linha
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

        // Inicia uma transação para cada militar para garantir a atomicidade
        await client.query('BEGIN');

        const militarExists = await client.query('SELECT id FROM militares WHERE matricula = $1', [matricula]);

        if (militarExists.rowCount > 0) {
          // Atualiza o militar existente
          await client.query(
            `UPDATE militares SET nome_completo = $1, nome_guerra = $2, posto_graduacao = $3, obm_id = $4, ativo = $5, updated_at = NOW()
             WHERE matricula = $6`,
            [nome_completo, nome_guerra, posto_graduacao, obm_id, ativo, matricula]
          );
          updated++;
        } else {
          // Insere um novo militar
          await client.query(
            `INSERT INTO militares (matricula, nome_completo, nome_guerra, posto_graduacao, obm_id, ativo)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [matricula, nome_completo, nome_guerra, posto_graduacao, obm_id, ativo]
          );
          inserted++;
        }
        await client.query('COMMIT');
      }
    } catch (error) {
      await client.query('ROLLBACK');
      // Lança o erro para ser capturado pelo controller
      throw new AppError(`Erro durante a transação no banco de dados: ${error.message}`, 500);
    } finally {
      client.release();
    }

    return { totalRows: rows.length, inserted, updated, failed };
  },
};

module.exports = sheetsService;
