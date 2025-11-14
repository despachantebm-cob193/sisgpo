const db = require('../config/database');
const AppError = require('../utils/AppError');
const { normalizeText } = require('../utils/textUtils');

const ACCENT_FROM = 'ÁÀÃÂÄáàãâäÉÈÊËéèêëÍÌÎÏíìîïÓÒÕÔÖóòõôöÚÙÛÜúùûüÇçÑñ';
const ACCENT_TO = 'AAAAAaaaaaEEEEeeeeIIIIiiiiOOOOOoooooUUUUuuuuCcNn';

const ensureBaseCivilForMedico = async (trx, medico) => {
  const payload = {
    medico_id: medico.id,
    nome_completo: medico.nome_completo,
    funcao: medico.funcao,
    telefone: medico.telefone,
    observacoes: medico.observacoes,
    ativo: typeof medico.ativo === 'boolean' ? medico.ativo : true,
    status_servico: 'Presente',
  };

  const existente = await trx('civis')
    .where({ medico_id: medico.id })
    .whereNull('entrada_servico')
    .whereNull('saida_servico')
    .first();

  if (existente) {
    await trx('civis')
      .where({ id: existente.id })
      .update({ ...payload, updated_at: trx.fn.now() });
    return existente;
  }

  const [registrado] = await trx('civis').insert(payload).returning('*');
  return registrado;
};

const deleteBaseCivilForMedico = async (trx, medicoId) => {
  await trx('civis')
    .where({ medico_id: medicoId })
    .whereNull('entrada_servico')
    .whereNull('saida_servico')
    .del();
};

const medicoController = {
  getAll: async (req, res) => {
    const { q, page = 1, limit = 20 } = req.query;
    const query = db('medicos').select('*').orderBy('nome_completo', 'asc');

    if (q) {
      const normalizedQ = normalizeText(q);
      query.where(builder => {
        builder.where(db.raw(`translate(lower(coalesce(nome_completo, '')), ?, ?) LIKE ?`, [ACCENT_FROM, ACCENT_TO, `%${normalizedQ}%`]))
               .orWhere(db.raw(`translate(lower(coalesce(funcao, '')), ?, ?) LIKE ?`, [ACCENT_FROM, ACCENT_TO, `%${normalizedQ}%`]))
               .orWhere(db.raw(`translate(lower(coalesce(telefone, '')), ?, ?) LIKE ?`, [ACCENT_FROM, ACCENT_TO, `%${normalizedQ}%`]));
      });
    }

    const countQuery = query.clone().clearSelect().count('* as count').first();
    const total = await countQuery;
    const totalPages = Math.ceil(Number(total.count) / limit);
    const medicos = await query.offset((page - 1) * limit).limit(limit);

    res.status(200).json({
      data: medicos,
      pagination: {
        currentPage: Number(page),
        totalPages,
        totalRecords: Number(total.count),
      },
    });
  },

  create: async (req, res) => {
    const { nome_completo, funcao, telefone, observacoes } = req.body;

    if (!nome_completo || !funcao) {
      throw new AppError('Nome completo e funcao sao obrigatorios.', 400);
    }

    const novoMedico = await db.transaction(async (trx) => {
      const [registrado] = await trx('medicos')
        .insert({
          nome_completo,
          funcao,
          telefone,
          observacoes,
          ativo: true,
        })
        .returning('*');

      await ensureBaseCivilForMedico(trx, registrado);
      return registrado;
    });

    res.status(201).json(novoMedico);
  },

  update: async (req, res) => {
    const { id } = req.params;
    const { nome_completo, funcao, telefone, observacoes, ativo } = req.body;

    const medico = await db('medicos').where({ id }).first();
    if (!medico) {
      throw new AppError('Medico nao encontrado.', 404);
    }

    const medicoAtualizado = await db.transaction(async (trx) => {
      const [registroAtualizado] = await trx('medicos')
        .where({ id })
        .update(
          {
            nome_completo,
            funcao,
            telefone,
            observacoes,
            ativo,
          },
          '*',
        );

      await ensureBaseCivilForMedico(trx, registroAtualizado);
      return registroAtualizado;
    });

    res.status(200).json(medicoAtualizado);
  },

  delete: async (req, res) => {
    const { id } = req.params;

    await db.transaction(async (trx) => {
      const medico = await trx('medicos').where({ id }).first();
      if (!medico) {
        throw new AppError('Medico nao encontrado.', 404);
      }

      await deleteBaseCivilForMedico(trx, id);
      await trx('medicos').where({ id }).del();
    });

    res.status(200).json({ message: 'Medico removido com sucesso.' });
  },

  toggleActive: async (req, res) => {
    const { id } = req.params;

    const { medico, novoStatus } = await db.transaction(async (trx) => {
      const registro = await trx('medicos').where({ id }).first();
      if (!registro) {
        throw new AppError('Medico nao encontrado.', 404);
      }

      const status = !registro.ativo;
      await trx('medicos').where({ id }).update({ ativo: status });
      await trx('civis')
        .where({ medico_id: id })
        .whereNull('entrada_servico')
        .whereNull('saida_servico')
        .update({ ativo: status, updated_at: trx.fn.now() });

      return { medico: registro, novoStatus: status };
    });

    res.status(200).json({
      message: `Medico ${novoStatus ? 'ativado' : 'desativado'} com sucesso.`,
      medico: { ...medico, ativo: novoStatus },
    });
  },

  search: async (req, res) => {
    const { term } = req.query;
    const query = db('medicos').select('*');

    if (term) {
      const normalizedTerm = normalizeText(term);
      query.where(db.raw(`translate(lower(coalesce(nome_completo, '')), ?, ?) LIKE ?`, [ACCENT_FROM, ACCENT_TO, `%${normalizedTerm}%`]));
    }

    const medicos = await query;
    res.status(200).json(medicos);
  },
};

module.exports = medicoController;
