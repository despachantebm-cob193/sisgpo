import 'dotenv/config';
import bcrypt from 'bcryptjs';
import db from '../config/database';

async function updateAdminPassword() {
  console.log('--- INICIANDO SCRIPT DE ATUALIZACAO DE SENHA DO ADMIN ---');

  const login = 'admin';
  const novaSenhaPlana = 'cbmgo@2025';

  try {
    const adminUser = await db('usuarios').where({ login }).first();

    if (!adminUser) {
      console.error(`ERRO: O usuario '${login}' nao foi encontrado no banco de dados.`);
      console.log('Execute um seed ou crie o usuario manualmente antes de rodar este script.');
      return;
    }

    console.log(`[PASSO 1] Usuario '${login}' encontrado. ID: ${adminUser.id}`);

    console.log(`[PASSO 2] Criptografando a nova senha: "${novaSenhaPlana}"...`);
    const salt = await bcrypt.genSalt(10);
    const novaSenhaHash = await bcrypt.hash(novaSenhaPlana, salt);
    console.log('   -> Hash gerado com sucesso!');

    console.log('[PASSO 3] Atualizando a senha no banco de dados...');
    const updatedRows = await db('usuarios').where({ id: adminUser.id }).update({
      senha_hash: novaSenhaHash,
    });

    if (updatedRows > 0) {
      console.log('SUCESSO! A senha do usuario "admin" foi redefinida para "cbmgo@2025".');
    } else {
      console.error('FALHA: Nenhuma linha foi afetada pela atualizacao.');
    }
  } catch (error) {
    console.error('ERRO CRITICO durante a atualizacao da senha:', error);
  } finally {
    await db.destroy();
    console.log('--- FIM DO SCRIPT ---');
  }
}

updateAdminPassword();
