const db = require('../config/database');
const AppError = require('../utils/AppError');

const buildBaseQuery = () =>
  db('escala_codec as ec')
    .join('militares as m', 'ec.militar_id', 'm.id')
    .select(
      'ec.id',
      'ec.data',
      'ec.turno',
      'ec.militar_id',
      'ec.ordem_plantonista',
      db.raw("m.posto_graduacao || ' ' || m.nome_guerra as nome_plantonista")
    );

const splitByTurno = (registros) => {
  const diurno = [];
  const noturno = [];

  registros.forEach((registro) => {
    const destino = registro.turno === 'diurno' ? diurno : noturno;
    destino.push({
      id: registro.id,
      militar_id: registro.militar_id,
      ordem_plantonista: registro.ordem_plantonista,
      nome: registro.nome_plantonista,
    });
  });

  return { diurno, noturno };
};

const prepararPlantonistas = (data, diurno = [], noturno = []) => {
  const inserir = [];

  diurno.forEach((p, index) => {
    if (p && p.militar_id) {
      inserir.push({
        data,
        turno: 'diurno',
        militar_id: p.militar_id,
        ordem_plantonista: typeof p.ordem_plantonista === 'number' ? p.ordem_plantonista : index + 1,
      });
    }
  });

  noturno.forEach((p, index) => {
    if (p && p.militar_id) {
      inserir.push({
        data,
        turno: 'noturno',
        militar_id: p.militar_id,
        ordem_plantonista: typeof p.ordem_plantonista === 'number' ? p.ordem_plantonista : index + 1,
      });
    }
  });

  return inserir;
};

const escalaCodecController = {
  getAll: async (req, res) => {
    const { data_inicio, data_fim } = req.query;
    const query = buildBaseQuery();

    if (data_inicio) {
      query.where('ec.data', '>=', data_inicio);
    }
    if (data_fim) {
      query.where('ec.data', '<=', data_fim);
    }

    const escalas = await query
      .orderBy('ec.data', 'desc')
      .orderBy('ec.turno', 'asc')
      .orderBy('ec.ordem_plantonista', 'asc');

    res.status(200).json(escalas);
  },

  getById: async (req, res) => {
    const { id } = req.params;

    const registro = await db('escala_codec').where({ id }).first();
    if (!registro) {
      throw new AppError('Registro de escala nao encontrado.', 404);
    }

    const registrosDoDia = await buildBaseQuery()
      .where('ec.data', registro.data)
      .orderBy('ec.turno', 'asc')
      .orderBy('ec.ordem_plantonista', 'asc');

    const { diurno, noturno } = splitByTurno(registrosDoDia);

    res.status(200).json({
      id: registro.id,
      data: registro.data,
      diurno,
      noturno,
    });
  },

  create: async (req, res) => {
    const { data, diurno = [], noturno = [] } = req.body;

    if (!data) {
      throw new AppError('A data da escala e obrigatoria.', 400);
    }

    await db.transaction(async (trx) => {
      await trx('escala_codec').where({ data }).del();

      const plantonistas = prepararPlantonistas(data, diurno, noturno);
      if (plantonistas.length > 0) {
        await trx('escala_codec').insert(plantonistas);
      }
    });

    res.status(201).json({ message: 'Escala do CODEC salva com sucesso!' });
  },

  update: async (req, res) => {
    const { id } = req.params;
    const { data, diurno = [], noturno = [] } = req.body;

    const registro = await db('escala_codec').where({ id }).first();
    if (!registro) {
      throw new AppError('Registro de escala nao encontrado.', 404);
    }

    const dataAlvo = data || registro.data;

    await db.transaction(async (trx) => {
      await trx('escala_codec').where({ data: registro.data }).del();

      const plantonistas = prepararPlantonistas(dataAlvo, diurno, noturno);
      if (plantonistas.length > 0) {
        await trx('escala_codec').insert(plantonistas);
      }
    });

    res.status(200).json({ message: 'Escala do CODEC atualizada com sucesso!' });
  },

  delete: async (req, res) => {
    const { id } = req.params;
    const apagado = await db('escala_codec').where({ id }).del();
    if (apagado === 0) {
      throw new AppError('Registro de escala nao encontrado.', 404);
    }
    res.status(204).send();
  },
};

module.exports = escalaCodecController;
