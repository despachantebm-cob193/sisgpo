// Arquivo: backend/diagnostico.js (Novo Arquivo)

// Carrega as variáveis de ambiente para conectar ao banco de dados correto
require('dotenv').config();

// Importa a instância do Knex
const db = require('./src/config/database');

async function runDiagnosis() {
  console.log('--- INICIANDO SCRIPT DE DIAGNÓSTICO ---');
  
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
    console.log('\n[PASSO 2] Executando a consulta da rota /api/admin/servico-dia...');
    const dataBusca = new Date().toISOString().split('T')[0];
    console.log(`Buscando serviço para a data: ${dataBusca}`);

    const servicoQuery = db('servico_dia as sd')
      .leftJoin('militares as m', 'sd.militar_id', 'm.id')
      .select(
        'sd.funcao',
        'm.nome_guerra',
        'm.posto_graduacao'
      )
      .where('sd.data', '=', dataBusca);

    // Imprime o SQL que será executado
    console.log('\nSQL Gerado pelo Knex:');
    console.log(servicoQuery.toString());

    // Executa a consulta
    const servicoResult = await servicoQuery;

    console.log('\n✅ [SUCESSO] A consulta foi executada sem erros!');
    console.log('\nResultado da Consulta:');
    console.log(servicoResult);

  } catch (error) {
    console.error('\n❌ [ERRO] Ocorreu um erro durante o diagnóstico!');
    console.error('-------------------------------------------------');
    console.error('Mensagem do Erro:', error.message);
    console.error('Stack Trace Completo:', error.stack);
    console.error('-------------------------------------------------');
  } finally {
    // 3. Encerrando a conexão
    console.log('\n[PASSO 3] Encerrando a conexão com o banco de dados...');
    await db.destroy();
    console.log('--- FIM DO SCRIPT DE DIAGNÓSTICO ---');
  }
}

runDiagnosis();
