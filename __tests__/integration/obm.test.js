const request = require('supertest');
const app =require('../../src/app');
const pool = require('../../src/config/database');

let authToken;
let obmId;

beforeAll(async () => {
  const response = await request(app).post('/api/admin/login').send({ login: 'admin', senha: 'cbmgo@2025' });
  if (response.status !== 200) {
    throw new Error('Login para teste de OBM falhou: ' + (response.body.message || response.text));
  }
  authToken = response.body.token;
});

afterAll(async () => {
  if (obmId) {
    await pool.query('DELETE FROM obms WHERE id = $1', [obmId]);
  }
});

describe('Testes de Integração para a Rota /obms', () => {
  it('POST /obms - Deve criar uma nova OBM com sucesso', async () => {
    const novaObm = {
      nome: '1º Batalhão de Bombeiro Militar de Teste',
      abreviatura: '1BBM-TEST',
      cidade: 'Goiânia',
      ativo: true
    };

    const response = await request(app)
      .post('/api/admin/obms')
      .set('Authorization', `Bearer ${authToken}`)
      .send(novaObm);
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    obmId = response.body.id;
  });

  it('PUT /obms/:id - Deve atualizar uma OBM existente com sucesso', async () => {
    const dadosAtualizados = {
      nome: 'Primeiro Batalhão de Bombeiro Militar Atualizado',
      abreviatura: '1BBM-UPDATED',
      cidade: 'Goiânia-GO',
      ativo: false,
    };

    const response = await request(app)
      .put(`/api/admin/obms/${obmId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send(dadosAtualizados);

    expect(response.status).toBe(200);
    expect(response.body.nome).toBe(dadosAtualizados.nome);
    expect(response.body.ativa).toBe(false);
  });

  it('DELETE /obms/:id - Deve excluir uma OBM com sucesso', async () => {
    const response = await request(app)
      .delete(`/api/admin/obms/${obmId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(204);
    obmId = null;
  });
});
