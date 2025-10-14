// src/database/migrations/20251014070000_rename_obms_sigla_to_abreviatura.js

exports.up = async function(knex) {
  const hasObmsTable = await knex.schema.hasTable('obms');
  if (hasObmsTable) {
    const hasSiglaColumn = await knex.schema.hasColumn('obms', 'sigla');
    
    // 1. Se a coluna 'sigla' existe, renomeie-a para 'abreviatura'
    if (hasSiglaColumn) {
      console.log("[Migration] Renomeando coluna 'sigla' para 'abreviatura' em 'obms'.");
      await knex.schema.table('obms', (table) => {
        table.renameColumn('sigla', 'abreviatura');
      });
    } else {
        // Caso 'sigla' não exista (o que causaria o primeiro erro), 
        // mas 'abreviatura' também não (o que causa o erro atual), 
        // criamos a coluna 'abreviatura'
        const hasAbreviaturaColumn = await knex.schema.hasColumn('obms', 'abreviatura');
        if (!hasAbreviaturaColumn) {
            console.log("[Migration] Colunas 'sigla' e 'abreviatura' ausentes. Criando 'abreviatura'.");
            await knex.schema.table('obms', (table) => {
                table.string('abreviatura', 10).notNullable().unique().defaultTo('N/A');
            });
        }
    }
  }
};

exports.down = function(knex) {
  // O rollback reverte o nome de 'abreviatura' para 'sigla'
  return knex.schema.table('obms', (table) => {
    table.renameColumn('abreviatura', 'sigla');
  });
};