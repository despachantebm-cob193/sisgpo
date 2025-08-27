const request = require("supertest");
const app = require("../../src/app");

let authToken;

beforeAll(async () => {
  // Realiza o login para obter um token válido antes de todos os testes
  const response = await request(app)
    .post("/api/admin/login")
    .send({
      login: "admin", // Credencial de teste
      senha: "cbmgo@2025" // Credencial de teste
    });

  if (response.status !== 200) {
    throw new Error("Falha no login para obter o token de teste. Verifique as credenciais.");
  }
  authToken = response.body.token;
});

describe("Testes de Integração para a Rota /dashboard", () => {
  it("GET /dashboard/stats - Deve retornar as estatísticas do sistema com sucesso", async () => {
    const response = await request(app)
      .get("/api/admin/dashboard/stats")
      .set("Authorization", `Bearer ${authToken}`);

    // Valida o status da resposta
    expect(response.status).toBe(200);

    // Valida a estrutura do corpo da resposta
    // Ajustado para snake_case, conforme a resposta da API
    expect(response.body).toHaveProperty("total_militares_ativos");
    expect(response.body).toHaveProperty("total_viaturas_disponiveis");
    expect(response.body).toHaveProperty("total_obms");
    expect(response.body).toHaveProperty("total_plantoes_mes");

    // Valida se os valores são números (inteiros, não negativos)
    expect(typeof response.body.total_militares_ativos).toBe("number");
    expect(response.body.total_militares_ativos).toBeGreaterThanOrEqual(0);
    
    expect(typeof response.body.total_viaturas_disponiveis).toBe("number");
    expect(response.body.total_viaturas_disponiveis).toBeGreaterThanOrEqual(0);

    expect(typeof response.body.total_obms).toBe("number");
    expect(response.body.total_obms).toBeGreaterThanOrEqual(0);

    expect(typeof response.body.total_plantoes_mes).toBe("number");
    expect(response.body.total_plantoes_mes).toBeGreaterThanOrEqual(0);
  });
});
