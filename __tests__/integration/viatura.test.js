const request = require('supertest');
const app = require('../../src/app');
const pool = require('../../src/config/database');

let authToken;
let obmIdForTest;
let viaturaId;

beforeAll(async () => {
  // Login para obter token
  const loginResponse = await request(app).post('/api/admin/login').send({ login: 'admin', senha: 'cbmgo@2025' });
  authToken = loginResponse.body.token;

  // Criar uma OBM para usar nos testes de viatura
  const obmResponse = await request(app)
    .post('/api/admin/obms')
    .set('Authorization', `Bearer ${authToken}`)
    .send({ nome: 'OBM para Teste de Viatura', abreviatura: 'OBM-VTR', cidade: 'Teste' });
  obmIdForTest = obmResponse.body.id;
});

afterAll(async () => {
  // Limpar os dados criados
  if (viaturaId) {
    await pool.query('DELETE FROM viaturas WHERE id = $1', [viaturaId]);
  }
  if (obmIdForTest) {
    await pool.query('DELETE FROM obms WHERE id = $1', [obmIdForTest]);
  }
});

describe('Testes de Integração para a Rota /viaturas', () => {
  it('POST /viaturas - Deve criar uma nova viatura com sucesso', async () => {
    const novaViatura = {
      prefixo: 'UR-150',
      placa: 'ABC1D23',
      modelo: 'Mercedes Sprinter',
      ano: 2022,
      tipo: 'UR',
      obm_id: obmIdForTest,
    };

    const response = await request(app)
      .post('/api/admin/viaturas')
      .set('Authorization', `Bearer ${authToken}`)
      .send(novaViatura);

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    viaturaId = response.body.id; // Salva o ID para os próximos testes
  });

  it('PUT /viaturas/:id - Deve atualizar uma viatura com sucesso', async () => {
    const dadosAtualizados = {
      prefixo: 'UR-155', // Prefixo alterado
      placa: 'ABC1D23',
      tipo: 'UR',
      ativa: false, // Alterando o status
    };

    const response = await request(app)
      .put(`/api/admin/viaturas/${viaturaId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send(dadosAtualizados);

    expect(response.status).toBe(200);
    expect(response.body.prefixo).toBe('UR-155');
    expect(response.body.ativa).toBe(false);
  });

  it('DELETE /viaturas/:id - Deve excluir uma viatura com sucesso', async () => {
    const response = await request(app)
      .delete(`/api/admin/viaturas/${viaturaId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(204);

    // Verifica se a viatura foi realmente excluída do banco
    const { rowCount } = await pool.query('SELECT * FROM viaturas WHERE id = $1', [viaturaId]);
    expect(rowCount).toBe(0);
    viaturaId = null; // Limpa o ID para não ser deletado de novo no afterAll
  });
});
