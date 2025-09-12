exports.up = function(knex) {
  return knex.schema.createTable('escala_codec', function(table) {
    table.increments('id').primary();
    table.date('data').notNullable();
    table.enum('turno', ['diurno', 'noturno']).notNullable(); // 7h-19h, 19h-7h
    table.integer('militar_id').unsigned().references('id').inTable('militares').onDelete('CASCADE');
    table.integer('ordem_plantonista').notNullable().defaultTo(1); // Para "Plantonista 1", "Plantonista 2", etc.
    table.unique(['data', 'turno', 'ordem_plantonista']);
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('escala_codec');
};
