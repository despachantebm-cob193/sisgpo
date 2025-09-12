// Arquivo: backend/src/database/seeds/02_escala_aeronaves_seed.js

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function(knex) {
  // 1. Limpa dados existentes para evitar duplicatas
  await knex('escala_aeronaves').del();
  await knex('aeronaves').del();
  // Não vamos deletar militares para não quebrar outras partes

  // 2. Insere as aeronaves
  console.log('[SEED] Inserindo aeronaves de teste...');
  const [aeronave] = await knex('aeronaves').insert([
    { prefixo: 'BOMBEIRO-05', tipo_asa: 'rotativa', ativa: true },
    { prefixo: 'BOMBEIRO-06', tipo_asa: 'rotativa', ativa: true },
  ]).returning('id');

  // 3. Garante que os pilotos de teste existem
  console.log('[SEED] Verificando/Inserindo pilotos de teste...');
  let piloto1 = await knex('militares').where({ matricula: 'PILOTO01' }).first();
  if (!piloto1) {
    [piloto1] = await knex('militares').insert({
      matricula: 'PILOTO01',
      nome_completo: 'Carlos Nobre Piloto',
      nome_guerra: 'Nobre',
      posto_graduacao: '2º Sgt',
      ativo: true,
    }).returning('*');
  }

  let piloto2 = await knex('militares').where({ matricula: 'PILOTO02' }).first();
  if (!piloto2) {
    [piloto2] = await knex('militares').insert({
      matricula: 'PILOTO02',
      nome_completo: 'Ana Clara Aviadora',
      nome_guerra: 'Clara',
      posto_graduacao: '1º Ten',
      ativo: true,
    }).returning('*');
  }

  // 4. Insere a escala de aeronave de exemplo
  console.log('[SEED] Inserindo escala de aeronave de teste...');
  await knex('escala_aeronaves').insert([
    {
      data: '2025-09-12', // Use a data atual ou uma data fixa para teste
      aeronave_id: aeronave.id,
      primeiro_piloto_id: piloto1.id,
      segundo_piloto_id: piloto2.id,
      status: 'Ativa'
    }
  ]);

  console.log('✅ [SEED] Dados de escala de aeronaves inseridos com sucesso!');
};
