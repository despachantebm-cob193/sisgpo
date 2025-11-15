// 20251115200000_alter_user_approval_fk.js

exports.up = async function(knex) {
  await knex.schema.table('usuarios', (table) => {
    // 1. Remove a constraint de chave estrangeira existente
    // O nome da constraint é gerado pelo Knex como: table_column_foreign
    table.dropForeign('aprovado_por');

    // 2. Adiciona a nova constraint com ON DELETE SET NULL
    table.foreign('aprovado_por').references('id').inTable('usuarios').onDelete('SET NULL');
  });
};

exports.down = async function(knex) {
  await knex.schema.table('usuarios', (table) => {
    // 1. Remove a constraint que adicionamos
    table.dropForeign('aprovado_por');

    // 2. Readiciona a constraint original (sem o onDelete)
    table.foreign('aprovado_por').references('id').inTable('usuarios');
  });
};
