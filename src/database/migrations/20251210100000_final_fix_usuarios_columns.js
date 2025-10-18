// src/database/migrations/20251210100000_final_fix_usuarios_columns.js

// 1. Desativa a transação automática do Knex. ESSENCIAL para usar hasColumn.
exports.config = { transaction: false }; 

exports.up = async function(knex) {
  const tableExists = await knex.schema.hasTable('usuarios');

  if (!tableExists) {
    console.log(' -> ALERTA: Tabela "usuarios" não existe. A migração será pulada.');
    return;
  }

  console.log(' -> Executando correção final na tabela "usuarios"...');

  const hasLogin = await knex.schema.hasColumn('usuarios', 'login');
  const hasSenhaHash = await knex.schema.hasColumn('usuarios', 'senha_hash');
  const hasPerfil = await knex.schema.hasColumn('usuarios', 'perfil');
  const hasAtivo = await knex.schema.hasColumn('usuarios', 'ativo');

  // Etapa 1: Adicionar as colunas com defaults simples ou permitindo nulos.
  await knex.schema.alterTable('usuarios', (table) => {
    if (!hasLogin) {
      // Adiciona a coluna 'login' permitindo nulos temporariamente.
      table.string('login', 50);
      console.log(' -> Coluna "login" adicionada.');
    }
    if (!hasSenhaHash) {
      // Usa um default simples e estático.
      table.string('senha_hash', 255).notNullable().defaultTo('senha_padrao_temporaria');
      console.log(' -> Coluna "senha_hash" adicionada.');
    }
    if (!hasPerfil) {
      table.string('perfil', 20).notNullable().defaultTo('Usuario');
      console.log(' -> Coluna "perfil" adicionada.');
    }
    if (!hasAtivo) {
      table.boolean('ativo').defaultTo(true);
      console.log(' -> Coluna "ativo" adicionada.');
    }
  });

  // Etapa 2: Se a coluna 'login' foi recém-adicionada, popule-a para os registros existentes.
  if (!hasLogin) {
    await knex.raw(`
      UPDATE usuarios
      SET login = 'user_' || id
      WHERE login IS NULL;
    `);
    console.log(" -> Coluna 'login' populada para usuários existentes.");

    // Etapa 3: Agora que não há nulos, adicione a restrição NOT NULL.
    await knex.schema.alterTable('usuarios', (table) => {
      table.string('login', 50).notNullable().alter();
    });
    console.log(" -> Restrição NOT NULL adicionada à coluna 'login'.");
  }

  console.log(' -> Colunas essenciais da tabela "usuarios" corrigidas com sucesso.');
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