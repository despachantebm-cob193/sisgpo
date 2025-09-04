// Arquivo: backend/src/bootstrap.js (Novo Arquivo)

const db = require('./config/database');
const bcrypt = require('bcryptjs');

async function bootstrapDatabase() {
  console.log('[Bootstrap] Verificando se os dados iniciais são necessários...');

  try {
    // 1. Verifica se o usuário 'admin' já existe.
    const adminUser = await db('usuarios').where({ login: 'admin' }).first();

    // 2. Se o usuário já existe, não faz nada.
    if (adminUser) {
      console.log('[Bootstrap] O usuário admin já existe. Nenhuma ação necessária.');
      return;
    }

    // 3. Se não existe, executa a lógica de criação.
    console.log('[Bootstrap] Usuário admin não encontrado. Criando usuário...');

    const senhaPlana = 'cbmgo@2025'; // Use a mesma senha padrão
    const salt = await bcrypt.genSalt(10);
    const senhaHash = await bcrypt.hash(senhaPlana, salt);
    
    await db('usuarios').insert({ 
      login: 'admin', 
      senha_hash: senhaHash, 
      perfil: 'Admin' 
    });

    console.log('✅ [Bootstrap] Usuário admin criado com sucesso!');

  } catch (error) {
    // Se o erro for "tabela não existe", podemos ignorá-lo, pois a migração ainda não rodou.
    // Em qualquer outro caso, é um problema sério.
    if (error.code === '42P01') { // Código de erro do PostgreSQL para "undefined_table"
        console.warn('[Bootstrap] Tabela de usuários ainda não existe, aguardando migração. Isso é normal na primeira execução.');
    } else {
        console.error('❌ [Bootstrap] Erro ao verificar/criar usuário admin:', error);
        // Lançar o erro para parar a inicialização do servidor
        throw error;
    }
  }
}

module.exports = bootstrapDatabase;
