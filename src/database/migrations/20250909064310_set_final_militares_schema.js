/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  // Garante que a coluna 'obm_id' (chave estrangeira) não exista.
  const hasObmId = await knex.schema.hasColumn('militares', 'obm_id');
  if (hasObmId) {
    await knex.schema.alterTable('militares', function(table) {
      table.dropColumn('obm_id');
    });
  }

  // Garante que a coluna 'obm_nome' (texto) exista.
  const hasObmNome = await knex.schema.hasColumn('militares', 'obm_nome');
  if (!hasObmNome) {
    await knex.schema.alterTable('militares', function(table) {
      table.string('obm_nome', 150).nullable();
    });
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  // Reverte as alterações para um estado anterior, se necessário.
  const hasObmNome = await knex.schema.hasColumn('militares', 'obm_nome');
  if (hasObmNome) {
    await knex.schema.alterTable('militares', function(table) {
      table.dropColumn('obm_nome');
    });
  }

  const hasObmId = await knex.schema.hasColumn('militares', 'obm_id');
  if (!hasObmId) {
    await knex.schema.alterTable('militares', function(table) {
      table.integer('obm_id').unsigned().references('id').inTable('obms').onDelete('SET NULL');
    });
  }
};
