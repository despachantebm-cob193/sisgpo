// Arquivo: backend/diagnostico.js (Novo Arquivo)

// Carrega as variáveis de ambiente para conectar ao banco de dados correto
require('dotenv').config();

// Importa a instância do Knex
const db = require('./src/config/database');

async function runDiagnosis() {
  console.log('--- INICIANDO SCRIPT DE DIAGNÓSTICO DO SERVIÇO DE DIA ---');
  
  try {
    // 1. Teste de Conexão Simples
    console.log('\n[PASSO 1] Testando a conexão com o banco de dados...');
    const result = await db.raw('SELECT 1+1 AS result');
    if (result.rows[0].result === 2) {
      console.log('✅ Conexão com o banco de dados bem-sucedida!');
    } else {
      throw new Error('A conexão com o banco de dados falhou no teste básico.');
    }

    // 2. Define a data de hoje para a busca
    const dataBusca = new Date().toISOString().split('T')[0];
    console.log(`\n[PASSO 2] Buscando serviço para a data: ${dataBusca}`);

    // 3. Executa a consulta exata para CIVIS (Reguladores)
    console.log('\n--- CONSULTA PARA CIVIS (REGULADORES) ---');
    const servicoCivisQuery = db('servico_dia as sd')
      .join('civis as c', 'sd.pessoa_id', 'c.id')
      .select(
        'sd.id as servico_id', 'sd.funcao', 'sd.pessoa_id', 'sd.pessoa_type',
        'c.nome_completo'
      )
      .where({ 'sd.data': dataBusca, 'sd.pessoa_type': 'civil' });

    console.log('\nSQL Gerado para Civis:');
    console.log(servicoCivisQuery.toString());
    
    const civisResult = await servicoCivisQuery;

    console.log('\nResultado da Consulta de Civis:');
    if (civisResult.length > 0) {
      console.log(civisResult);
      console.log('\n[CONCLUSÃO PARCIAL] ✅ SUCESSO! Os reguladores FORAM encontrados no banco de dados. O problema pode estar na forma como o frontend processa esses dados.');
    } else {
      console.log('   -> NENHUM RESULTADO ENCONTRADO.');
      console.log('\n[CONCLUSÃO PARCIAL] ❌ FALHA! Os reguladores NÃO foram encontrados para a data de hoje. Verifique os seguintes pontos:');
      console.log(`   1. Na página "Gerenciar Serviço de Dia", você salvou um regulador para a data de HOJE (${dataBusca})?`);
      console.log('   2. Verifique no seu banco de dados (usando DBeaver, etc.) se na tabela "servico_dia" existem registros com `pessoa_type` = "civil" para a data de hoje.');
    }
    
    // 4. Executa a consulta para MILITARES para comparação
    console.log('\n--- CONSULTA PARA MILITARES (COMPARAÇÃO) ---');
    const servicoMilitaresQuery = db('servico_dia as sd')
      .join('militares as m', 'sd.pessoa_id', 'm.id')
      .select('sd.id as servico_id', 'sd.funcao', 'sd.pessoa_id', 'sd.pessoa_type', 'm.nome_guerra')
      .where({ 'sd.data': dataBusca, 'sd.pessoa_type': 'militar' });
      
    const militaresResult = await servicoMilitaresQuery;
    console.log('\nResultado da Consulta de Militares:');
    console.log(militaresResult);


  } catch (error) {
    console.error('\n❌ [ERRO GERAL] Ocorreu um erro durante o diagnóstico!');
    console.error('-------------------------------------------------');
    console.error('Mensagem do Erro:', error.message);
    console.error('-------------------------------------------------');
  } finally {
    // 5. Encerrando a conexão
    console.log('\n[PASSO FINAL] Encerrando a conexão com o banco de dados...');
    await db.destroy();
    console.log('--- FIM DO SCRIPT DE DIAGNÓSTICO ---');
  }
}

runDiagnosis();
