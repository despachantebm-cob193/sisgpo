// Arquivo: backend/diagnostico_codec.js

require('dotenv').config();
const db = require('./src/config/database');
const axios = require('axios');

// --- CONFIGURAÇÃO ---
// Defina a data que você quer testar. Deixe como está para usar a data de hoje.
const DATA_PARA_TESTAR = new Date().toISOString().split('T')[0];
const API_URL = 'http://localhost:3333/api/public/dashboard/escala-codec'; // URL do endpoint público

async function runCodecDiagnosis( ) {
  console.log('--- INICIANDO SCRIPT DE DIAGNÓSTICO COMPLETO DO CODEC ---');
  console.log(`Data do teste: ${DATA_PARA_TESTAR}\n`);

  let escalaDoBanco = [];
  let idsDosMilitares = [];

  try {
    // --- ETAPA 1: Diagnóstico Direto na Base de Dados ---
    console.log('--- [ETAPA 1: BANCO DE DADOS] ---');
    
    // 1.1. Buscar a escala do CODEC para a data
    console.log(`1.1: Buscando escala do CODEC para a data ${DATA_PARA_TESTAR}...`);
    escalaDoBanco = await db('escala_codec').where({ data: DATA_PARA_TESTAR });

    if (escalaDoBanco.length === 0) {
      console.error(`\n❌ CONCLUSÃO PRELIMINAR: Nenhuma escala do CODEC encontrada para a data ${DATA_PARA_TESTAR} no banco de dados.`);
      console.log('   -> Causa provável: Os dados não foram inseridos ou foram apagados. Execute o seed novamente (`npm run knex -- seed:run`).');
      return;
    }

    console.log('✅ Escala encontrada no banco:', escalaDoBanco);
    idsDosMilitares = escalaDoBanco.map(e => e.militar_id);

    // 1.2. Buscar os dados dos militares envolvidos
    console.log(`\n1.2: Buscando dados dos militares com IDs: ${idsDosMilitares.join(', ')}...`);
    const militares = await db('militares')
      .whereIn('id', idsDosMilitares)
      .select('id', 'posto_graduacao', 'nome_guerra', 'nome_completo');

    if (militares.length === 0) {
        console.error('\n❌ ERRO: A escala existe, mas os militares com os IDs correspondentes não foram encontrados na tabela `militares`.');
        return;
    }

    console.log('✅ Dados brutos dos militares encontrados:');
    console.table(militares);

    // 1.3. Análise dos dados dos militares
    const militaresComProblema = militares.filter(m => !m.nome_guerra || m.nome_guerra.trim() === '');
    if (militaresComProblema.length > 0) {
        console.warn('\n⚠️ ALERTA: Os seguintes militares têm o campo "nome_guerra" vazio ou nulo:');
        console.table(militaresComProblema.map(m => ({ id: m.id, nome_completo: m.nome_completo })));
        console.log('   -> Isto é a causa mais provável do problema.');
    } else {
        console.log('✅ Todos os militares escalados possuem o campo "nome_guerra" preenchido.');
    }

    // --- ETAPA 2: Diagnóstico da Resposta da API ---
    console.log('\n\n--- [ETAPA 2: API] ---');
    console.log(`2.1: Fazendo uma requisição GET para ${API_URL}...`);
    
    let apiResponse;
    try {
        const response = await axios.get(API_URL);
        apiResponse = response.data;
        console.log('✅ API respondeu com sucesso (status 200).');
    } catch (error) {
        console.error(`\n❌ ERRO NA API: A requisição para ${API_URL} falhou.`);
        console.error('   -> Status:', error.response?.status);
        console.error('   -> Mensagem:', error.response?.data?.message || error.message);
        return;
    }

    console.log('\n2.2: Dados recebidos da API:');
    console.table(apiResponse);

    // --- ETAPA 3: Conclusão Final ---
    console.log('\n\n--- [ETAPA 3: CONCLUSÃO FINAL] ---');
    
    const primeiroPlantonistaApi = apiResponse.find(p => p.ordem_plantonista === 1);
    const primeiroPlantonistaDb = militares.find(m => m.id === escalaDoBanco.find(e => e.ordem_plantonista === 1)?.militar_id);

    if (!primeiroPlantonistaApi || !primeiroPlantonistaDb) {
        console.error('❌ Não foi possível comparar os dados da API e do Banco.');
        return;
    }

    const nomeEsperado = `${primeiroPlantonistaDb.posto_graduacao} ${primeiroPlantonistaDb.nome_guerra || primeiroPlantonistaDb.nome_completo}`;
    const nomeRecebido = primeiroPlantonistaApi.nome_plantonista;

    console.log(`- Nome esperado (montado a partir dos dados do banco): "${nomeEsperado}"`);
    console.log(`- Nome recebido (vindo da API):                     "${nomeRecebido}"`);

    if (nomeRecebido.trim() === primeiroPlantonistaDb.posto_graduacao.trim()) {
        console.log('\n❌ DIAGNÓSTICO: CONFIRMADO! A API está a devolver apenas o Posto/Graduação.');
        console.log('   -> Causa 1: O campo `nome_guerra` está NULO no banco de dados para estes militares.');
        console.log('   -> Causa 2: A consulta no `dashboardController.js` ainda está incorreta e não usa `COALESCE` para tratar nomes de guerra nulos.');
        console.log('\n   -> AÇÃO RECOMENDADA: Verifique a tabela de militares e preencha os nomes de guerra em falta. Em seguida, garanta que o `dashboardController.js` está com a última versão que enviei.');
    } else if (nomeRecebido.trim() === nomeEsperado.trim()) {
        console.log('\n✅ DIAGNÓSTICO: A API está a devolver os dados CORRETAMENTE.');
        console.log('   -> Causa provável: O problema pode ser um cache no frontend ou o componente `CodecCard.tsx` não está a renderizar a propriedade `nome_plantonista` corretamente.');
    } else {
        console.log('\n🤔 DIAGNÓSTICO: Inconsistência encontrada, mas a causa não é clara. Os dados da API não correspondem ao esperado.');
    }

  } catch (error) {
    console.error('\n❌ [ERRO GERAL] Ocorreu um erro inesperado durante o diagnóstico!');
    console.error('   -> Mensagem:', error.message);
  } finally {
    await db.destroy();
    console.log('\n--- FIM DO SCRIPT ---');
  }
}

runCodecDiagnosis();
