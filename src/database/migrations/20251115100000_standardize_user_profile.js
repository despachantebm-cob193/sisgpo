// 20251115100000_standardize_user_profile.js

exports.up = async function(knex) {
  // 1. Padroniza todos os perfis existentes para lowercase.
  await knex('usuarios')
    .where('perfil', 'ilike', 'Usuario')
    .update({ perfil: 'user' });

  await knex('usuarios')
    .where('perfil', 'ilike', 'Admin')
    .update({ perfil: 'admin' });

  // 2. Altera o default da coluna para 'user'.
  await knex.schema.alterTable('usuarios', (table) => {
    table.string('perfil', 20).notNullable().defaultTo('user').alter();
  });
};

exports.down = async function(knex) {
  // Reverte o default para 'Usuario' (o valor original da primeira migration)
  await knex.schema.alterTable('usuarios', (table) => {
    table.string('perfil', 20).notNullable().defaultTo('Usuario').alter();
  });

  // Opcional: reverter os valores no banco de dados.
  // Isso pode ser destrutivo se houver perfis 'user' que não eram 'Usuario' antes.
  // Por segurança, a reversão de dados é comentada.
  /*
  await knex('usuarios')
    .where('perfil', '=', 'user')
    .update({ perfil: 'Usuario' });
  */
};
