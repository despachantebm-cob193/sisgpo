// Arquivo: __tests__/integration/dashboard.test.js

const request = require("supertest");
const app = require("../../src/app");
const db = require("../../src/config/database"); // Usaremos 'db' (Knex) em vez de 'pool'

let authToken;

// -- Bloco de Setup: Roda uma vez antes de todos os testes neste arquivo --
beforeAll(async () => {
  // 1. Autenticar para obter o token
  const response = await request(app)
    .post("/api/auth/login")
    .send({ login: "admin", senha: "cbmgo@2025" });

  if (response.status !== 200) {
    throw new Error("Falha no login para obter o token de teste.");
  }
  authToken = response.body.token;

  // 2. Inserir dados de teste para garantir que os endpoints retornem valores
  // Usaremos uma transação para garantir a consistência
  await db.transaction(async (trx) => {
    // Limpa dados de testes anteriores para evitar conflitos
    await trx('viaturas').del();
    await trx('militares').del();
    await trx('obms').del();

    // Insere uma OBM
    const [obm] = await trx('obms').insert({
      nome: 'Comando Geral de Teste',
      abreviatura: 'CG-TESTE',
      cidade: 'Goiânia'
    }).returning('id');

    // Insere militares de teste
    await trx('militares').insert([
      { matricula: '1111', nome_completo: 'Militar Teste 1', nome_guerra: 'Teste1', posto_graduacao: 'Soldado', ativo: true, obm_id: obm.id },
      { matricula: '2222', nome_completo: 'Militar Teste 2', nome_guerra: 'Teste2', posto_graduacao: 'Cabo', ativo: true, obm_id: obm.id },
      { matricula: '3333', nome_completo: 'Militar Teste 3', nome_guerra: 'Teste3', posto_graduacao: 'Soldado', ativo: false, obm_id: obm.id } // 1 inativo
    ]);

    // Insere viaturas de teste (usando a estrutura desnormalizada)
    await trx('viaturas').insert([
      { prefixo: 'VTR-TESTE-01', ativa: true, cidade: 'Goiânia', obm: '1º BBM', telefone: '123' },
      { prefixo: 'VTR-TESTE-02', ativa: true, cidade: 'Anápolis', obm: '2º BBM', telefone: '456' },
      { prefixo: 'VTR-TESTE-03', ativa: false, cidade: 'Goiânia', obm: '1º BBM', telefone: '789' } // 1 inativa
    ]);
  });
});

// -- Bloco de Teardown: Roda uma vez após todos os testes neste arquivo --
afterAll(async () => {
  // Limpa os dados de teste criados
  await db('viaturas').del();
  await db('militares').del();
  await db('obms').del();
});


// --- SUÍTE DE TESTES PARA O DASHBOARD ---

describe("Testes de Integração para a Rota /dashboard", () => {

  // Teste para o endpoint principal de estatísticas
  it("GET /dashboard/stats - Deve retornar as estatísticas gerais do sistema", async () => {
    const response = await request(app)
      .get("/api/admin/dashboard/stats")
      .set("Authorization", `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("total_militares_ativos", 2); // Inserimos 2 ativos
    expect(response.body).toHaveProperty("total_viaturas_disponiveis", 2); // Inserimos 2 ativas
    expect(response.body).toHaveProperty("total_obms"); // A contagem de OBMs pode variar
    expect(response.body).toHaveProperty("total_plantoes_mes");
  });

  // Teste para o endpoint de estatísticas de viaturas
  it("GET /dashboard/viatura-stats - Deve retornar a distribuição de viaturas por OBM", async () => {
    const response = await request(app)
      .get("/api/admin/dashboard/viatura-stats")
      .set("Authorization", `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThan(0); // Deve haver pelo menos um grupo

    // Verifica a estrutura do primeiro item do array
    const firstItem = response.body[0];
    expect(firstItem).toHaveProperty("name"); // ex: '1º BBM'
    expect(firstItem).toHaveProperty("value"); // ex: 1
    expect(typeof firstItem.name).toBe('string');
    expect(typeof firstItem.value).toBe('number');
  });

  // Teste para o endpoint de estatísticas de militares
  it("GET /dashboard/militar-stats - Deve retornar a distribuição de militares por posto/graduação", async () => {
    const response = await request(app)
      .get("/api/admin/dashboard/militar-stats")
      .set("Authorization", `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBe(2); // Inserimos 'Soldado' e 'Cabo'

    // Verifica a estrutura de um dos itens
    const soldadoGroup = response.body.find(item => item.name === 'Soldado');
    expect(soldadoGroup).toBeDefined();
    expect(soldadoGroup).toHaveProperty("value", 1); // Apenas 1 soldado ativo
  });
});
