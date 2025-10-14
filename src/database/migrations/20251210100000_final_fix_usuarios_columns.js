// src/database/migrations/20251210100000_final_fix_usuarios_columns.js

// 1. Desativa a transação automática do Knex. ESSENCIAL para usar hasColumn.
exports.config = { transaction: false }; 

exports.up = async function(knex) {
  const tableExists = await knex.schema.hasTable('usuarios');

  if (!tableExists) {
    console.log(' -> ALERTA: Tabela "usuarios" não existe. Bootstrap irá falhar.');
    return;
  }

  console.log(' -> Executando correção final na tabela "usuarios" (Adicionando colunas críticas)...');

  // 2. Faz as checagens assíncronas (hasColumn) ANTES do alterTable
  const hasLogin = await knex.schema.hasColumn('usuarios', 'login');
  const hasSenhaHash = await knex.schema.hasColumn('usuarios', 'senha_hash');
  const hasPerfil = await knex.schema.hasColumn('usuarios', 'perfil');
  const hasAtivo = await knex.schema.hasColumn('usuarios', 'ativo');

  // 3. Executa o alterTable de forma SÍNCRONA
  await knex.schema.alterTable('usuarios', (table) => {
    
    // 1. Adicionar 'login'
    if (!hasLogin) {
      table.string('login', 50).notNullable().defaultTo(knex.raw('COALESCE(id::text, \'user\' || id)')); 
      console.log(' -> Coluna "login" adicionada.');
    }

    // 2. Adicionar 'senha_hash'
    if (!hasSenhaHash) {
      table.string('senha_hash', 255).notNullable().defaultTo(''); 
      console.log(' -> Coluna "senha_hash" adicionada.');
    }
    
    // 3. Adicionar 'perfil'
    if (!hasPerfil) {
      table.string('perfil', 20).notNullable().defaultTo('Usuario');
      console.log(' -> Coluna "perfil" adicionada.');
    }
    
    // 4. Adicionar 'ativo'
    if (!hasAtivo) {
      table.boolean('ativo').defaultTo(true);
      console.log(' -> Coluna "ativo" adicionada.');
    }
  });

  console.log(' -> Colunas essenciais da tabela "usuarios" corrigidas.');
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