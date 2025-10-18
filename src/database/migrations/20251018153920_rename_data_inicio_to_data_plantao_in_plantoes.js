exports.up = function(knex) {
  return knex.schema.table('plantoes', function(table) {
    // Renomeia a coluna 'data_inicio' para 'data_plantao'
    table.renameColumn('data_inicio', 'data_plantao');
  });
};

exports.down = async function(knex) {
  const hasDataPlantao = await knex.schema.hasColumn('plantoes', 'data_plantao');
  if (hasDataPlantao) {
    return knex.schema.table('plantoes', function(table) {
      table.renameColumn('data_plantao', 'data_inicio');
    });
  }
};