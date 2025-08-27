/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema
    .createTable('usuarios', function (table) {
      table.increments('id').primary();
      table.string('login', 50).notNullable().unique();
      table.string('senha_hash', 255).notNullable();
      table.string('perfil', 20).notNullable().defaultTo('Usuario');
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
    })
    .createTable('obms', function (table) {
      table.increments('id').primary();
      table.string('nome', 100).notNullable();
      table.string('abreviatura', 20).notNullable().unique();
      table.string('cidade', 50);
      table.boolean('ativo').notNullable().defaultTo(true);
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
    })
    .createTable('militares', function (table) {
      table.increments('id').primary();
      table.string('matricula', 20).notNullable().unique();
      table.string('nome_completo', 150).notNullable();
      table.string('nome_guerra', 50).notNullable();
      table.string('posto_graduacao', 50).notNullable();
      table.boolean('ativo').notNullable().defaultTo(true);
      table.integer('obm_id').unsigned().references('id').inTable('obms').onDelete('SET NULL');
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
    })
    .createTable('viaturas', function (table) {
      table.increments('id').primary();
      table.string('prefixo', 50).notNullable().unique();
      table.string('placa', 10).notNullable().unique();
      table.string('modelo', 100);
      table.integer('ano');
      table.string('tipo', 50).notNullable();
      table.boolean('ativa').notNullable().defaultTo(true);
      table.integer('obm_id').unsigned().references('id').inTable('obms').onDelete('SET NULL');
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
    })
    .createTable('plantoes', function (table) {
      table.increments('id').primary();
      table.date('data_plantao').notNullable();
      table.integer('viatura_id').unsigned().notNullable().references('id').inTable('viaturas').onDelete('CASCADE');
      table.integer('obm_id').unsigned().notNullable().references('id').inTable('obms').onDelete('CASCADE');
      table.text('observacoes');
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
      table.unique(['data_plantao', 'viatura_id']);
    })
    .createTable('plantoes_militares', function (table) {
      table.increments('id').primary();
      table.integer('plantao_id').unsigned().notNullable().references('id').inTable('plantoes').onDelete('CASCADE');
      table.integer('militar_id').unsigned().notNullable().references('id').inTable('militares').onDelete('CASCADE');
      table.string('funcao', 50).notNullable();
      table.unique(['plantao_id', 'militar_id']);
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('plantoes_militares')
    .dropTableIfExists('plantoes')
    .dropTableIfExists('viaturas')
    .dropTableIfExists('militares')
    .dropTableIfExists('obms')
    .dropTableIfExists('usuarios');
};
