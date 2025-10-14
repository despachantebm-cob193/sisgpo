// src/database/migrations/20251210100000_final_fix_usuarios_columns.js

exports.up = async function(knex) { // <-- knex está aqui
  const tableExists = await knex.schema.hasTable('usuarios');

  if (tableExists) {
    console.log(' -> Executando correção final na tabela "usuarios" (Adicionando colunas críticas)...');

    // Usa alterTable para adicionar colunas APENAS SE ELAS ESTÃO FALTANDO
    await knex.schema.alterTable('usuarios', async (table) => {
      
      // 1. Adicionar 'login' (causando o erro principal no bootstrap)
      if (!(await knex.schema.hasColumn('usuarios', 'login'))) { // CORRIGIDO: knnex -> knex
        table.string('login', 50).notNullable().defaultTo(knex.raw('COALESCE(id::text, \'user\' || id)')); 
        console.log(' -> Coluna "login" adicionada.');
      }

      // 2. Adicionar 'senha_hash' (essencial para autenticação)
      if (!(await knex.schema.hasColumn('usuarios', 'senha_hash'))) { // CORRIGIDO: knnex -> knex
        table.string('senha_hash', 255).notNullable().defaultTo(''); 
        console.log(' -> Coluna "senha_hash" adicionada.');
      }
      
      // 3. Adicionar 'perfil' (causou erro anterior de update)
      if (!(await knex.schema.hasColumn('usuarios', 'perfil'))) { // CORRIGIDO: knnex -> knex
        table.string('perfil', 20).notNullable().defaultTo('Usuario');
        console.log(' -> Coluna "perfil" adicionada.');
      }
      
      // 4. Adicionar 'ativo' (essencial para login/autorização)
      if (!(await knex.schema.hasColumn('usuarios', 'ativo'))) { // CORRIGIDO: knnex -> knex
        table.boolean('ativo').defaultTo(true);
        console.log(' -> Coluna "ativo" adicionada.');
      }
    });

    console.log(' -> Colunas essenciais da tabela "usuarios" corrigidas.');

  } else {
    console.log(' -> ALERTA: Tabela "usuarios" não existe. Bootstrap irá falhar.');
  }
};

exports.down = function(knex) {
  // Remove as colunas adicionadas nesta migração
  return knex.schema.table('usuarios', (table) => {
    table.dropColumn('login');
    table.dropColumn('senha_hash');
    table.dropColumn('perfil');
    table.dropColumn('ativo');
  });
};