/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  // A função 'up' permanece a mesma
  return knex.schema.alterTable('civis', function (table) {
    table.dropColumn('apelido');
    table.dropColumn('obm_id');
    table.string('funcao', 100).nullable();
    table.timestamp('entrada_servico').nullable();
    table.timestamp('saida_servico').nullable();
    table.string('status_servico', 20).defaultTo('Presente').notNullable();
    table.text('observacoes').nullable();
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  // --- RESTAURE O CONTEÚDO ORIGINAL ---
  return knex.schema.alterTable('civis', function (table) {
    table.string('apelido', 50);
    table.integer('obm_id').unsigned().references('id').inTable('obms').onDelete('SET NULL');
    table.dropColumn('funcao');
    table.dropColumn('entrada_servico');
    table.dropColumn('saida_servico');
    table.dropColumn('status_servico');
    table.dropColumn('observacoes');
  });
  
  return Promise.resolve(); // Apenas retorna uma promessa resolvida
};
