// Arquivo: backend/__tests__/integration/militar.test.js (Com CRUD completo)

const request = require("supertest");
const app = require("../../src/app");
const db = require("../../src/config/database");

let authToken;
let obmIdForMilitarTest;
let militarId; 

beforeAll(async () => {
  const response = await request(app)
    .post("/api/auth/login")
    .send({ login: "admin", senha: "cbmgo@2025" });
  authToken = response.body.token;

  // Cria uma OBM para os testes de militar
  const [obm] = await db('obms').insert({
    nome: `OBM para Teste de Militar ${Date.now()}`,
    abreviatura: `OTM${String(Date.now()).slice(-7)}`,
    cidade: "Cidade Teste",
  }).returning('id');
  obmIdForMilitarTest = obm.id;
});

afterAll(async () => {
  // Limpa os dados criados em ordem de dependência
  if (militarId) await db('militares').where({ id: militarId }).del();
  if (obmIdForMilitarTest) await db('obms').where({ id: obmIdForMilitarTest }).del();
});

describe("Testes de Integração para a Rota /militares", () => {
  
  const matriculaUnica = `MIL-${Date.now()}`;
  const novoMilitar = {
    matricula: matriculaUnica,
    nome_completo: "Militar de Teste Completo",
    nome_guerra: "Guerra Teste",
    posto_graduacao: "Soldado de Teste",
    ativo: true,
    obm_id: null, // Será definido dinamicamente
  };

  it("POST /militares - Deve criar um novo militar com sucesso", async () => {
    novoMilitar.obm_id = obmIdForMilitarTest;

    const response = await request(app)
      .post("/api/admin/militares")
      .set("Authorization", `Bearer ${authToken}`)
      .send(novoMilitar);

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("id");
    militarId = response.body.id; 
  });

  it("PUT /militares/:id - Deve atualizar o militar criado anteriormente", async () => {
    expect(militarId).toBeDefined(); 

    const dadosAtualizados = {
      nome_completo: "Militar Atualizado",
      nome_guerra: "Guerra Atualizado",
      posto_graduacao: "Cabo de Teste",
      ativo: false,
      obm_id: obmIdForMilitarTest,
    };

    const response = await request(app)
      .put(`/api/admin/militares/${militarId}`)
      .set("Authorization", `Bearer ${authToken}`)
      .send(dadosAtualizados);

    expect(response.status).toBe(200);
    expect(response.body.posto_graduacao).toBe("Cabo de Teste");
    expect(response.body.ativo).toBe(false);
  });

  it("DELETE /militares/:id - Deve excluir o militar criado", async () => {
    expect(militarId).toBeDefined();

    const response = await request(app)
      .delete(`/api/admin/militares/${militarId}`)
      .set("Authorization", `Bearer ${authToken}`);

    expect(response.status).toBe(204);

    const militarNoDb = await db('militares').where({ id: militarId }).first();
    expect(militarNoDb).toBeUndefined();
    militarId = null; // Evita limpeza duplicada no afterAll
  });
});
