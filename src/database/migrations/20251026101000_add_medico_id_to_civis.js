/**
 * Adiciona a coluna `medico_id` na tabela `civis` e sincroniza registros existentes
 * com a tabela `medicos`, permitindo que o cadastro de médicos alimente a escala.
 *
 * @param {import('knex').Knex} knex
 * @returns {Promise<void>}
 */
exports.up = async function up(knex) {
  const hasColumn = await knex.schema.hasColumn('civis', 'medico_id');
  if (!hasColumn) {
    await knex.schema.alterTable('civis', (table) => {
      table
        .integer('medico_id')
        .unsigned()
        .references('id')
        .inTable('medicos')
        .onDelete('SET NULL')
        .index();
    });
  }

  // Sincroniza médicos já cadastrados para garantir que apareçam na busca da escala
  const medicos = await knex('medicos');
  for (const medico of medicos) {
    const baseRegistro = await knex('civis')
      .where({ medico_id: medico.id })
      .whereNull('entrada_servico')
      .whereNull('saida_servico')
      .first();

    const payload = {
      medico_id: medico.id,
      nome_completo: medico.nome_completo,
      funcao: medico.funcao,
      telefone: medico.telefone,
      observacoes: medico.observacoes,
      ativo: medico.ativo ?? true,
      status_servico: medico.status_servico || 'Presente',
    };

    if (baseRegistro) {
      await knex('civis').where({ id: baseRegistro.id }).update({
        ...payload,
        updated_at: knex.fn.now(),
      });
    } else {
      await knex('civis').insert(payload);
    }
  }
};

/**
 * Remove a coluna `medico_id` da tabela `civis`.
 *
 * @param {import('knex').Knex} knex
 * @returns {Promise<void>}
 */
exports.down = async function down(knex) {
  const hasColumn = await knex.schema.hasColumn('civis', 'medico_id');
  if (hasColumn) {
    await knex.schema.alterTable('civis', (table) => {
      table.dropColumn('medico_id');
    });
  }
};

