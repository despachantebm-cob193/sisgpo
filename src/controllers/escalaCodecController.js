// Arquivo: src/controllers/escalaCodecController.js (VERSÃO CORRIGIDA)

const db = require('../config/database');
const AppError = require('../utils/AppError');

const escalaCodecController = {
  getAll: async (req, res) => {
    const { data_inicio, data_fim } = req.query;
    const query = db('escala_codec as ec')
      .join('militares as m', 'ec.militar_id', 'm.id')
      .select(
        'ec.id', 'ec.data', 'ec.turno', 'ec.ordem_plantonista',
        db.raw("m.posto_graduacao || ' ' || m.nome_guerra as nome_plantonista")
      );

    if (data_inicio) query.where('ec.data', '>=', data_inicio);
    if (data_fim) query.where('ec.data', '<=', data_fim);

    const escalas = await query.orderBy('ec.data', 'desc').orderBy('ec.turno', 'asc').orderBy('ec.ordem_plantonista', 'asc');
    res.status(200).json(escalas);
  },

  create: async (req, res) => {
    const { data, diurno, noturno } = req.body;

    await db.transaction(async trx => {
      // Limpa escalas existentes para esta data para evitar duplicatas
      await trx('escala_codec').where({ data }).del();

      const plantonistasParaInserir = [];

      // Processa plantonistas diurnos
      diurno.forEach((p, index) => {
        if (p.militar_id) {
          plantonistasParaInserir.push({
            data,
            turno: 'diurno',
            militar_id: p.militar_id,
            ordem_plantonista: index + 1,
          });
        }
      });

      // Processa plantonistas noturnos
      noturno.forEach((p, index) => {
        if (p.militar_id) {
          plantonistasParaInserir.push({
            data,
            turno: 'noturno',
            militar_id: p.militar_id,
            ordem_plantonista: index + 1,
          });
        }
      });

      if (plantonistasParaInserir.length > 0) {
        await trx('escala_codec').insert(plantonistasParaInserir);
      }
    });

    res.status(201).json({ message: 'Escala do CODEC salva com sucesso!' });
  },

  delete: async (req, res) => {
    const { id } = req.params;
    const result = await db('escala_codec').where({ id }).del();
    if (result === 0) throw new AppError('Registro de escala não encontrado.', 404);
    res.status(204).send();
  },
};

module.exports = escalaCodecController;
