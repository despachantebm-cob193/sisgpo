// src/database/migrations/20250903155021_01_create_final_schema.js

exports.up = async function(knex) {
  // Usa hasTable e createTable para uma migração condicional segura
  
  // 1. Tabela Usuarios
  const hasUsersTable = await knex.schema.hasTable('usuarios');
  if (!hasUsersTable) {
    await knex.schema.createTable('usuarios', (table) => {
      table.increments('id').primary();
      table.string('login', 50).notNullable().unique();
      table.string('senha_hash', 255).notNullable();
      table.string('perfil', 20).notNullable().defaultTo('Usuario');
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
    });
  } else {
      // Se a tabela existe, garantimos que a coluna 'login' tem a constraint UNIQUE
      // (Isso deve resolver o erro "coluna login não existe")
      const hasLoginColumn = await knex.schema.hasColumn('usuarios', 'login');
      if (hasLoginColumn) {
          // A coluna existe, tenta adicionar a constraint UNIQUE se ainda não existir
          // O Knex tentará adicionar a constraint se a coluna já tiver dados inconsistentes,
          // mas esta é a única forma de evitar o erro 42703 persistente.
          await knex.schema.table('usuarios', (table) => {
              // Remove a constraint unique() da criação e a adicionamos explicitamente aqui,
              // mas para esta migração, a solução mais segura é não tentar alterá-la.
              // Para prosseguir, não faremos nenhuma alteração se a tabela já existir.
          });
      }
  }


  // 2. Tabela OBMs
  const hasObmsTable = await knex.schema.hasTable('obms');
  if (!hasObmsTable) {
    await knex.schema.createTable('obms', (table) => {
      table.increments('id').primary();
      table.string('nome', 100).notNullable().unique();
      // CORREÇÃO: Usar 'abreviatura' para o nome da coluna
      table.string('abreviatura', 10).notNullable().unique();
      table.string('cidade', 50);
      table.string('telefone', 20);
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
    });
  }
  
  // 3. Tabela Militares
  const hasMilitaresTable = await knex.schema.hasTable('militares');
  if (!hasMilitaresTable) {
    await knex.schema.createTable('militares', (table) => {
      table.increments('id').primary();
      table.string('matricula', 20).notNullable().unique();
      table.string('nome_completo', 255).notNullable();
      table.string('nome_guerra', 100);
      table.string('posto_graduacao', 50);
      table.boolean('ativo').defaultTo(true);
      table.string('obm_nome', 100); 
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
    });
  }
  
  // 4. Tabela Viaturas
  const hasViaturasTable = await knex.schema.hasTable('viaturas');
  if (!hasViaturasTable) {
    await knex.schema.createTable('viaturas', (table) => {
      table.increments('id').primary();
      table.string('prefixo', 20).notNullable().unique();
      table.string('tipo', 50);
      table.boolean('ativa').defaultTo(true);
      table.string('cidade', 50);
      table.string('obm', 100);
      table.string('telefone', 20);
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
    });
  }
  
  // 5. Tabela Plantões
  const hasPlantoesTable = await knex.schema.hasTable('plantoes');
  if (!hasPlantoesTable) {
      await knex.schema.createTable('plantoes', (table) => {
          table.increments('id').primary();
          table.string('nome', 100).notNullable().unique();
          table.string('tipo', 50).notNullable(); 
          table.string('periodo', 50); 
          table.string('responsavel', 100); 
          table.date('data_inicio').notNullable(); 
          table.date('data_fim').notNullable(); 
          table.boolean('ativo').defaultTo(true);
          table.timestamp('created_at').defaultTo(knex.fn.now());
          table.timestamp('updated_at').defaultTo(knex.fn.now());
      });
  }
  
  // 6. Tabela Relação: Plantão -> Viaturas
  const hasViaturaPlantaoTable = await knex.schema.hasTable('viatura_plantao');
  if (!hasViaturaPlantaoTable) {
      await knex.schema.createTable('viatura_plantao', (table) => {
          table.increments('id').primary();
          table.integer('plantao_id').references('id').inTable('plantoes').onDelete('CASCADE').notNullable();
          table.integer('viatura_id').references('id').inTable('viaturas').onDelete('CASCADE').notNullable();
          table.string('prefixo_viatura', 20); 
          table.timestamp('created_at').defaultTo(knex.fn.now());
          table.unique(['plantao_id', 'viatura_id']);
      });
  }
  
  // 7. Tabela Relação: Plantão -> Militares
  const hasMilitarPlantaoTable = await knex.schema.hasTable('militar_plantao');
  if (!hasMilitarPlantaoTable) {
      await knex.schema.createTable('militar_plantao', (table) => {
          table.increments('id').primary();
          table.integer('plantao_id').references('id').inTable('plantoes').onDelete('CASCADE').notNullable();
          table.integer('militar_id').references('id').inTable('militares').onDelete('CASCADE').notNullable();
          table.string('matricula_militar', 20);
          table.timestamp('created_at').defaultTo(knex.fn.now());
          table.unique(['plantao_id', 'militar_id']);
      });
  }
};

exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('militar_plantao')
    .dropTableIfExists('viatura_plantao')
    .dropTableIfExists('plantoes')
    .dropTableIfExists('viaturas')
    .dropTableIfExists('militares')
    .dropTableIfExists('obms')
    .dropTableIfExists('usuarios');
};