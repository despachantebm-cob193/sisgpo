exports.up = async function (knex) {
  const hasDataInicio = await knex.schema.hasColumn('plantoes', 'data_inicio');
  const hasDataPlantao = await knex.schema.hasColumn('plantoes', 'data_plantao');

  if (!hasDataInicio && hasDataPlantao) {
    // Já está renomeada; nada a fazer
    return;
  }

  if (!hasDataInicio) {
    // Em alguns ambientes a coluna original pode não existir
    return;
  }

  return knex.schema.table('plantoes', function (table) {
    table.renameColumn('data_inicio', 'data_plantao');
  });
};

exports.down = async function (knex) {
  const hasDataPlantao = await knex.schema.hasColumn('plantoes', 'data_plantao');
  const hasDataInicio = await knex.schema.hasColumn('plantoes', 'data_inicio');

  if (!hasDataPlantao || hasDataInicio) {
    // Já revertido ou nunca aplicado
    return;
  }

  return knex.schema.table('plantoes', function (table) {
    table.renameColumn('data_plantao', 'data_inicio');
  });
};
