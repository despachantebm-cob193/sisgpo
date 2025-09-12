// Arquivo: src/controllers/escalaAeronaveController.js (VERSÃO CORRIGIDA)

const db = require('../config/database');
const AppError = require('../utils/AppError');

const escalaAeronaveController = {
  // LISTAR todas as escalas (com filtro de data)
  getAll: async (req, res) => {
    const { data_inicio, data_fim } = req.query;
    const query = db('escala_aeronaves as ea')
      .leftJoin('aeronaves as a', 'ea.aeronave_id', 'a.id')
      .leftJoin('militares as p1', 'ea.primeiro_piloto_id', 'p1.id')
      .leftJoin('militares as p2', 'ea.segundo_piloto_id', 'p2.id')
      .select(
        'ea.id',
        'ea.data',
        'a.prefixo as aeronave_prefixo',
        'ea.status',
        // --- CORREÇÃO APLICADA AQUI ---
        // Garante a concatenação do posto com o nome de guerra para ambos os pilotos.
        // Usa COALESCE para tratar casos onde o piloto não está escalado.
        db.raw("COALESCE(p1.posto_graduacao || ' ' || p1.nome_guerra, 'N/A') as primeiro_piloto"),
        db.raw("COALESCE(p2.posto_graduacao || ' ' || p2.nome_guerra, 'N/A') as segundo_piloto")
        // --- FIM DA CORREÇÃO ---
      );

    if (data_inicio) query.where('ea.data', '>=', data_inicio);
    if (data_fim) query.where('ea.data', '<=', data_fim);

    const escalas = await query.orderBy('ea.data', 'desc');
    res.status(200).json(escalas);
  },

  // Função CREATE (sem alterações, já estava correta)
  create: async (req, res) => {
    const { aeronave_id, aeronave_prefixo, data, status, primeiro_piloto_id, segundo_piloto_id } = req.body;

    if (!aeronave_id || !aeronave_prefixo) {
        throw new AppError('ID da aeronave ou prefixo não fornecido.', 400);
    }

    await db.transaction(async trx => {
      let aeronave = await trx('aeronaves').where({ prefixo: aeronave_prefixo }).first();

      if (!aeronave) {
        [aeronave] = await trx('aeronaves').insert({
          prefixo: aeronave_prefixo,
          tipo_asa: 'rotativa',
          ativa: true,
        }).returning('*');
      }

      const existing = await trx('escala_aeronaves').where({ data, aeronave_id: aeronave.id }).first();
      if (existing) {
        throw new AppError('Já existe uma escala para esta aeronave nesta data.', 409);
      }

      const [novaEscala] = await trx('escala_aeronaves').insert({
        data,
        aeronave_id: aeronave.id,
        status,
        primeiro_piloto_id: primeiro_piloto_id || null,
        segundo_piloto_id: segundo_piloto_id || null,
      }).returning('*');

      res.status(201).json(novaEscala);
    });
  },

  // Função DELETE (sem alterações)
  delete: async (req, res) => {
    const { id } = req.params;
    const result = await db('escala_aeronaves').where({ id }).del();
    if (result === 0) {
      throw new AppError('Registro de escala não encontrado.', 404);
    }
    res.status(204).send();
  },
};

module.exports = escalaAeronaveController;
