/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  // ETAPA 1: Criar a nova tabela 'civis'
  await knex.schema.createTable('civis', function (table) {
    table.increments('id').primary();
    table.string('nome_completo', 150).notNullable();
    table.string('apelido', 50).notNullable();
    table.integer('obm_id').unsigned().references('id').inTable('obms').onDelete('SET NULL');
    table.boolean('ativo').notNullable().defaultTo(true);
    table.timestamps(true, true);
  });

  // ETAPA 2: Refatorar a tabela 'militares'
  await knex.schema.alterTable('militares', function (table) {
    // Garante que as colunas militares sejam obrigatórias
    table.string('matricula', 20).notNullable().alter();
    table.string('posto_graduacao', 50).notNullable().alter();

    // Remove a coluna 'tipo' se ela existir.
    // O 'if' aqui é uma proteção, mas o ideal é que a migration original que a criou seja revertida.
    // Como ela parece não existir mais, vamos garantir que a coluna seja removida.
    // A migration original 'add_tipo_to_militares_table' deve ser removida ou revertida.
    // Para este caso, vamos assumir que a coluna 'tipo' foi removida manualmente e
    // que a migration que a criou não está mais no histórico do Knex.
    // A lógica abaixo tentará remover a coluna 'tipo', mas se ela não existir, o erro
    // que você viu acontecerá. A solução é garantir que a migration que a adicionou
    // seja a mesma que a remove no 'down'.
    
    // Para resolver o seu problema imediato, vamos remover a migration que adicionou 'tipo'.
    // E esta migration aqui vai apenas garantir o estado final correto.
    // Se a coluna 'tipo' foi adicionada por uma migration, ela deve ser removida no 'down' daquela migration.
    // Vamos assumir que a migration `add_tipo_to_militares_table` foi um erro e vamos consertar.
    
    // Ação correta: remover a coluna 'tipo' se ela existir.
    // No entanto, a migration que a adicionou deve ser revertida primeiro.
    // Como isso não parece ser possível, vamos garantir que a tabela 'militares'
    // fique no estado correto.
    
    // A migration original `add_tipo_to_militares_table` deve ser revertida.
    // Se você não puder reverter, a solução é garantir que a coluna 'tipo' não exista.
    // O erro que você viu indica que ela já não existe.
    // Portanto, esta migration deve apenas garantir que as outras colunas estejam corretas.
  });

  // ETAPA 3: Remover a coluna 'tipo' da tabela 'militares' se ela existir
  const hasTipoColumn = await knex.schema.hasColumn('militares', 'tipo');
  if (hasTipoColumn) {
    await knex.schema.alterTable('militares', function (table) {
      table.dropColumn('tipo');
    });
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  // Reverte na ordem inversa
  await knex.schema.alterTable('militares', function (table) {
    // Adiciona a coluna 'tipo' de volta
    table.string('tipo', 20).defaultTo('Militar');
    // Torna as colunas militares opcionais novamente
    table.string('matricula', 20).nullable().alter();
    table.string('posto_graduacao', 50).nullable().alter();
  });

  await knex.schema.dropTableIfExists('civis');
};
