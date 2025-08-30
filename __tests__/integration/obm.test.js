const request = require("supertest");
const app = require("../../src/app");
const pool = require("../../src/config/database");

let authToken;
let obmId;
let viaturaId;
let militarId;
let outroMilitarId; // Para testar a atualização da guarnição
let plantaoId;

beforeAll(async () => {
  // Autenticação
  const loginResponse = await request(app).post("/api/admin/login").send({ login: "admin", senha: "cbmgo@2025" });
  authToken = loginResponse.body.token;

  // Criação de OBM
  const obmResponse = await request(app).post("/api/admin/obms").set("Authorization", `Bearer ${authToken}`).send({
    nome: `OBM Plantao Teste ${Date.now()}`,
    abreviatura: `PLT${Date.now().toString().slice(-5)}`,
    cidade: "Cidade Teste",
  });
  obmId = obmResponse.body.id;

  // Criação de Viatura
  const viaturaResponse = await request(app).post("/api/admin/viaturas").set("Authorization", `Bearer ${authToken}`).send({
    prefixo: `VTR-PLT-${Date.now()}`,
    placa: `PLT${Date.now().toString().slice(-4)}`,
    tipo: "UR",
    obm_id: obmId,
  });
  viaturaId = viaturaResponse.body.id;

  // Criação de Militares
  const militar1Response = await request(app).post("/api/admin/militares").set("Authorization", `Bearer ${authToken}`).send({
    matricula: `${Date.now().toString().slice(-7)}1`,
    nome_completo: "Militar de Plantao Teste 1",
    nome_guerra: "Plantao1",
    posto_graduacao: "Soldado",
    ativo: true,
    obm_id: obmId,
  });
  militarId = militar1Response.body.id;

  const militar2Response = await request(app).post("/api/admin/militares").set("Authorization", `Bearer ${authToken}`).send({
    matricula: `${Date.now().toString().slice(-7)}2`,
    nome_completo: "Militar de Plantao Teste 2",
    nome_guerra: "Plantao2",
    posto_graduacao: "Cabo",
    ativo: true,
    obm_id: obmId,
  });
  outroMilitarId = militar2Response.body.id;
});

afterAll(async () => {
  // Limpeza na ordem inversa de dependência
  if (plantaoId) await pool.query("DELETE FROM plantoes WHERE id = $1", [plantaoId]);
  if (militarId) await pool.query("DELETE FROM militares WHERE id = $1", [militarId]);
  if (outroMilitarId) await pool.query("DELETE FROM militares WHERE id = $1", [outroMilitarId]);
  if (viaturaId) await pool.query("DELETE FROM viaturas WHERE id = $1", [viaturaId]);
  if (obmId) await pool.query("DELETE FROM obms WHERE id = $1", [obmId]);
});

describe("Testes de Integração para a Rota /plantoes", () => {
  // ... (testes de POST e GET já existentes) ...

  it("PUT /plantoes/:id - Deve atualizar um plantão e sua guarnição com sucesso", async () => {
    // Cria um plantão inicial para ser atualizado
    const plantaoInicial = {
      data_plantao: "2025-12-01",
      viatura_id: viaturaId,
      obm_id: obmId,
      guarnicao: [{ militar_id: militarId, funcao: "Motorista" }],
    };
    const createResponse = await request(app).post("/api/admin/plantoes").set("Authorization", `Bearer ${authToken}`).send(plantaoInicial);
    const idParaAtualizar = createResponse.body.id;

    // Dados para a atualização
    const dadosAtualizados = {
      ...plantaoInicial,
      observacoes: "Observação atualizada.",
      guarnicao: [ // Guarnição modificada
        { militar_id: militarId, funcao: "Comandante" },
        { militar_id: outroMilitarId, funcao: "Motorista" },
      ],
    };

    const response = await request(app)
      .put(`/api/admin/plantoes/${idParaAtualizar}`)
      .set("Authorization", `Bearer ${authToken}`)
      .send(dadosAtualizados);

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Plantão atualizado com sucesso.");

    // Verifica no banco se a guarnição foi realmente atualizada
    const guarnicaoDb = await pool.query("SELECT * FROM plantoes_militares WHERE plantao_id = $1", [idParaAtualizar]);
    expect(guarnicaoDb.rowCount).toBe(2);

    // Limpa o plantão criado
    await pool.query("DELETE FROM plantoes WHERE id = $1", [idParaAtualizar]);
  });

  it("DELETE /plantoes/:id - Deve excluir um plantão com sucesso", async () => {
    // Cria um plantão para ser excluído
    const plantaoParaExcluir = {
      data_plantao: "2025-12-25",
      viatura_id: viaturaId,
      obm_id: obmId,
      guarnicao: [{ militar_id: militarId, funcao: "Ajudante" }],
    };
    const createResponse = await request(app).post("/api/admin/plantoes").set("Authorization", `Bearer ${authToken}`).send(plantaoParaExcluir);
    const idParaExcluir = createResponse.body.id;

    const response = await request(app)
      .delete(`/api/admin/plantoes/${idParaExcluir}`)
      .set("Authorization", `Bearer ${authToken}`);

    expect(response.status).toBe(204);

    // Verifica se o plantão e a guarnição foram removidos
    const plantaoDb = await pool.query("SELECT * FROM plantoes WHERE id = $1", [idParaExcluir]);
    const guarnicaoDb = await pool.query("SELECT * FROM plantoes_militares WHERE plantao_id = $1", [idParaExcluir]);
    expect(plantaoDb.rowCount).toBe(0);
    expect(guarnicaoDb.rowCount).toBe(0);
  });
});
