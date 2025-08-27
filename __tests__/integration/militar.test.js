const request = require("supertest");
const app = require("../../src/app");
const pool = require("../../src/config/database");

let authToken;
let militarId;
let obmIdForMilitarTest;

beforeAll(async () => {
  const loginResponse = await request(app).post("/api/admin/login").send({ login: "admin", senha: "cbmgo@2025" });
  if (loginResponse.status !== 200) {
    throw new Error("Falha no login para obter o token de teste. Verifique as credenciais.");
  }
  authToken = loginResponse.body.token;

  const uniqueSuffix = Date.now();
  const newObm = {
    nome: `OBM Teste para Militar ${uniqueSuffix}`,
    abreviatura: `OTM${String(uniqueSuffix).slice(-7)}`,
    cidade: "Cidade Teste",
  };
  const obmResponse = await request(app).post("/api/admin/obms").set("Authorization", `Bearer ${authToken}`).send(newObm);
  obmIdForMilitarTest = obmResponse.body.id;
});

afterAll(async () => {
  if (militarId) {
    await pool.query("DELETE FROM militares WHERE id = $1", [militarId]);
  }
  if (obmIdForMilitarTest) {
    await pool.query("DELETE FROM obms WHERE id = $1", [obmIdForMilitarTest]);
  }
});

describe("Testes de Integração para a Rota /militares", () => {
  it("POST /militares - Deve criar um novo militar com sucesso", async () => {
    const novoMilitar = {
      matricula: "1234567",
      nome_completo: "Militar Teste Completo",
      nome_guerra: "Guerra Teste",
      posto_graduacao: "Soldado Teste",
      ativo: true,
      obm_id: obmIdForMilitarTest,
    };

    const response = await request(app).post("/api/admin/militares").set("Authorization", `Bearer ${authToken}`).send(novoMilitar);
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("id");
    militarId = response.body.id;
  });
});
