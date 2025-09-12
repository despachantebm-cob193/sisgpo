// Arquivo: backend/diagnostico_pilotos.js

require('dotenv').config();
const db = require('./src/config/database');

// --- IMPORTANTE: COLOQUE AQUI O ID DA ESCALA QUE ESTÁ A APRESENTAR O PROBLEMA ---
// Na sua imagem, o ID da escala é provavelmente 1, mas verifique no seu banco de dados.
const ID_DA_ESCALA_PARA_TESTAR = 1;

async function runDiagnosis() {
  console.log('--- INICIANDO SCRIPT DE DIAGNÓSTICO DA ESCALA DE AERONAVES ---');

  if (!ID_DA_ESCALA_PARA_TESTAR) {
    console.error('\n❌ ERRO: Por favor, defina a constante ID_DA_ESCALA_PARA_TESTAR no topo do script.');
    return;
  }

  try {
    // 1. Buscar a escala específica
    console.log(`\n[PASSO 1] Buscando a escala com ID: ${ID_DA_ESCALA_PARA_TESTAR}...`);
    const escala = await db('escala_aeronaves').where({ id: ID_DA_ESCALA_PARA_TESTAR }).first();

    if (!escala) {
      console.error(`\n❌ ERRO FATAL: Nenhuma escala encontrada com o ID ${ID_DA_ESCALA_PARA_TESTAR}. Verifique o ID.`);
      return;
    }

    console.log('✅ Escala encontrada:', escala);
    const { primeiro_piloto_id, segundo_piloto_id } = escala;

    // 2. Buscar os dados dos pilotos separadamente
    console.log(`\n[PASSO 2] Buscando dados do 1º Piloto (ID: ${primeiro_piloto_id}) e 2º Piloto (ID: ${segundo_piloto_id})...`);

    const piloto1 = await db('militares').where({ id: primeiro_piloto_id }).select('id', 'posto_graduacao', 'nome_guerra', 'nome_completo').first();
    const piloto2 = await db('militares').where({ id: segundo_piloto_id }).select('id', 'posto_graduacao', 'nome_guerra', 'nome_completo').first();

    console.log('\n--- DADOS BRUTOS DOS PILOTOS ---');
    console.log('Dados do 1º Piloto:', piloto1);
    console.log('Dados do 2º Piloto:', piloto2);
    console.log('---------------------------------');

    // 3. Executar a consulta exata do controller
    console.log('\n[PASSO 3] Executando a consulta completa (JOIN) como no controller...');
    const resultadoQuery = await db('escala_aeronaves as ea')
      .leftJoin('aeronaves as a', 'ea.aeronave_id', 'a.id')
      .leftJoin('militares as p1', 'ea.primeiro_piloto_id', 'p1.id')
      .leftJoin('militares as p2', 'ea.segundo_piloto_id', 'p2.id')
      .where('ea.id', ID_DA_ESCALA_PARA_TESTAR)
      .select(
        'ea.id',
        'a.prefixo',
        db.raw("p1.posto_graduacao || ' ' || p1.nome_guerra as primeiro_piloto_concatenado"),
        db.raw("p2.posto_graduacao || ' ' || p2.nome_guerra as segundo_piloto_concatenado")
      )
      .first();

    console.log('\n--- RESULTADO DA CONSULTA COMPLETA ---');
    console.log(resultadoQuery);
    console.log('---------------------------------------');

    // 4. Análise e Conclusão
    console.log('\n[CONCLUSÃO]');
    if (piloto1 && (!piloto1.nome_guerra || piloto1.nome_guerra.trim() === '')) {
      console.log('   -> ❌ PROBLEMA IDENTIFICADO: O campo "nome_guerra" do 1º Piloto está vazio ou nulo no banco de dados.');
    } else if (resultadoQuery && resultadoQuery.primeiro_piloto_concatenado.trim() === piloto1.posto_graduacao.trim()) {
      console.log('   -> ❌ PROBLEMA IDENTIFICADO: A concatenação SQL está a falhar, possivelmente porque "nome_guerra" é nulo.');
    } else {
      console.log('   -> ✅ Análise do 1º Piloto parece correta.');
    }

    if (piloto2 && (!piloto2.nome_guerra || piloto2.nome_guerra.trim() === '')) {
        console.log('   -> ❌ PROBLEMA IDENTIFICADO: O campo "nome_guerra" do 2º Piloto está vazio ou nulo no banco de dados.');
    } else if (resultadoQuery && resultadoQuery.segundo_piloto_concatenado.trim() === piloto2.posto_graduacao.trim()) {
        console.log('   -> ❌ PROBLEMA IDENTIFICADO: A concatenação SQL para o 2º Piloto está a falhar, possivelmente porque "nome_guerra" é nulo.');
    } else {
        console.log('   -> ✅ Análise do 2º Piloto parece correta.');
    }

    console.log('\nCausa mais provável: O campo `nome_guerra` para os militares com IDs', `${primeiro_piloto_id} e ${segundo_piloto_id}`, 'está nulo ou vazio na tabela `militares`. A função `COALESCE` no controller é a solução para tratar isso.');


  } catch (error) {
    console.error('\n❌ [ERRO GERAL] Ocorreu um erro durante o diagnóstico!');
    console.error('Mensagem do Erro:', error.message);
  } finally {
    await db.destroy();
    console.log('\n--- FIM DO SCRIPT DE DIAGNÓSTICO ---');
  }
}

runDiagnosis();
