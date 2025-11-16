// Arquivo: backend/src/controllers/plantaoController.js (VERSÃO ATUALIZADA)

const db = require('../config/database');
const AppError = require('../utils/AppError');

const parsePositiveInt = (value) => {
  const numericValue = Number(value);
  return Number.isInteger(numericValue) && numericValue > 0 ? numericValue : null;
};

const sanitizeStringToken = (token) => {
  if (!token) return null;
  return token
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toUpperCase();
};

const buildPlantaoNome = (prefixo, dataPlantao, viaturaId) => {
  const fallback = `VTR-${viaturaId}`;
  const token = sanitizeStringToken(prefixo) || sanitizeStringToken(fallback) || `PLANTAO-${viaturaId}`;
  return `PLANTAO-${token}-${dataPlantao}`;
};

const normalizeHorarioInput = (value) => {
  if (value === undefined || value === null) {
    return null;
  }
  const trimmed = String(value).trim();
  return trimmed.length ? trimmed : null;
};

const resolveViaturaContext = async (trx, viaturaId, providedObmId) => {
  const viaturaData = await trx('viaturas as v')
    .leftJoin('obms as o', 'v.obm', 'o.nome')
    .select('v.prefixo', 'v.obm', 'o.id as obm_id')
    .where('v.id', viaturaId)
    .first();

  if (!viaturaData) {
    throw new AppError('Viatura não encontrada.', 404);
  }

  let resolvedObmId = parsePositiveInt(providedObmId) || viaturaData.obm_id;

  if (!resolvedObmId && viaturaData.obm) {
    const obmMatch = await trx('obms')
      .whereRaw('LOWER(nome) = LOWER(?)', [viaturaData.obm])
      .first();
    if (obmMatch) {
      resolvedObmId = obmMatch.id;
    }
  }

  if (!resolvedObmId) {
    throw new AppError(
      'Não foi possível identificar a OBM vinculada à viatura selecionada. Atualize o cadastro da viatura e tente novamente.',
      400
    );
  }

  return {
    obmId: resolvedObmId,
    prefixo: viaturaData.prefixo,
  };
};

const plantaoController = {
  create: async (req, res) => {
    const { data_plantao, viatura_id, obm_id, observacoes, guarnicao, hora_inicio, hora_fim } = req.body;
    
    await db.transaction(async trx => {
      const plantaoExists = await trx('plantoes').where({ data_plantao, viatura_id }).first();
      if (plantaoExists) {
        throw new AppError('Já existe um plantão cadastrado para esta viatura nesta data.', 409);
      }

      const { obmId, prefixo } = await resolveViaturaContext(trx, viatura_id, obm_id);
      const plantaoNome = buildPlantaoNome(prefixo, data_plantao, viatura_id);
      const horaInicioNormalized = normalizeHorarioInput(hora_inicio);
      const horaFimNormalized = normalizeHorarioInput(hora_fim);

      const [novoPlantao] = await trx('plantoes')
        .insert({
          nome: plantaoNome,
          tipo: 'VIATURA',
          data_inicio: data_plantao,
          data_fim: data_plantao,
          data_plantao,
          viatura_id,
          obm_id: obmId,
          hora_inicio: horaInicioNormalized,
          hora_fim: horaFimNormalized,
          observacoes,
        })
        .returning('*');
      
      if (guarnicao && guarnicao.length > 0) {
        const guarnicaoParaInserir = guarnicao.map(militar => ({
          plantao_id: novoPlantao.id,
          militar_id: militar.militar_id,
          funcao: militar.funcao,
        }));
        await trx('plantoes_militares').insert(guarnicaoParaInserir);

        // --- LÓGICA DE ATUALIZAÇÃO DE TELEFONE (CREATE) ---
        for (const militar of guarnicao) {
          if (militar.militar_id && militar.telefone) {
            await trx('militares')
              .where('id', militar.militar_id)
              .update({ telefone: militar.telefone });
          }
        }
        // --- FIM DA LÓGICA ---
      }
      
      res.status(201).json({ ...novoPlantao, guarnicao });
    });
  },

  getAll: async (req, res) => {
    const { data_inicio, data_fim, obm_id, all } = req.query;
    
    const query = db('plantoes as p')
      .join('viaturas as v', 'p.viatura_id', 'v.id')
      .join('obms as o', 'p.obm_id', 'o.id');

    const dataCol = db.raw('COALESCE(p.data_plantao, p.data_inicio)');
    if (data_inicio) query.where(dataCol, '>=', data_inicio);
    if (data_fim) query.where(dataCol, '<=', data_fim);
    if (obm_id) query.where('p.obm_id', '=', obm_id);

    const baseSelectQuery = query
      .select(
        'p.id', db.raw('COALESCE(p.data_plantao, p.data_inicio) as data_plantao'), 'p.observacoes', 'p.data_inicio', 'p.data_fim', 'p.hora_inicio', 'p.hora_fim',
        'v.prefixo as viatura_prefixo',
        'o.abreviatura as obm_abreviatura'
      );

    if (all === 'true') {
        const plantoes = await baseSelectQuery.orderBy(dataCol, 'desc').orderBy('v.prefixo', 'asc');
        const plantaoIds = plantoes.map(p => p.id);
                const guarnicoes = await db('plantoes_militares as pm')
                  .join('militares as m', 'pm.militar_id', 'm.id')
                  .select(
                    'pm.plantao_id',
                    'pm.militar_id',
                    'pm.funcao',
                    'm.posto_graduacao',
                    'm.nome_guerra',
                    'm.nome_completo',
                    db.raw("COALESCE(NULLIF(TRIM(m.nome_guerra), ''), m.nome_completo) as nome_exibicao"),
                    'm.telefone'
                  )
                  .whereIn('pm.plantao_id', plantaoIds);
        
                const guarnicaoMap = guarnicoes.reduce((acc, militar) => {
                  if (!acc[militar.plantao_id]) {
                    acc[militar.plantao_id] = [];
                  }
                  acc[militar.plantao_id].push(militar);
                  return acc;
                }, {});
        
                const plantoesComGuarnicao = plantoes.map(plantao => ({
                  ...plantao,
                  guarnicao: guarnicaoMap[plantao.id] || [],
                }));
        
                return res.status(200).json({ data: plantoesComGuarnicao, pagination: null });
            }
        
            const page = parseInt(req.query.page, 10) || 1;
            const limit = parseInt(req.query.limit, 10) || 20;
            const offset = (page - 1) * limit;
        
            const countQuery = query.clone().clearSelect().clearOrder().count({ count: 'p.id' }).first();
            const dataQuery = baseSelectQuery.clone().orderBy(dataCol, 'desc').orderBy('v.prefixo', 'asc').limit(limit).offset(offset);
        
            const [data, totalResult] = await Promise.all([dataQuery, countQuery]);
        
            const plantaoIds = data.map(p => p.id);
            const guarnicoes = await db('plantoes_militares as pm')
              .join('militares as m', 'pm.militar_id', 'm.id')
              .select(
                    'pm.plantao_id',
                    'pm.militar_id',
                    'pm.funcao',
                    'm.posto_graduacao',
                    'm.nome_guerra',
                    'm.nome_completo',
                    db.raw("COALESCE(NULLIF(TRIM(m.nome_guerra), ''), m.nome_completo) as nome_exibicao"),
                    'm.telefone'
              )
              .whereIn('pm.plantao_id', plantaoIds);
        
            const guarnicaoMap = guarnicoes.reduce((acc, militar) => {
              if (!acc[militar.plantao_id]) {
                    acc[militar.plantao_id] = [];
              }
              acc[militar.plantao_id].push(militar);
              return acc;
            }, {});
    const dataComGuarnicao = data.map(plantao => ({
      ...plantao,
      guarnicao: guarnicaoMap[plantao.id] || [],
    }));

    const totalRecords = parseInt(totalResult.count, 10);
    const totalPages = Math.ceil(totalRecords / limit);

    res.status(200).json({
      data: dataComGuarnicao,
      pagination: { currentPage: Number(page), perPage: Number(limit), totalPages, totalRecords },
    });
  },

  getById: async (req, res) => {
    const { id } = req.params;
    
    const plantao = await db('plantoes').where({ id }).first();
    if (!plantao) {
      throw new AppError('Plantão não encontrado.', 404);
    }
    
    const guarnicao = await db('plantoes_militares as pm')
      .join('militares as m', 'pm.militar_id', 'm.id')
      .select('pm.militar_id', 'pm.funcao', 'm.nome_guerra', 'm.posto_graduacao', 'm.nome_completo', db.raw("COALESCE(NULLIF(TRIM(m.nome_guerra), ''), m.nome_completo) as nome_exibicao"), 'm.telefone')
      .where('pm.plantao_id', id);
      
    res.status(200).json({ ...plantao, guarnicao });
  },

  update: async (req, res) => {
    const { id } = req.params;
    const { data_plantao, viatura_id, obm_id, observacoes, guarnicao, hora_inicio, hora_fim } = req.body;

    await db.transaction(async trx => {
      const plantaoExists = await trx('plantoes').where({ id }).first();
      if (!plantaoExists) {
        throw new AppError('Plantão não encontrado.', 404);
      }

      const conflictExists = await trx('plantoes')
        .where({ data_plantao, viatura_id })
        .andWhere('id', '!=', id)
        .first();
      if (conflictExists) {
        throw new AppError('Já existe um plantão cadastrado para esta viatura nesta data.', 409);
      }

      const { obmId, prefixo } = await resolveViaturaContext(trx, viatura_id, obm_id);
      const plantaoNome = buildPlantaoNome(prefixo, data_plantao, viatura_id);
      const horaInicioNormalized = normalizeHorarioInput(hora_inicio);
      const horaFimNormalized = normalizeHorarioInput(hora_fim);

      await trx('plantoes')
        .where({ id })
        .update({
          nome: plantaoNome,
          tipo: plantaoExists.tipo || 'VIATURA',
          data_inicio: data_plantao,
          data_fim: data_plantao,
          data_plantao,
          viatura_id,
          obm_id: obmId,
          hora_inicio: horaInicioNormalized,
          hora_fim: horaFimNormalized,
          observacoes,
          updated_at: db.fn.now(),
        });
      
      await trx('plantoes_militares').where({ plantao_id: id }).del();
      if (guarnicao && guarnicao.length > 0) {
        const guarnicaoParaInserir = guarnicao.map(militar => ({
          plantao_id: id,
          militar_id: militar.militar_id,
          funcao: militar.funcao,
        }));
        await trx('plantoes_militares').insert(guarnicaoParaInserir);

        // --- LÓGICA DE ATUALIZAÇÃO DE TELEFONE (UPDATE) ---
        for (const militar of guarnicao) {
          if (militar.militar_id && militar.telefone) {
            await trx('militares')
              .where('id', militar.militar_id)
              .update({ telefone: militar.telefone });
          }
        }
        // --- FIM DA LÓGICA ---
      }
    });

    res.status(200).json({ message: 'Plantao atualizado com sucesso.' });
  },

  addViatura: async () => {
    throw new AppError(
      'O endpoint /plantoes/:id/add-viatura foi descontinuado. Utilize PUT /plantoes/:id para atualizar o plantao.',
      410
    );
  },

  removeViatura: async () => {
    throw new AppError(
      'O endpoint /plantoes/:plantaoId/remove-viatura/:viaturaId foi descontinuado. Utilize PUT /plantoes/:id para atualizar o plantao.',
      410
    );
  },

  addMilitar: async () => {
    throw new AppError(
      'O endpoint /plantoes/:id/add-militar foi descontinuado. Utilize PUT /plantoes/:id para atualizar o plantao.',
      410
    );
  },

  removeMilitar: async () => {
    throw new AppError(
      'O endpoint /plantoes/:plantaoId/remove-militar/:militarId foi descontinuado. Utilize PUT /plantoes/:id para atualizar o plantao.',
      410
    );
  },

  delete: async (req, res) => {
    const { id } = req.params;
    const result = await db('plantoes').where({ id }).del();
    if (result === 0) {
      throw new AppError('Plantão não encontrado.', 404);
    }
    res.status(204).send();
  },

  getTotalMilitaresPlantao: async (req, res) => {
    try {
      let { data_inicio, data_fim, obm_id } = req.query;

      // Clean and validate filters
      const parsedDataInicio = (typeof data_inicio === 'string' && data_inicio.trim() !== '') ? data_inicio.trim() : null;
      const parsedDataFim = (typeof data_fim === 'string' && data_fim.trim() !== '') ? data_fim.trim() : null;
      const parsedObmId = parsePositiveInt(obm_id);

      const query = db('plantoes_militares as pm')
        .join('plantoes as p', 'pm.plantao_id', 'p.id');

      // Apply OBM filter if present
      if (parsedObmId) {
        query.where('p.obm_id', parsedObmId);
      }

      // Apply date filters
      if (parsedDataInicio && parsedDataFim) {
        query.whereBetween('p.data_plantao', [parsedDataInicio, parsedDataFim]);
      } else if (parsedDataInicio) {
        query.where('p.data_plantao', '>=', parsedDataInicio);
      } else if (parsedDataFim) {
        query.where('p.data_plantao', '<=', parsedDataFim);
      } else {
        // Fallback to current day if no date filters are provided
        const hoje = new Date().toISOString().split('T')[0];
        query.whereBetween('p.data_plantao', [hoje, hoje]);
      }

      const result = await query.countDistinct('pm.militar_id as total').first();
      const totalMilitares = parseInt(result?.total ?? 0, 10);

      res.status(200).json({ totalMilitares });
    } catch (error) {
      console.error('ERRO AO BUSCAR TOTAL DE MILITARES EM PLANTÃO:', error);
      throw new AppError('Não foi possível carregar o total de militares em plantão.', 500);
    }
  }

};

module.exports = plantaoController;
