exports.up = function(knex) {
  return knex.schema
    // Tabela para o cadastro das aeronaves
    .createTable('aeronaves', function(table) {
      table.increments('id').primary();
      table.string('prefixo', 50).notNullable().unique();
      table.string('tipo_asa', 20).notNullable(); // 'fixa' ou 'rotativa'
      table.boolean('ativa').defaultTo(true);
      table.timestamps(true, true);
    })
    // Tabela para a escala diária das aeronaves
    .createTable('escala_aeronaves', function(table) {
      table.increments('id').primary();
      table.date('data').notNullable();
      table.integer('aeronave_id').unsigned().references('id').inTable('aeronaves').onDelete('CASCADE');
      table.integer('primeiro_piloto_id').unsigned().references('id').inTable('militares').onDelete('SET NULL');
      table.integer('segundo_piloto_id').unsigned().references('id').inTable('militares').onDelete('SET NULL');
      table.string('status', 30).defaultTo('Ativa'); // Ex: Ativa, Baixada, Manutenção
      table.unique(['data', 'aeronave_id']);
      table.timestamps(true, true);
    });
};

exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('escala_aeronaves')
    .dropTableIfExists('aeronaves');
};
