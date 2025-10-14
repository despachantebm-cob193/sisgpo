// src/database/migrations/20251209170000_update_user_roles.js

exports.up = async function(knex) {
  console.log('Fase de Sincronização: Atualizando perfis de usuários...');
  
  // CRÍTICO: Verifica se a coluna 'perfil' existe antes de tentar rodar a query UPDATE.
  const hasPerfilColumn = await knex.schema.hasColumn('usuarios', 'perfil');

  if (hasPerfilColumn) {
    console.log(' -> Coluna "perfil" encontrada. Executando atualização de perfis...');
    
    // Se a coluna existe, executa a lógica de atualização (UPDATE).
    return knex('usuarios')
      // A condição whereIn é uma suposição, mas a coluna perfil é o que importa
      .whereIn('perfil', ['usuario', 'admin']) 
      .update({ perfil: knex.raw('LOWER("perfil")') });

  } else {
    // Se a coluna não existe, a migração é pulada com segurança.
    console.log(' -> Coluna "perfil" não encontrada na tabela "usuarios". Pulando atualização.');
    return Promise.resolve();
  }
};

exports.down = function(knex) {
  // O down é mantido simples ou vazio para migrações de dados.
  return Promise.resolve();
};