// Arquivo: __tests__/integration/viatura.test.js

const request = require('supertest');
const app = require('../../src/app');
const db = require('../../src/config/database');

let authToken;
let viaturaId;

beforeAll(async () => {
  const loginResponse = await request(app).post('/api/auth/login').send({ login: 'admin', senha: 'cbmgo@2025' });
  authToken = loginResponse.body.token;
});

afterAll(async () => {
  if (viaturaId) {
    await db('viaturas').where({ id: viaturaId }).del();
  }
});

describe('Testes de Integração para a Rota /viaturas', () => {
  it('POST /viaturas - Deve criar uma nova viatura com sucesso', async () => {
    const novaViatura = {
      prefixo: `UR-TESTE-${Date.now()}`,
      ativa: true,
      cidade: 'Goiânia (Teste)',
      obm: '1º BBM (Teste)',
      telefone: '62912345678'
    };

    const response = await request(app)
      .post('/api/admin/viaturas')
      .set('Authorization', `Bearer ${authToken}`)
      .send(novaViatura);

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    viaturaId = response.body.id;
  });

  it('PUT /viaturas/:id - Deve atualizar uma viatura com sucesso', async () => {
    const dadosAtualizados = {
      prefixo: `UR-UPD-${Date.now()}`,
      ativa: false, // Alterando o status
      cidade: 'Anápolis (Teste)',
    };

    const response = await request(app)
      .put(`/api/admin/viaturas/${viaturaId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send(dadosAtualizados);

    expect(response.status).toBe(200);
    expect(response.body.prefixo).toBe(dadosAtualizados.prefixo);
    expect(response.body.ativa).toBe(false);
    expect(response.body.cidade).toBe('Anápolis (Teste)');
  });

  it('DELETE /viaturas/:id - Deve excluir uma viatura com sucesso', async () => {
    const response = await request(app)
      .delete(`/api/admin/viaturas/${viaturaId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(204);

    const viaturaNoDb = await db('viaturas').where({ id: viaturaId }).first();
    expect(viaturaNoDb).toBeUndefined();
    viaturaId = null;
  });
});
