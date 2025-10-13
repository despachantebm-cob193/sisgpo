// Arquivo: backend/src/bootstrap.js (Versao Final e Robusta)

const db = require('./config/database');
const bcrypt = require('bcryptjs');

async function bootstrapDatabase() {
  console.log('[Bootstrap] Iniciando verificacao e populacao de dados essenciais...');

  try {
    const adminUser = await db('usuarios').where({ login: 'admin' }).first();

    if (adminUser) {
      console.log('[Bootstrap] O usuario admin ja existe. Bootstrap nao e necessario.');
      return;
    }

    console.log('[Bootstrap] Usuario admin nao encontrado. Populando o banco de dados com dados iniciais...');

    const senhaPlana = 'cbmgo@2025';
    const salt = await bcrypt.genSalt(10);
    const senhaHash = await bcrypt.hash(senhaPlana, salt);

    await db('usuarios').insert({
      login: 'admin',
      senha_hash: senhaHash,
      perfil: 'admin',
      ativo: true,
    });
    console.log('-> Usuario "admin" criado com sucesso.');

    const [obm] = await db('obms')
      .insert([
        {
          nome: 'Comando Geral do Corpo de Bombeiros',
          abreviatura: 'CGCBM',
          cidade: 'Goiania',
          telefone: '6232012000',
        },
      ])
      .returning('id');
    console.log('-> OBM de exemplo "CGCBM" criada com sucesso.');

    await db('militares').insert([
      {
        matricula: '000000',
        nome_completo: 'Administrador do Sistema',
        nome_guerra: 'Admin',
        posto_graduacao: 'Sistema',
        ativo: true,
        obm_id: obm.id,
      },
    ]);
    console.log('-> Militar "Admin" de exemplo criado com sucesso.');

    await db('viaturas').insert([
      {
        prefixo: 'VTR-ADM',
        ativa: true,
        cidade: 'Goiania',
        obm: 'Comando Geral do Corpo de Bombeiros',
      },
    ]);
    console.log('-> Viatura "VTR-ADM" de exemplo criada com sucesso.');

    console.log('OK. [Bootstrap] Banco de dados populado com sucesso!');
  } catch (error) {
    console.error('ERRO [Bootstrap] Erro critico durante o processo de bootstrap:', error);
    throw error;
  }
}

module.exports = bootstrapDatabase;
