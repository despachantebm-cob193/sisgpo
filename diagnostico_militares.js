// Arquivo: backend/diagnostico_militares.js (Novo Arquivo)

require('dotenv').config();
const db = require('./src/config/database');

async function runMilitarDiagnosis() {
  console.log('--- INICIANDO SCRIPT DE DIAGNÓSTICO DE MILITARES ---');
  
  try {
    console.log('\n[PASSO 1] Executando a consulta da rota /api/admin/militares...');
    
    const query = db('militares')
      .select(
        'militares.id', 'militares.matricula', 'militares.nome_completo',
        'militares.nome_guerra', 'militares.posto_graduacao', 'militares.ativo',
        'militares.obm_id', 'militares.tipo',
        'obms.abreviatura as obm_abreviatura'
      )
      .leftJoin('obms', 'militares.obm_id', 'obms.id')
      .orderBy('militares.nome_completo', 'asc');

    // Simulando a query com filtros vazios, como o frontend faz
    const nome_completo = '';
    if (nome_completo) query.where('militares.nome_completo', 'ilike', `%${nome_completo}%`);

    console.log('\nSQL Gerado pelo Knex:');
    console.log(query.toString());

    const result = await query;

    console.log('\n✅ [SUCESSO] A consulta foi executada sem erros!');
    console.log(`Total de registros encontrados: ${result.length}`);

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
