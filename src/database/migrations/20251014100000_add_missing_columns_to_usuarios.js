// src/database/migrations/20251014100000_add_missing_columns_to_usuarios.js

exports.config = { transaction: false };

exports.up = async function up(knex) {
  const tableExists = await knex.schema.hasTable('usuarios');

  if (!tableExists) {
    console.warn(' -> ALERTA: Tabela "usuarios" nao existe. Nenhuma alteracao aplicada.');
    return;
  }

  console.log(' -> Ajustando colunas obrigatorias da tabela "usuarios"...');

  const [hasLogin, hasSenhaHash, hasPerfil, hasAtivo] = await Promise.all([
    knex.schema.hasColumn('usuarios', 'login'),
    knex.schema.hasColumn('usuarios', 'senha_hash'),
    knex.schema.hasColumn('usuarios', 'perfil'),
    knex.schema.hasColumn('usuarios', 'ativo'),
  ]);

  if (hasLogin && hasSenhaHash && hasPerfil && hasAtivo) {
    console.log(' -> Todas as colunas ja existem. Nenhuma alteracao necessaria.');
    return;
  }

  await knex.schema.alterTable('usuarios', (table) => {
    if (!hasLogin) table.string('login', 50);
    if (!hasSenhaHash) table.string('senha_hash', 255);
    if (!hasPerfil) table.string('perfil', 20);
    if (!hasAtivo) table.boolean('ativo');
  });

  if (!hasLogin) {
    await knex('usuarios')
      .whereNull('login')
      .update({ login: knex.raw("'usuario_' || id::text") });

    await knex.schema.alterTable('usuarios', (table) => {
      table.string('login', 50).notNullable().alter();
    });

    await knex.raw('ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_login_unique" UNIQUE ("login")');
  }

  if (!hasSenhaHash) {
    await knex('usuarios')
      .whereNull('senha_hash')
      .update({ senha_hash: '' });

    await knex.schema.alterTable('usuarios', (table) => {
      table.string('senha_hash', 255).notNullable().defaultTo('').alter();
    });
  }

  if (!hasPerfil) {
    await knex('usuarios')
      .whereNull('perfil')
      .update({ perfil: 'Usuario' });

    await knex.schema.alterTable('usuarios', (table) => {
      table.string('perfil', 20).notNullable().defaultTo('Usuario').alter();
    });
  }

  if (!hasAtivo) {
    await knex('usuarios')
      .whereNull('ativo')
      .update({ ativo: true });

    await knex.schema.alterTable('usuarios', (table) => {
      table.boolean('ativo').notNullable().defaultTo(true).alter();
    });
  }

  console.log(' -> Colunas da tabela "usuarios" ajustadas com sucesso.');
};

exports.down = async function down(knex) {
  const tableExists = await knex.schema.hasTable('usuarios');
  if (!tableExists) return;

  const [hasLogin, hasSenhaHash, hasPerfil, hasAtivo] = await Promise.all([
    knex.schema.hasColumn('usuarios', 'login'),
    knex.schema.hasColumn('usuarios', 'senha_hash'),
    knex.schema.hasColumn('usuarios', 'perfil'),
    knex.schema.hasColumn('usuarios', 'ativo'),
  ]);

  if (hasLogin) {
    await knex.raw('ALTER TABLE "usuarios" DROP CONSTRAINT IF EXISTS "usuarios_login_unique"');
  }

  await knex.schema.alterTable('usuarios', (table) => {
    if (hasLogin) table.dropColumn('login');
    if (hasSenhaHash) table.dropColumn('senha_hash');
    if (hasPerfil) table.dropColumn('perfil');
    if (hasAtivo) table.dropColumn('ativo');
  });
};
