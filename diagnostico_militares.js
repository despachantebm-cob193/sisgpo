require('dotenv').config();
const db = require('./src/config/database');

async function runMilitarDiagnosis() {
  console.log('--- INICIANDO SCRIPT DE DIAGNÓSTICO DE MILITARES ---');
  
  try {
    console.log('\n[PASSO 1] Executando a consulta da rota /api/admin/obms...');
    
    // Esta é a query exata que o frontend precisa para popular o dropdown
    const query = db('obms').select('*').orderBy('nome', 'asc');

    console.log('\nSQL Gerado pelo Knex:');
    console.log(query.toString());

    const result = await query;

    console.log('\n✅ [SUCESSO] A consulta foi executada sem erros!');
    console.log(`\nTotal de OBMs encontradas: ${result.length}`);
    console.log('\nResultado da Consulta:');
    console.log(result); // Mostra os dados retornados

  } catch (error) {
    console.error('\n❌ [ERRO] Ocorreu um erro durante o diagnóstico de militares!');
    console.error('-------------------------------------------------');
    console.error('Mensagem do Erro:', error.message);
    console.error('Stack Trace Completo:', error.stack);
    console.error('-------------------------------------------------');
  } finally {
    console.log('\n[PASSO 2] Encerrando a conexão com o banco de dados...');
    await db.destroy();
    console.log('--- FIM DO SCRIPT DE DIAGNÓSTICO ---');
  }
}

runMilitarDiagnosis();
