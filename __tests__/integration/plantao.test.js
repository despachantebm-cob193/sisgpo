// Arquivo: backend/__tests__/integration/plantao.test.js

const request = require("supertest");
const app = require("../../src/app");
const db = require("../../src/config/database");

let authToken;
let obmId;
let viaturaId;
let militarId1;
let militarId2;
let plantaoId;

// -- Bloco de Setup: Roda uma vez antes de todos os testes neste arquivo --
beforeAll(async () => {
  // 1. Autenticação
  const loginResponse = await request(app).post("/api/auth/login").send({ login: "admin", senha: "cbmgo@2025" });
  authToken = loginResponse.body.token;

  // 2. Criação de dados de suporte em uma única transação
  await db.transaction(async trx => {
    // OBM
    const [obm] = await trx('obms').insert({
      nome: `OBM Plantao Teste ${Date.now()}`,
      abreviatura: `PLT${Date.now().toString().slice(-5)}`,
      cidade: "Cidade Teste",
    }).returning('id');
    obmId = obm.id;

    // Viatura (com dados desnormalizados para consistência)
    const [viatura] = await trx('viaturas').insert({
      prefixo: `VTR-PLT-${Date.now()}`,
      ativa: true,
      obm: `OBM Plantao Teste ${Date.now()}`, // Usando o nome, como no schema
    }).returning('id');
    viaturaId = viatura.id;

    // Militares
    const [militar1] = await trx('militares').insert({
      matricula: `${Date.now().toString().slice(-7)}1`,
      nome_completo: "Militar de Plantao Teste 1",
      nome_guerra: "Plantao1",
      posto_graduacao: "Soldado",
      ativo: true,
      obm_id: obmId,
    }).returning('id');
    militarId1 = militar1.id;

    const [militar2] = await trx('militares').insert({
      matricula: `${Date.now().toString().slice(-7)}2`,
      nome_completo: "Militar de Plantao Teste 2",
      nome_guerra: "Plantao2",
      posto_graduacao: "Cabo",
      ativo: true,
      obm_id: obmId,
    }).returning('id');
    militarId2 = militar2.id;
  });
});

// -- Bloco de Teardown: Roda uma vez após todos os testes --
afterAll(async () => {
  // Limpeza na ordem inversa de dependência para evitar erros de chave estrangeira
  if (plantaoId) await db('plantoes').where({ id: plantaoId }).del(); // Cascade deve limpar plantoes_militares
  if (militarId1) await db('militares').where({ id: militarId1 }).del();
  if (militarId2) await db('militares').where({ id: militarId2 }).del();
  if (viaturaId) await db('viaturas').where({ id: viaturaId }).del();
  if (obmId) await db('obms').where({ id: obmId }).del();
});

describe("Testes de Integração para a Rota /plantoes", () => {
  
  it("POST /plantoes - Deve criar um novo plantão com sucesso", async () => {
    const novoPlantao = {
      data_plantao: "2025-11-10",
      viatura_id: viaturaId,
      obm_id: obmId,
      observacoes: "Teste de criação de plantão.",
      guarnicao: [{ militar_id: militarId1, funcao: "Motorista" }],
    };

    const response = await request(app)
      .post("/api/admin/plantoes")
      .set("Authorization", `Bearer ${authToken}`)
      .send(novoPlantao);

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("id");
    plantaoId = response.body.id; // Salva para os próximos testes
  });

  it("GET /plantoes/:id - Deve buscar os detalhes do plantão criado", async () => {
    expect(plantaoId).toBeDefined();

    const response = await request(app)
      .get(`/api/admin/plantoes/${plantaoId}`)
      .set("Authorization", `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(response.body.id).toBe(plantaoId);
    expect(response.body.observacoes).toBe("Teste de criação de plantão.");
    expect(response.body.guarnicao).toHaveLength(1);
    expect(response.body.guarnicao[0].militar_id).toBe(militarId1);
  });

  it("PUT /plantoes/:id - Deve atualizar um plantão e sua guarnição com sucesso", async () => {
    expect(plantaoId).toBeDefined();

    const dadosAtualizados = {
      data_plantao: "2025-11-10", // Mesma data e viatura
      viatura_id: viaturaId,
      obm_id: obmId,
      observacoes: "Observação atualizada com nova guarnição.",
      guarnicao: [
        { militar_id: militarId1, funcao: "Comandante" }, // Função atualizada
        { militar_id: militarId2, funcao: "Motorista" },   // Novo militar
      ],
    };

    const response = await request(app)
      .put(`/api/admin/plantoes/${plantaoId}`)
      .set("Authorization", `Bearer ${authToken}`)
      .send(dadosAtualizados);

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Plantão atualizado com sucesso.");

    // Verifica no banco se a guarnição foi realmente atualizada
    const guarnicaoDb = await db('plantoes_militares').where({ plantao_id: plantaoId }).orderBy('militar_id');
    expect(guarnicaoDb).toHaveLength(2);
    expect(guarnicaoDb[0].funcao).toBe("Comandante");
    expect(guarnicaoDb[1].militar_id).toBe(militarId2);
  });

  it("DELETE /plantoes/:id - Deve excluir um plantão com sucesso", async () => {
    expect(plantaoId).toBeDefined();

    const response = await request(app)
      .delete(`/api/admin/plantoes/${plantaoId}`)
      .set("Authorization", `Bearer ${authToken}`);

    expect(response.status).toBe(204);

    // Verifica se o plantão e a guarnição foram removidos
    const plantaoDb = await db('plantoes').where({ id: plantaoId }).first();
    const guarnicaoDb = await db('plantoes_militares').where({ plantao_id: plantaoId });
    
    expect(plantaoDb).toBeUndefined();
    expect(guarnicaoDb).toHaveLength(0);

    plantaoId = null; // Evita limpeza duplicada no afterAll
  });
});
