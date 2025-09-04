// Arquivo: backend/__tests__/integration/obm.test.js (Atualizado)

const request = require('supertest');
const app = require('../../src/app');
const db = require('../../src/config/database');

let authToken;
let obmId;

beforeAll(async () => {
  const response = await request(app).post('/api/auth/login').send({ login: 'admin', senha: 'cbmgo@2025' });
  if (response.status !== 200) {
    throw new Error('Login para teste de OBM falhou: ' + (response.body.message || response.text));
  }
  authToken = response.body.token;
});

afterAll(async () => {
  // Garante que a OBM de teste seja limpa mesmo se um teste falhar
  if (obmId) {
    await db('obms').where({ id: obmId }).del();
  }
});

describe('Testes de Integração para a Rota /obms', () => {
  it('POST /obms - Deve criar uma nova OBM com sucesso', async () => {
    const novaObm = {
      nome: `Batalhão de Teste OBM ${Date.now()}`,
      abreviatura: `OBM-T${Date.now().toString().slice(-5)}`,
      cidade: 'Goiânia',
      telefone: '62999999999'
    };

    const response = await request(app)
      .post('/api/admin/obms')
      .set('Authorization', `Bearer ${authToken}`)
      .send(novaObm);
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    obmId = response.body.id; // Salva o ID para os próximos testes
  });

  it('PUT /obms/:id - Deve atualizar uma OBM existente com sucesso', async () => {
    const dadosAtualizados = {
      nome: 'Batalhão de Bombeiro Militar Atualizado',
      abreviatura: `OBM-UPD${Date.now().toString().slice(-5)}`,
      cidade: 'Goiânia-GO',
      telefone: '62888888888',
    };

    const response = await request(app)
      .put(`/api/admin/obms/${obmId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send(dadosAtualizados);

    expect(response.status).toBe(200);
    expect(response.body.nome).toBe(dadosAtualizados.nome);
    expect(response.body.telefone).toBe(dadosAtualizados.telefone);
  });

  it('DELETE /obms/:id - Deve excluir uma OBM com sucesso', async () => {
    const response = await request(app)
      .delete(`/api/admin/obms/${obmId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(204);

    // Verifica se a OBM foi realmente removida do banco
    const obmNoDb = await db('obms').where({ id: obmId }).first();
    expect(obmNoDb).toBeUndefined();
    
    obmId = null; // Impede a dupla exclusão no afterAll
  });
});
