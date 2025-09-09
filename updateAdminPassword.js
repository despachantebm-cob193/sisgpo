// backend/updateAdminPassword.js

// Carrega as variáveis de ambiente do seu arquivo .env
require('dotenv').config();

const bcrypt = require('bcryptjs');
const db = require('./src/config/database'); // Usa nossa conexão Knex existente

async function updateAdminPassword() {
  console.log('--- INICIANDO SCRIPT DE ATUALIZAÇÃO DE SENHA DO ADMIN ---');

  const login = 'admin';
  const novaSenhaPlana = 'cbmgo@2025'; // A senha que queremos garantir

  try {
    // 1. Verifica se o usuário 'admin' existe
    const adminUser = await db('usuarios').where({ login: login }).first();

    if (!adminUser) {
      console.error(`\n❌ ERRO: O usuário '${login}' não foi encontrado no banco de dados.`);
      console.log("Por favor, execute um seed ou crie o usuário manualmente antes de rodar este script.");
      return;
    }

    console.log(`\n[PASSO 1] Usuário '${login}' encontrado. ID: ${adminUser.id}`);

    // 2. Gera o novo hash da senha
    console.log(`[PASSO 2] Criptografando a nova senha: "${novaSenhaPlana}"...`);
    const salt = await bcrypt.genSalt(10);
    const novaSenhaHash = await bcrypt.hash(novaSenhaPlana, salt);
    console.log('   -> Hash gerado com sucesso!');

    // 3. Atualiza a senha no banco de dados
    console.log('[PASSO 3] Atualizando a senha no banco de dados...');
    const updatedRows = await db('usuarios')
      .where({ id: adminUser.id })
      .update({
        senha_hash: novaSenhaHash,
        updated_at: db.fn.now(),
      });

    if (updatedRows > 0) {
      console.log('\n✅ SUCESSO! A senha do usuário "admin" foi redefinida para "cbmgo@2025".');
    } else {
      console.error('\n❌ FALHA: A atualização no banco de dados não afetou nenhuma linha.');
    }

  } catch (error) {
    console.error('\n❌ ERRO CRÍTICO durante a atualização da senha:', error);
  } finally {
    // 4. Encerra a conexão com o banco
    await db.destroy();
    console.log('\n--- FIM DO SCRIPT ---');
  }
}

// Executa a função
updateAdminPassword();
