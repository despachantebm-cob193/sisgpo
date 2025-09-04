// Arquivo: backend/src/database/migrations/<timestamp>_add_tipo_to_militares_table.js

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.alterTable('militares', function(table) {
    // Adiciona a coluna 'tipo', que pode ser 'Militar' ou 'Civil'.
    // O padrão é 'Militar' para manter a compatibilidade com os registros existentes.
    table.string('tipo', 20).notNullable().defaultTo('Militar');
    
    // Torna as colunas específicas de militares opcionais (nullable)
    table.string('matricula', 20).nullable().alter();
    table.string('posto_graduacao', 50).nullable().alter();
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.alterTable('militares', function(table) {
    table.dropColumn('tipo');
    
    // Reverte as colunas para o estado original (notNullable)
    // ATENÇÃO: Isso pode falhar se houver civis cadastrados com esses campos nulos.
    table.string('matricula', 20).notNullable().alter();
    table.string('posto_graduacao', 50).notNullable().alter();
  });
};
