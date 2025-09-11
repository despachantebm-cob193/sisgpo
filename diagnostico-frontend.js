// Arquivo: frontend/diagnostico-frontend.js (Novo Arquivo)

const axios = require('axios');

// URL do seu backend. Verifique se está correta.
const API_BASE_URL = 'http://localhost:3333';

async function runDashboardDiagnosis( ) {
  console.log('--- INICIANDO SCRIPT DE DIAGNÓSTICO DO DASHBOARD (FRONTEND) ---');
  
  const url = `${API_BASE_URL}/api/public/dashboard/servico-dia`;

  try {
    console.log(`\n[PASSO 1] Fazendo requisição para: ${url}`);

    const response = await axios.get(url);

    console.log('\n[PASSO 2] Requisição bem-sucedida! Status:', response.status);
    
    const servicoDoDia = response.data;

    console.log('\n[PASSO 3] Analisando os dados recebidos do backend...');
    console.log('-------------------------------------------------');
    console.log('Dados Brutos Recebidos:');
    console.log(servicoDoDia);
    console.log('-------------------------------------------------');

    const regulador = servicoDoDia.find(item => item.funcao === 'Regulador');

    if (regulador) {
      console.log('\n[CONCLUSÃO] ✅ SUCESSO! O backend ESTÁ enviando os dados do Regulador.');
      console.log('   -> Dados do Regulador encontrados:', regulador);
    } else {
      console.log('\n[CONCLUSÃO] ❌ FALHA! O backend NÃO ESTÁ enviando os dados do Regulador.');
      console.log('   -> Causa Provável: O erro está no `dashboardController.js` do backend ou não há dados salvos para hoje.');
    }

  } catch (error) {
    console.error('\n❌ [ERRO GERAL] A chamada para a API falhou!');
    if (error.response) {
      console.error('   -> Status do Erro:', error.response.status);
      console.error('   -> Mensagem do Erro:', error.response.data.message || 'Nenhuma mensagem de erro específica.');
    } else {
      console.error('   -> Mensagem do Erro:', error.message);
      console.error('   -> Dica: Verifique se o servidor do backend está rodando.');
    }
  } finally {
    console.log('\n--- FIM DO SCRIPT DE DIAGNÓSTICO ---');
  }
}

runDashboardDiagnosis();
