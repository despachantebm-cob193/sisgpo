// Arquivo: frontend/diagnostico-dashboard.js (Novo Arquivo)

// Importa o Axios para fazer a chamada de API
const axios = require('axios');

// --- CONFIGURAÇÃO ---
// Certifique-se de que esta URL corresponde à URL do seu backend em desenvolvimento
const API_BASE_URL = 'http://localhost:3333';
// --------------------

async function runDashboardDiagnosis( ) {
  console.log('--- INICIANDO SCRIPT DE DIAGNÓSTICO DO DASHBOARD ---');
  
  const url = `${API_BASE_URL}/api/public/dashboard/servico-dia`;

  try {
    console.log(`\n[PASSO 1] Fazendo uma requisição GET para a rota do dashboard:`);
    console.log(`   -> ${url}`);

    // Faz a chamada para a API, exatamente como o frontend faria
    const response = await axios.get(url);

    console.log('\n[PASSO 2] Requisição bem-sucedida! Status:', response.status);
    
    const servicoDoDia = response.data;

    console.log('\n[PASSO 3] Analisando os dados recebidos do backend...');
    console.log('-------------------------------------------------');
    console.log('Dados Brutos Recebidos:');
    console.log(servicoDoDia);
    console.log('-------------------------------------------------');

    // Procura especificamente por um registro com a função "Regulador"
    const regulador = servicoDoDia.find(item => item.funcao === 'Regulador');

    if (regulador) {
      console.log('\n[CONCLUSÃO] ✅ SUCESSO! O backend ESTÁ enviando os dados do Regulador.');
      console.log('   -> Dados do Regulador encontrados:', regulador);
      console.log('\n   -> Causa Provável do Problema: O erro está no componente do frontend (`ServicoDiaCard.tsx`), que não está conseguindo renderizar os dados recebidos.');
    } else {
      console.log('\n[CONCLUSÃO] ❌ FALHA! O backend NÃO ESTÁ enviando os dados do Regulador.');
      console.log('   -> Causa Provável do Problema: O erro persiste no `dashboardController.js` do backend ou não há dados de regulador salvos para a data de hoje no banco de dados.');
      console.log('   -> Próximo Passo: Execute novamente o script `diagnostico.js` no backend para verificar o banco de dados diretamente.');
    }

  } catch (error) {
    console.error('\n❌ [ERRO GERAL] A chamada para a API falhou!');
    if (error.response) {
      console.error('   -> Status do Erro:', error.response.status);
      console.error('   -> Mensagem do Erro:', error.response.data.message || 'Nenhuma mensagem de erro específica.');
    } else {
      console.error('   -> Mensagem do Erro:', error.message);
      console.error('   -> Dica: Verifique se o servidor do backend está rodando na URL correta e se não há erros de CORS no console do backend.');
    }
  } finally {
    console.log('\n--- FIM DO SCRIPT DE DIAGNÓSTICO ---');
  }
}

// Executa a função de diagnóstico
runDashboardDiagnosis();
