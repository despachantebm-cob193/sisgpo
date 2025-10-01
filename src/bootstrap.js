// Arquivo: backend/src/bootstrap.js (Versão Final e Robusta)

const db = require('./config/database');
const bcrypt = require('bcryptjs');

async function bootstrapDatabase() {
  console.log('[Bootstrap] Iniciando verificação e população de dados essenciais...');

  try {
    // 1. Verifica se o usuário 'admin' já existe.
    const adminUser = await db('usuarios').where({ login: 'admin' }).first();

    // Se o usuário já existe, consideramos que o bootstrap já foi feito.
    if (adminUser) {
      console.log('[Bootstrap] O usuário admin já existe. Bootstrap não é necessário.');
      return;
    }

    // --------------------------------------------------------------------
    // Se o admin NÃO existe, populamos o banco com dados MÍNIMOS
    // --------------------------------------------------------------------
    console.log('[Bootstrap] Usuário admin não encontrado. Populando o banco de dados com dados iniciais...');

    // Inserir o usuário 'admin'
    const senhaPlana = 'cbmgo@2025'; // Mantenha a senha padrão
    const salt = await bcrypt.genSalt(10);
    const senhaHash = await bcrypt.hash(senhaPlana, salt);
    
    await db('usuarios').insert({ 
      login: 'admin', 
      senha_hash: senhaHash, 
      perfil: 'admin' 
    });
    console.log('-> Usuário "admin" criado com sucesso.');

    // Inserir uma OBM de exemplo para evitar que o sistema comece vazio
    const [obm] = await db('obms').insert([
      { 
        nome: 'Comando Geral do Corpo de Bombeiros', 
        abreviatura: 'CGCBM', 
        cidade: 'Goiânia',
        telefone: '6232012000'
      }
    ]).returning('id'); // Captura o ID da OBM criada
    console.log('-> OBM de exemplo "CGCBM" criada com sucesso.');

    // Inserir um militar de exemplo associado à OBM criada
    await db('militares').insert([
      { 
        matricula: '000000', 
        nome_completo: 'Administrador do Sistema', 
        nome_guerra: 'Admin', 
        posto_graduacao: 'Sistema', 
        ativo: true, 
        obm_id: obm.id // Associa o militar à OBM
      }
    ]);
    console.log('-> Militar "Admin" de exemplo criado com sucesso.');

    // Inserir uma viatura de exemplo
    await db('viaturas').insert([
      { 
        prefixo: 'VTR-ADM', 
        ativa: true, 
        cidade: 'Goiânia',
        obm: 'Comando Geral do Corpo de Bombeiros'
      }
    ]);
    console.log('-> Viatura "VTR-ADM" de exemplo criada com sucesso.');

    console.log('✅ [Bootstrap] Banco de dados populado com sucesso!');

  } catch (error) {
    console.error('❌ [Bootstrap] Erro crítico durante o processo de bootstrap:', error);
    // Lançar o erro é importante para que a inicialização do servidor pare
    // e possamos ver o erro nos logs da Render.
    throw error;
  }
}

module.exports = bootstrapDatabase;
