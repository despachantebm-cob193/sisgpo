const request = require("supertest");
const app = require("../../src/app");
const pool = require("../../src/config/database"); // Importar o pool para interagir com o DB

let authToken;
let militarId;
let obmIdForMilitarTest; // Variável para armazenar o ID da OBM criada para o teste de militar
let matriculaDoMilitarCriado; // Variável para armazenar a matrícula do militar criado

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

  // Gerar um nome e abreviatura únicos para a OBM de teste
  const uniqueSuffix = Date.now();
  const newObm = {
    nome: `OBM Teste para Militar ${uniqueSuffix}`,
          abreviatura: `OTM${String(uniqueSuffix).slice(-7)}`, // Garante no máximo 10 caracteres (3 de OTM + 7 do timestamp)
    cidade: "Cidade Teste", // Campo 'cidade' é opcional, mas pode ser fornecido
  };
  const obmResponse = await request(app)
    .post("/api/admin/obms")
    .set("Authorization", `Bearer ${authToken}`)
    .send(newObm);

  if (obmResponse.status !== 201) {
    throw new Error("Falha ao criar OBM para teste de militar: " + (obmResponse.body.message || obmResponse.text));
  }
  obmIdForMilitarTest = obmResponse.body.id;
});

afterAll(async () => {
  // Limpar a OBM criada após todos os testes de militar
  if (obmIdForMilitarTest) {
    await pool.query("DELETE FROM obms WHERE id = $1", [obmIdForMilitarTest]);
  }
});

describe("Testes de Integração para a Rota /militares", () => {
  it("POST /militares - Deve criar um novo militar com sucesso", async () => {
    matriculaDoMilitarCriado = "1234567";
    const novoMilitar = {
      matricula: "1234567",
      nome_completo: "Militar Teste Completo",
      nome_guerra: "Guerra Teste",
      posto_graduacao: "Soldado Teste",
      ativo: true,
      obm_id: obmIdForMilitarTest, // Usar o ID da OBM criada
    };

    const response = await request(app)
      .post("/api/admin/militares")
      .set("Authorization", `Bearer ${authToken}`)
      .send(novoMilitar);

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("id");
    militarId = response.body.id;
  });

  it("POST /militares - Deve retornar erro 409 ao tentar criar militar com matrícula duplicada", async () => {
    const militarDuplicado = {
      matricula: "1234567", // Usar a mesma matrícula do teste anterior
      nome_completo: "Militar Duplicado Completo",
      nome_guerra: "Duplicado",
      posto_graduacao: "Cabo",
      ativo: true,
      obm_id: obmIdForMilitarTest,
    };

    const response = await request(app)
      .post("/api/admin/militares")
      .set("Authorization", `Bearer ${authToken}`)
      .send(militarDuplicado);

    expect(response.status).toBe(409);
  });

  it("PUT /militares/:id - Deve retornar erro 409 ao tentar usar uma matrícula que já existe", async () => {
    const dadosComConflito = {
      matricula: "1234567", // Usar a mesma matrícula do teste anterior
      nome_completo: "Militar Conflito",
      nome_guerra: "Conflito",
      posto_graduacao: "Sargento",
      ativo: true,
      obm_id: obmIdForMilitarTest,
    };

    const response = await request(app)
      .put(`/api/admin/militares/${militarId}`)
      .set("Authorization", `Bearer ${authToken}`)
      .send(dadosComConflito);

    expect(response.status).toBe(409);
    expect(response.body.message).toBe("A nova matrícula já está em uso por outro militar.");
  });

  it("PUT /militares/:id - Deve atualizar um militar com sucesso (sem alterar a matrícula)", async () => {
    const dadosAtualizados = {
      matricula: `7654321-${Date.now()}`,
      nome_completo: "Militar Atualizado",
      nome_guerra: "Atualizado",
      posto_graduacao: "3º Sargento",
      ativo: false,
      obm_id: obmIdForMilitarTest,
    };

    const response = await request(app)
      .put(`/api/admin/militares/${militarId}`)
      .set("Authorization", `Bearer ${authToken}`)
      .send(dadosAtualizados);

    expect(response.status).toBe(200);
    expect(response.body.posto_graduacao).toBe("3º Sargento");
  });

  it("DELETE /militares/:id - Deve excluir um militar com sucesso", async () => {
    const response = await request(app)
      .delete(`/api/admin/militares/${militarId}`)
      .set("Authorization", `Bearer ${authToken}`);

    expect(response.status).toBe(204);
  });
});