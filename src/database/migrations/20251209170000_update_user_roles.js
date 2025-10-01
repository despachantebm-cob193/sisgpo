// Arquivo: src/database/migrations/20251209170000_update_user_roles.js

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex('usuarios')
    .whereIn('perfil', ['Admin', 'Administrador'])
    .update({ perfil: 'admin' });

  await knex('usuarios')
    .whereIn('perfil', ['Usuario', 'User'])
    .update({ perfil: 'user' });

  await knex.schema.alterTable('usuarios', (table) => {
    table.string('perfil', 20).notNullable().defaultTo('user').alter();
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex('usuarios')
    .where('perfil', 'admin')
    .update({ perfil: 'Admin' });

  await knex('usuarios')
    .where('perfil', 'user')
    .update({ perfil: 'Usuario' });

  await knex.schema.alterTable('usuarios', (table) => {
    table.string('perfil', 20).notNullable().defaultTo('Usuario').alter();
  });
};
