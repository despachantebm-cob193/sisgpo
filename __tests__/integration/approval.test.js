const request = require("supertest");
const app = require("../../src/app");
const db = require("../../src/config/database");

let authToken;
let adminToken;

beforeAll(async () => {
  // Login as admin to get a token
  const response = await request(app)
    .post("/api/auth/login")
    .send({ login: "admin", senha: "cbmgo@2025" });
  adminToken = response.body.token;
});

describe("User Approval Flow", () => {
  let pendingUserId;

  it("should create a new user with pending status via Google login", async () => {
    // Mock Google login
    const googleUser = {
      credential: "mock_credential",
    };

    // This is a simplified mock. In a real scenario, you would mock the Google API response.
    const response = await request(app)
      .post("/api/auth/google/callback")
      .send(googleUser);

    expect(response.status).toBe(401);
    expect(response.body.message).toBe("Sua conta está pendente de aprovação.");

    // Check if the user was created with pending status
    const user = await db("usuarios").where({ email: "user@example.com" }).first();
    expect(user).toBeDefined();
    expect(user.status).toBe("pending");
    pendingUserId = user.id;
  });

  it("should not allow a pending user to login", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({ login: "user@example.com", senha: "any_password" });

    expect(response.status).toBe(401);
    expect(response.body.message).toBe("Sua conta está pendente de aprovação.");
  });

  it("should allow an admin to list pending users", async () => {
    const response = await request(app)
      .get("/api/admin/users/pending")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.users).toBeInstanceOf(Array);
    const pendingUser = response.body.users.find(user => user.id === pendingUserId);
    expect(pendingUser).toBeDefined();
  });

  it("should allow an admin to approve a pending user", async () => {
    const response = await request(app)
      .post(`/api/admin/users/${pendingUserId}/approve`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Usuário aprovado com sucesso!");

    const user = await db("usuarios").where({ id: pendingUserId }).first();
    expect(user.status).toBe("approved");
  });

  it("should allow an approved user to login", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({ login: "user@example.com", senha: "any_password" });

    expect(response.status).toBe(200);
    expect(response.body.token).toBeDefined();
  });

  it("should allow an admin to reject a pending user", async () => {
    // Create a new pending user for this test
    const newUser = {
      nome: "Test User 2",
      nome_completo: "Test User 2",
      login: "user2@example.com",
      email: "user2@example.com",
      senha_hash: "some_hash",
      status: "pending",
      perfil_desejado: "user",
    };
    const [insertedUser] = await db("usuarios").insert(newUser).returning("*");
    const newPendingUserId = insertedUser.id;

    const response = await request(app)
      .post(`/api/admin/users/${newPendingUserId}/reject`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Usuário rejeitado com sucesso!");

    const user = await db("usuarios").where({ id: newPendingUserId }).first();
    expect(user.status).toBe("rejected");
  });

  it("should not allow a rejected user to login", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({ login: "user2@example.com", senha: "any_password" });

    expect(response.status).toBe(401);
    expect(response.body.message).toBe("Sua conta foi rejeitada.");
  });
});
