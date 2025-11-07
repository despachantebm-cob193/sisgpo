const request = require("supertest");
const app = require("../../src/app");

let authToken;

beforeAll(async () => {
  const response = await request(app)
    .post("/api/auth/login")
    .send({ login: "admin", senha: "cbmgo@2025" });
  authToken = response.body.token;
});

describe("Testes de Integração para a Rota /dashboard-ocorrencias", () => {
  it("GET /dashboard-ocorrencias - Deve retornar 503 quando o serviço de ocorrências está offline", async () => {
    const response = await request(app)
      .get("/api/estatisticas-externas/dashboard-ocorrencias")
      .set("Authorization", `Bearer ${authToken}`);

    expect(response.status).toBe(503);
    expect(response.body.message).toContain("Não foi possível conectar ao sistema de ocorrências");
  });
});
