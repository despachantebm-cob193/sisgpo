// src/bootstrap.js
const db = require('./config/database');
const bcrypt = require('bcryptjs');

async function bootstrapDatabase() {
  console.log('[Bootstrap] Verificando se os dados iniciais são necessários...');

  try {
    // 1. Verifica se o usuário 'admin' já existe.
    const adminUser = await db('usuarios').where({ login: 'admin' }).first();

    // 2. Se o usuário já existe, não faz nada.
    if (adminUser) {
      console.log('[Bootstrap] O usuário admin já existe. Nenhum dado será inserido.');
      return;
    }

    // 3. Se não existe, executa a lógica do seed.
    console.log('[Bootstrap] Usuário admin não encontrado. Populando o banco de dados...');

    // Limpa as tabelas em ordem para garantir um estado limpo
    await db('plantoes_militares').del();
    await db('plantoes').del();
    await db('militares').del();
    await db('viaturas').del();
    await db('obms').del();
    await db('usuarios').del();

    // Insere o usuário 'admin'
    const senhaPlana = 'cbmgo@2025'; // Mantenha a senha consistente
    const salt = await bcrypt.genSalt(10);
    const senhaHash = await bcrypt.hash(senhaPlana, salt);
    await db('usuarios').insert({ login: 'admin', senha_hash: senhaHash, perfil: 'Admin' });

    // Insere dados de exemplo
    await db('obms').insert([
      { nome: '1º Batalhão Bombeiro Militar', abreviatura: '1º BBM', cidade: 'Goiânia', ativo: true },
      { nome: 'Comando de Apoio Logístico', abreviatura: 'CAL', cidade: 'Goiânia', ativo: true },
      { nome: 'Academia Bombeiro Militar', abreviatura: 'ABM', cidade: 'Goiânia', ativo: true }
    ]);
    
    const [obm] = await db('obms').where({ abreviatura: '1º BBM' }).select('id');
    
    await db('viaturas').insert([
        { prefixo: 'UR-123', placa: 'ABC1234', modelo: 'Sprinter', ano: 2022, tipo: 'UR', ativa: true, obm_id: obm.id }
    ]);

    await db('militares').insert([
        { matricula: '123456', nome_completo: 'Fulano de Tal', nome_guerra: 'Fulano', posto_graduacao: 'Soldado', ativo: true, obm_id: obm.id }
    ]);

    console.log('✅ [Bootstrap] Banco de dados populado com sucesso!');

  } catch (error) {
    console.error('❌ [Bootstrap] Erro ao popular o banco de dados:', error);
    // Em caso de erro, é melhor parar o processo para evitar um estado inconsistente.
    process.exit(1);
  }
}

module.exports = bootstrapDatabase;
