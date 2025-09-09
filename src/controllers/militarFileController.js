// Arquivo: backend/src/controllers/militarFileController.js

const db = require('../config/database');
const AppError = require('../utils/AppError');
const xlsx = require('xlsx');
const fs = require('fs');

const militarFileController = {
  upload: async (req, res) => {
    if (!req.file) {
      throw new AppError('Nenhum arquivo foi enviado.', 400);
    }

    const filePath = req.file.path;

    try {
      const workbook = xlsx.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      // Lê a planilha. `defval: ""` garante que células vazias se tornem strings vazias.
      const rows = xlsx.utils.sheet_to_json(worksheet, { header: 1, defval: "" });

      // Busca apenas as matrículas existentes para saber se deve INSERIR ou ATUALIZAR.
      const existingMilitares = await db('militares').select('matricula');
      const existingMatriculas = new Set(existingMilitares.map(m => String(m.matricula).trim()));

      let inserted = 0;
      let updated = 0;
      const failedRows = [];

      // Inicia uma transação para garantir que ou tudo é salvo, ou nada é.
      await db.transaction(async trx => {
        // Começa o loop da linha 1 para pular o cabeçalho (índice 0)
        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          
          // Mapeia as colunas da sua planilha para variáveis.
          // Ajuste a ordem se a sua planilha for diferente.
          const [posto_graduacao, nome_completo, nome_guerra, matricula, obm_nome, ativo_str] = row;

          // Validação mínima: matrícula e nome completo são obrigatórios.
          if (!matricula || !nome_completo) {
            failedRows.push({ linha: i + 1, motivo: 'Matrícula ou Nome Completo não preenchidos.' });
            continue; // Pula para a próxima linha
          }

          // Converte a string "SIM"/"NÃO" para booleano (true/false)
          const ativo = ativo_str ? String(ativo_str).trim().toUpperCase() === 'SIM' : true;

          // Monta o objeto de dados para o banco, usando a nova coluna 'obm_nome'.
          const militarData = {
            matricula: String(matricula).trim(),
            nome_completo: String(nome_completo).trim(),
            nome_guerra: String(nome_guerra || '').trim(),
            posto_graduacao: String(posto_graduacao || '').trim(),
            obm_nome: String(obm_nome || 'Não informada').trim(), // Salva o nome da OBM como texto
            ativo: ativo,
          };

          try {
            // Verifica se a matrícula já existe no conjunto que buscamos do banco.
            if (existingMatriculas.has(militarData.matricula)) {
              // Se existe, ATUALIZA o registro.
              await trx('militares').where('matricula', militarData.matricula).update({ ...militarData, updated_at: db.fn.now() });
              updated++;
            } else {
              // Se não existe, INSERE um novo registro.
              await trx('militares').insert(militarData);
              inserted++;
            }
          } catch (error) {
            failedRows.push({ linha: i + 1, motivo: `Erro no banco: ${error.message}` });
          }
        }
      });

      // Envia a resposta de sucesso para o frontend.
      res.status(200).json({
        message: `Sincronização concluída! Inseridos: ${inserted}, Atualizados: ${updated}, Falhas: ${failedRows.length}.`,
        inserted,
        updated,
        failures: failedRows,
      });

    } catch (error) {
      console.error("Erro durante a importação de militares:", error);
      throw new AppError(error.message || "Ocorreu um erro inesperado durante a importação.", 500);
    } finally {
      // Garante que o arquivo temporário da planilha seja sempre apagado.
      if (req.file && req.file.path) {
        fs.unlinkSync(filePath);
      }
    }
  },
};

module.exports = militarFileController;
