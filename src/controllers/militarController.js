// Arquivo: backend/diagnostico-militares.js

// Carrega as variáveis de ambiente para conectar ao banco de dados correto
require('dotenv').config();

// Importa a instância do Knex
const db = require('../config/database');

// --- IMPORTANTE: COLOQUE AQUI UMA MATRÍCULA QUE VOCÊ SABE QUE EXISTE NO SEU BANCO DE DADOS ---
const MATRICULA_PARA_TESTAR = '2636'; // Use a matrícula da sua imagem ou outra válida

async function runDiagnosis() {
  console.log('--- INICIANDO SCRIPT DE DIAGNÓSTICO DE BUSCA DE MILITAR ---');
  
  if (!MATRICULA_PARA_TESTAR) {
    console.error('\n❌ ERRO: Por favor, defina a MATRICULA_PARA_TESTAR no topo do script.');
    return;
  }

  try {
    // 1. Teste de Conexão Simples
    console.log('\n[PASSO 1] Testando a conexão com o banco de dados...');
    const result = await db.raw('SELECT 1+1 AS result');
    if (result.rows[0].result === 2) {
      console.log('✅ Conexão com o banco de dados bem-sucedida!');
    } else {
      throw new Error('A conexão com o banco de dados falhou no teste básico.');
    }

    // 2. Executando a consulta exata do Controller
    console.log(`\n[PASSO 2] Executando a consulta para a matrícula: ${MATRICULA_PARA_TESTAR}...`);
    
    const militarQuery = db('militares')
      .select('id', 'nome_completo', 'posto_graduacao')
      .where({ matricula: MATRICULA_PARA_TESTAR, ativo: true }) // Importante: verifica se o militar está ativo
      .first();

    // Imprime o SQL que será executado para verificação
    console.log('\nSQL Gerado pelo Knex:');
    console.log(militarQuery.toString());

    // Executa a consulta
    const militarResult = await militarQuery;

    console.log('\n✅ [SUCESSO] A consulta foi executada sem erros!');
    console.log('\nResultado da Consulta:');
    
    if (militarResult) {
      console.log(militarResult);
      console.log('\n[CONCLUSÃO] SUCESSO! O militar foi encontrado no banco de dados. O problema provavelmente está na rota do backend ou na chamada do frontend.');
    } else {
      console.log('   -> NENHUM RESULTADO ENCONTRADO.');
      console.log('\n[CONCLUSÃO] FALHA! O militar não foi encontrado. Verifique os seguintes pontos:');
      console.log(`   1. A matrícula "${MATRICULA_PARA_TESTAR}" realmente existe na tabela "militares"?`);
      console.log('   2. A coluna "ativo" para este militar está marcada como "true"? A busca só retorna militares ativos.');
    }

  } catch (error) {
    console.error('\n❌ [ERRO] Ocorreu um erro durante o diagnóstico!');
    console.error('-------------------------------------------------');
    console.error('Mensagem do Erro:', error.message);
    console.error('-------------------------------------------------');
  } finally {
    // 3. Encerrando a conexão
    console.log('\n[PASSO 3] Encerrando a conexão com o banco de dados...');
    await db.destroy();
    console.log('--- FIM DO SCRIPT DE DIAGNÓSTICO ---');
  }
}

runDiagnosis();
