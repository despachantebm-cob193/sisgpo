// Arquivo: backend/__tests__/integration/dashboard.test.js (Versão Final e Completa)

const request = require("supertest");
const app = require("../../src/app");
const db = require("../../src/config/database");

let authToken;

// -- Bloco de Setup: Roda uma vez antes de todos os testes neste arquivo --
beforeAll(async () => {
  // 1. Autenticar para obter o token
  const response = await request(app)
    .post("/api/auth/login")
    .send({ login: "admin", senha: "cbmgo@2025" });
  authToken = response.body.token;

  // 2. Inserir dados de teste para garantir que os endpoints retornem valores
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
      { matricula: 'DASH1111', nome_completo: 'Militar Dashboard 1', nome_guerra: 'Dash1', posto_graduacao: 'Soldado', ativo: true, obm_id: obm.id },
      { matricula: 'DASH2222', nome_completo: 'Militar Dashboard 2', nome_guerra: 'Dash2', posto_graduacao: 'Cabo', ativo: true, obm_id: obm.id },
      { matricula: 'DASH3333', nome_completo: 'Militar Dashboard 3', nome_guerra: 'Dash3', posto_graduacao: 'Soldado', ativo: false, obm_id: obm.id } // 1 inativo
    ]);

    // Insere viaturas de teste (usando a estrutura desnormalizada)
    await trx('viaturas').insert([
      { prefixo: 'VTR-DASH-01', ativa: true, cidade: 'Goiânia', obm: '1º BBM', telefone: '123' },
      { prefixo: 'VTR-DASH-02', ativa: true, cidade: 'Anápolis', obm: '2º BBM', telefone: '456' },
      { prefixo: 'VTR-DASH-03', ativa: false, cidade: 'Goiânia', obm: '1º BBM', telefone: '789' } // 1 inativa
    ]);
  });
});

// -- Bloco de Teardown: Roda uma vez após todos os testes --
afterAll(async () => {
  // Limpa os dados de teste criados
  await db('viaturas').where('prefixo', 'like', 'VTR-DASH-%').del();
  await db('militares').where('matricula', 'like', 'DASH%').del();
  await db('obms').where('abreviatura', 'CG-TESTE').del();
});


// --- SUÍTE DE TESTES PARA O DASHBOARD ---

describe("Testes de Integração para a Rota /dashboard", () => {

  it("GET /dashboard/stats - Deve retornar as estatísticas gerais do sistema", async () => {
    const response = await request(app)
      .get("/api/admin/dashboard/stats")
      .set("Authorization", `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    // Verifica se os valores correspondem aos dados inseridos no setup
    expect(response.body.total_militares_ativos).toBe(2);
    expect(response.body.total_viaturas_disponiveis).toBe(2);
    expect(response.body).toHaveProperty("total_obms");
    expect(response.body).toHaveProperty("total_plantoes_mes");
  });

  it("GET /dashboard/viatura-stats - Deve retornar a distribuição de viaturas por OBM", async () => {
    const response = await request(app)
      .get("/api/admin/dashboard/viatura-stats")
      .set("Authorization", `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    // Esperamos 2 grupos de OBMs ativas ('1º BBM' e '2º BBM')
    expect(response.body).toHaveLength(2); 

    const obm1 = response.body.find(item => item.name === '1º BBM');
    const obm2 = response.body.find(item => item.name === '2º BBM');
    
    expect(obm1).toBeDefined();
    expect(obm1.value).toBe(1); // Apenas 1 viatura ativa no '1º BBM'
    expect(obm2).toBeDefined();
    expect(obm2.value).toBe(1);
  });

  it("GET /dashboard/militar-stats - Deve retornar a distribuição de militares por posto/graduação", async () => {
    const response = await request(app)
      .get("/api/admin/dashboard/militar-stats")
      .set("Authorization", `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    // Esperamos 2 grupos de postos/graduações ('Soldado' e 'Cabo')
    expect(response.body).toHaveLength(2);

    const soldadoGroup = response.body.find(item => item.name === 'Soldado');
    const caboGroup = response.body.find(item => item.name === 'Cabo');

    expect(soldadoGroup).toBeDefined();
    expect(soldadoGroup.value).toBe(1); // Apenas 1 soldado ativo
    expect(caboGroup).toBeDefined();
    expect(caboGroup.value).toBe(1);
  });
});
