// Arquivo: backend/__tests__/integration/viatura.test.js (Versão Final e Completa)

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
  // Limpa a viatura de teste se ela ainda existir
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
    viaturaId = response.body.id; // Salva o ID para os próximos testes
  });

  it('GET /viaturas - Deve listar as viaturas, incluindo a recém-criada', async () => {
    const response = await request(app)
      .get('/api/admin/viaturas')
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.data.length).toBeGreaterThan(0);
    const viaturaCriada = response.body.data.find(v => v.id === viaturaId);
    expect(viaturaCriada).toBeDefined();
  });

  it('PUT /viaturas/:id - Deve atualizar a viatura criada com sucesso', async () => {
    expect(viaturaId).toBeDefined();

    const dadosAtualizados = {
      prefixo: `UR-UPDATED-${Date.now()}`,
      ativa: false, // Alterando o status
      cidade: 'Anápolis (Teste)',
      obm: '2º BBM (Teste)',
    };

    const response = await request(app)
      .put(`/api/admin/viaturas/${viaturaId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send(dadosAtualizados);

    expect(response.status).toBe(200);
    expect(response.body.prefixo).toBe(dadosAtualizados.prefixo);
    expect(response.body.ativa).toBe(false);
    expect(response.body.cidade).toBe('Anápolis (Teste)');
    expect(response.body.obm).toBe('2º BBM (Teste)');
  });

  it('DELETE /viaturas/:id - Deve excluir a viatura criada com sucesso', async () => {
    expect(viaturaId).toBeDefined();

    const response = await request(app)
      .delete(`/api/admin/viaturas/${viaturaId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(204);

    // Verifica se a viatura foi realmente removida do banco
    const viaturaNoDb = await db('viaturas').where({ id: viaturaId }).first();
    expect(viaturaNoDb).toBeUndefined();
    viaturaId = null; // Impede a dupla exclusão no afterAll
  });
});
