// src/database/migrations/20251014100000_add_missing_columns_to_usuarios.js

exports.up = async function(knex) {
  const tableExists = await knex.schema.hasTable('usuarios');

  if (tableExists) {
    console.log(' -> Corrigindo colunas faltantes na tabela "usuarios"...');

    // 1. Adicionar colunas essenciais para o Bootstrap e Autenticação
    await knex.schema.table('usuarios', async (table) => {
      // Verifica e adiciona a coluna 'login'
      if (!(await knex.schema.hasColumn('usuarios', 'login'))) {
        table.string('login', 50).notNullable().unique().defaultTo(knex.raw('LOWER(COALESCE(nome_completo, \'usuario\') || id)')); 
        // Usa nome ou ID temporário para preencher o default
        console.log(' -> Coluna "login" adicionada.');
      }

      // Verifica e adiciona a coluna 'senha_hash'
      if (!(await knex.schema.hasColumn('usuarios', 'senha_hash'))) {
        table.string('senha_hash', 255).notNullable().defaultTo('');
        console.log(' -> Coluna "senha_hash" adicionada.');
      }
      
      // Verifica e adiciona a coluna 'perfil' (causou erro anterior)
      if (!(await knex.schema.hasColumn('usuarios', 'perfil'))) {
        table.string('perfil', 20).notNullable().defaultTo('Usuario');
        console.log(' -> Coluna "perfil" adicionada.');
      }
      
      // Verifica e adiciona a coluna 'ativo' (causou erro anterior)
      if (!(await knex.schema.hasColumn('usuarios', 'ativo'))) {
        table.boolean('ativo').defaultTo(true);
        console.log(' -> Coluna "ativo" adicionada.');
      }
    });

    console.log(' -> Corrigido com sucesso. Tabela "usuarios" pronta para bootstrap.');

  } else {
    // Se a tabela nem existir, algo muito errado aconteceu na migração inicial.
    console.log(' -> ALERTA: Tabela "usuarios" não existe. Bootstrap irá falhar.');
  }
};

exports.down = function(knex) {
  // O down remove as colunas adicionadas nesta migração
  return knex.schema.table('usuarios', (table) => {
    table.dropColumn('login');
    table.dropColumn('senha_hash');
    table.dropColumn('perfil');
    table.dropColumn('ativo');
  });
};