// Arquivo: diagnostico-aeronave.js

require('dotenv').config();
const axios = require('axios');
const jwt = require('jsonwebtoken');

// --- CONFIGURAÇÕES ---
const API_BASE_URL = 'http://localhost:3333'; // Certifique-se que a porta está correta
const ADMIN_USER = { login: 'admin', senha: 'cbmgo@2025' };

// --- SCRIPT DE DIAGNÓSTICO ---

async function runAeronaveFormDiagnosis( ) {
  console.log('--- INICIANDO DIAGNÓSTICO DO FORMULÁRIO DE ESCALA DE AERONAVE ---');
  let token;

  // 1. Obter token de autenticação
  try {
    console.log('\n[PASSO 1] Autenticando para obter token...');
    const response = await axios.post(`${API_BASE_URL}/api/auth/login`, ADMIN_USER);
    token = response.data.token;
    if (!token) throw new Error('Token não recebido.');
    console.log('✅ SUCESSO: Token de autenticação obtido.');
  } catch (error) {
    console.error('❌ FALHA CRÍTICA: Não foi possível obter o token de autenticação.');
    console.error('   -> Mensagem:', error.response?.data?.message || error.message);
    return; // Encerra se não conseguir logar
  }

  const headers = { Authorization: `Bearer ${token}` };

  // 2. Testar a rota de busca de aeronaves
  try {
    const rotaAeronaves = '/api/admin/viaturas/aeronaves?term=';
    console.log(`\n[PASSO 2] Testando rota de busca de AERONAVES: GET ${rotaAeronaves}`);
    const aeronavesResponse = await axios.get(`${API_BASE_URL}${rotaAeronaves}`, { headers });
    console.log(`✅ SUCESSO: Rota de aeronaves respondeu com status ${aeronavesResponse.status}.`);
  } catch (error) {
    console.error(`❌ FALHA: A rota de busca de AERONAVES falhou.`);
    if (error.response) {
      console.error(`   -> Status: ${error.response.status}`);
      console.error(`   -> Mensagem: ${error.response.data?.message || 'Sem mensagem específica.'}`);
    } else {
      console.error(`   -> Erro: ${error.message}`);
    }
  }

  // 3. Testar a rota de busca de militares (pilotos)
  try {
    const rotaMilitares = '/api/admin/militares/search?term=teste';
    console.log(`\n[PASSO 3] Testando rota de busca de PILOTOS: GET ${rotaMilitares}`);
    const militaresResponse = await axios.get(`${API_BASE_URL}${rotaMilitares}`, { headers });
    console.log(`✅ SUCESSO: Rota de militares respondeu com status ${militaresResponse.status}.`);
  } catch (error) {
    console.error(`❌ FALHA: A rota de busca de PILOTOS falhou.`);
    if (error.response) {
      console.error(`   -> Status: ${error.response.status}`);
      console.error(`   -> Mensagem: ${error.response.data?.message || 'Sem mensagem específica.'}`);
    } else {
      console.error(`   -> Erro: ${error.message}`);
    }
  }

  console.log('\n--- FIM DO DIAGNÓSTICO ---');
}

runAeronaveFormDiagnosis();
