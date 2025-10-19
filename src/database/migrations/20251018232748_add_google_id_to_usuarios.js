exports.up = function(knex) {
  return knex.schema.table('usuarios', function(table) {
    table.string('google_id').unique();
  });
};

exports.down = function(knex) {
  return knex.schema.table('usuarios', function(table) {
    table.dropColumn('google_id');
  });
};