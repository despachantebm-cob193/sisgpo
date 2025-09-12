// Arquivo: backend/__tests__/integration/dashboard.test.js
const request = require("supertest");
const app = require("../../src/app");
const db = require("../../src/config/database");

let authToken;

// -- Bloco de Setup --
beforeAll(async () => {
  const response = await request(app)
    .post("/api/auth/login")
    .send({ login: "admin", senha: "cbmgo@2025" });
  authToken = response.body.token;

  await db.transaction(async (trx) => {
    await trx('viaturas').del();
    await trx('militares').del();
    await trx('obms').del();

    const [obm] = await trx('obms').insert({
      nome: 'Comando Geral de Teste',
      abreviatura: 'CG-TESTE',
      cidade: 'Goiânia'
    }).returning('id');

    await trx('militares').insert([
      { matricula: 'DASH1111', nome_completo: 'Militar Dashboard 1', nome_guerra: 'Dash1', posto_graduacao: 'Soldado', ativo: true, obm_id: obm.id },
      { matricula: 'DASH2222', nome_completo: 'Militar Dashboard 2', nome_guerra: 'Dash2', posto_graduacao: 'Cabo', ativo: true, obm_id: obm.id },
      { matricula: 'DASH3333', nome_completo: 'Militar Dashboard 3', nome_guerra: 'Dash3', posto_graduacao: 'Soldado', ativo: false, obm_id: obm.id }
    ]);

    await trx('viaturas').insert([
      { prefixo: 'VTR-DASH-01', ativa: true, cidade: 'Goiânia', obm: '1º BBM', telefone: '123' },
      { prefixo: 'VTR-DASH-02', ativa: true, cidade: 'Anápolis', obm: '2º BBM', telefone: '456' },
      { prefixo: 'VTR-DASH-03', ativa: false, cidade: 'Goiânia', obm: '1º BBM', telefone: '789' }
    ]);
  });
});

// -- Bloco de Teardown --
afterAll(async () => {
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
    expect(response.body.total_militares_ativos).toBe(2);
    expect(response.body.total_viaturas_disponiveis).toBe(2);
    expect(response.body).toHaveProperty("total_obms");
    expect(response.body).toHaveProperty("total_plantoes_mes");
  });

  // --- CORREÇÃO APLICADA AQUI ---
  it("GET /dashboard/viatura-stats-por-tipo - Deve retornar a distribuição de viaturas por tipo", async () => {
    const response = await request(app)
      .get("/api/admin/dashboard/viatura-stats-por-tipo") // URL corrigida
      .set("Authorization", `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    
    // A lógica de verificação foi ajustada para o novo retorno (agrupado por tipo)
    const vtrGroup = response.body.find(item => item.name === 'VTR');
    expect(vtrGroup).toBeDefined();
    expect(vtrGroup.value).toBe(2); // Espera 2 viaturas ativas do tipo VTR
  });
  // ---------------------------------

  it("GET /dashboard/militar-stats - Deve retornar a distribuição de militares por posto/graduação", async () => {
    const response = await request(app)
      .get("/api/admin/dashboard/militar-stats")
      .set("Authorization", `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body).toHaveLength(2);

    const soldadoGroup = response.body.find(item => item.name === 'Soldado');
    const caboGroup = response.body.find(item => item.name === 'Cabo');

    expect(soldadoGroup).toBeDefined();
    expect(soldadoGroup.value).toBe(1);
    expect(caboGroup).toBeDefined();
    expect(caboGroup.value).toBe(1);
  });
});
