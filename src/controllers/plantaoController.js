// Arquivo: backend/src/controllers/plantaoController.js (VERSÃO ATUALIZADA)

const db = require('../config/database');
const AppError = require('../utils/AppError');

// Helpers to handle schema variations across deployments
async function resolvePlantaoVinculoMeta(knex) {
  const hasPm = await knex.schema.hasTable('plantoes_militares').catch(() => false);
  const hasMp = await knex.schema.hasTable('militar_plantao').catch(() => false);
  const table = hasPm ? 'plantoes_militares' : (hasMp ? 'militar_plantao' : null);
  let hasFuncao = false;
  if (table) {
    hasFuncao = await knex.schema.hasColumn(table, 'funcao').catch(() => false);
  }
  return { table, hasFuncao };
}

async function resolvePlantoesDateExpr(knex, alias = 'p.') {
  const [hasDP, hasDI, hasDF] = await Promise.all([
    knex.schema.hasColumn('plantoes', 'data_plantao').catch(() => false),
    knex.schema.hasColumn('plantoes', 'data_inicio').catch(() => false),
    knex.schema.hasColumn('plantoes', 'data_fim').catch(() => false),
  ]);
  const cols = [];
  if (hasDP) cols.push(`${alias}data_plantao`);
  if (hasDI) cols.push(`${alias}data_inicio`);
  if (hasDF) cols.push(`${alias}data_fim`);
  if (cols.length === 0) return null;
  if (cols.length === 1) return cols[0];
  return `COALESCE(${cols.join(', ')})`;
}

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
        const { table: pmTable, hasFuncao } = await resolvePlantaoVinculoMeta(trx);
        if (!pmTable) {
          throw new AppError('Tabela de vinculo de plantao nao encontrada.', 500);
        }
        const guarnicaoParaInserir = guarnicao.map((militar) => {
          const row = {
            plantao_id: novoPlantao.id,
            militar_id: militar.militar_id,
          };
          if (hasFuncao) row.funcao = militar.funcao;
          return row;
        });
        await trx(pmTable).insert(guarnicaoParaInserir);

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
    try {
      const { data_inicio, data_fim, obm_id, all } = req.query;

      const hasPlantoesTable = await db.schema.hasTable('plantoes').catch(() => false);
      if (!hasPlantoesTable) {
        return res.status(200).json({ data: [], pagination: null });
      }

      const [hasViaturaId, hasObmId, hasDataPlantao, hasViaturaPlantao, hasHoraInicio, hasHoraFim, hasDataFim, hasObservacoes] = await Promise.all([
        db.schema.hasColumn('plantoes', 'viatura_id').catch(() => false),
        db.schema.hasColumn('plantoes', 'obm_id').catch(() => false),
        db.schema.hasColumn('plantoes', 'data_plantao').catch(() => false),
        db.schema.hasTable('viatura_plantao').catch(() => false),
        db.schema.hasColumn('plantoes', 'hora_inicio').catch(() => false),
        db.schema.hasColumn('plantoes', 'hora_fim').catch(() => false),
        db.schema.hasColumn('plantoes', 'data_fim').catch(() => false),
        db.schema.hasColumn('plantoes', 'observacoes').catch(() => false),
      ]);

      const query = db('plantoes as p');
      if (hasViaturaId) {
        query.join('viaturas as v', 'p.viatura_id', 'v.id');
      } else if (hasViaturaPlantao) {
        query.leftJoin('viatura_plantao as vp', 'vp.plantao_id', 'p.id')
             .join('viaturas as v', 'vp.viatura_id', 'v.id');
      } else {
        query.leftJoin('viaturas as v', db.raw('1'), db.raw('1'));
      }
      if (hasObmId) {
        query.leftJoin('obms as o', 'p.obm_id', 'o.id');
      } else {
        query.leftJoin('obms as o', function() {
          this.onRaw('LOWER(o.nome) = LOWER(v.obm)');
        });
      }

      // Coluna de data pode variar entre ambientes; se nao existir, usa ID como fallback para ordenar.
      const hasDataInicio = await db.schema.hasColumn('plantoes', 'data_inicio').catch(() => false);
      const dataCol = hasDataPlantao ? 'p.data_plantao' : (hasDataInicio ? 'p.data_inicio' : 'p.id');
      if (data_inicio && dataCol !== 'p.id') query.where(dataCol, '>=', data_inicio);
      if (data_fim && dataCol !== 'p.id') query.where(dataCol, '<=', data_fim);
      if (obm_id) query.where('o.id', '=', obm_id);

      const selectFields = [
        'p.id',
        hasDataPlantao
          ? db.raw('p.data_plantao as data_plantao')
          : hasDataInicio
            ? db.raw('p.data_inicio as data_plantao')
            : db.raw('NULL as data_plantao'),
        'v.prefixo as viatura_prefixo',
        'o.abreviatura as obm_abreviatura',
      ];

      if (hasObservacoes) selectFields.push('p.observacoes');
      if (!hasDataPlantao) selectFields.push('p.data_inicio');
      if (hasDataFim) selectFields.push('p.data_fim');
      if (hasHoraInicio) selectFields.push('p.hora_inicio');
      if (hasHoraFim) selectFields.push('p.hora_fim');

      const baseSelectQuery = query.select(selectFields);

      if (all === 'true') {
        const plantoes = await baseSelectQuery.orderBy(dataCol, 'desc').orderBy('v.prefixo', 'asc');
        const plantaoIds = plantoes.map(p => p.id);

        let guarnicoes = [];
        if (plantaoIds.length > 0) {
          const { table: pmTable, hasFuncao } = await resolvePlantaoVinculoMeta(db);
          if (pmTable) {
            const selectFields = [
              'pm.plantao_id',
              'pm.militar_id',
              hasFuncao ? 'pm.funcao' : db.raw('NULL as funcao'),
              'm.posto_graduacao',
              'm.nome_guerra',
              'm.nome_completo',
              db.raw("COALESCE(NULLIF(TRIM(m.nome_guerra), ''), m.nome_completo) as nome_exibicao"),
              'm.telefone',
            ];
            guarnicoes = await db(`${pmTable} as pm`)
              .join('militares as m', 'pm.militar_id', 'm.id')
              .select(selectFields)
              .whereIn('pm.plantao_id', plantaoIds);
          }
        }

        const guarnicaoMap = guarnicoes.reduce((acc, militar) => {
          if (!acc[militar.plantao_id]) acc[militar.plantao_id] = [];
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

      const countQuery = query.clone().clearSelect().clearOrder().countDistinct({ count: 'p.id' }).first();
      const dataQuery = baseSelectQuery.clone().orderBy(dataCol, 'desc').orderBy('v.prefixo', 'asc').limit(limit).offset(offset);

      const [data, totalResult] = await Promise.all([dataQuery, countQuery]);

      const plantaoIds = data.map(p => p.id);
      let guarnicoes = [];
      if (plantaoIds.length > 0) {
        const { table: pmTableList, hasFuncao: hasFuncaoList } = await resolvePlantaoVinculoMeta(db);
        if (pmTableList) {
          guarnicoes = await db(`${pmTableList} as pm`)
            .join('militares as m', 'pm.militar_id', 'm.id')
            .select(
              'pm.plantao_id',
              'pm.militar_id',
              hasFuncaoList ? 'pm.funcao' : db.raw('NULL as funcao'),
              'm.posto_graduacao',
              'm.nome_guerra',
              'm.nome_completo',
              db.raw("COALESCE(NULLIF(TRIM(m.nome_guerra), ''), m.nome_completo) as nome_exibicao"),
              'm.telefone'
            )
            .whereIn('pm.plantao_id', plantaoIds);
        }
      }

      const guarnicaoMap = guarnicoes.reduce((acc, militar) => {
        if (!acc[militar.plantao_id]) acc[militar.plantao_id] = [];
        acc[militar.plantao_id].push(militar);
        return acc;
      }, {});

      const dataComGuarnicao = data.map(plantao => ({
        ...plantao,
        guarnicao: guarnicaoMap[plantao.id] || [],
      }));

      const totalRecords = parseInt(totalResult?.count ?? 0, 10) || 0;
      const totalPages = Math.ceil(totalRecords / limit);

      res.status(200).json({
        data: dataComGuarnicao,
        pagination: { currentPage: Number(page), perPage: Number(limit), totalPages, totalRecords },
      });
    } catch (error) {
      console.error('Erro em plantaoController.getAll:', error);
      return res.status(200).json({ data: [], pagination: null, message: 'Plantoes indisponiveis no momento.' });
    }
  },

  getById: async (req, res) => {
    const { id } = req.params;
    
    const plantao = await db('plantoes').where({ id }).first();
    if (!plantao) {
      throw new AppError('Plantão não encontrado.', 404);
    }
    
    const { table: pmTableGet, hasFuncao: hasFuncaoGet } = await resolvePlantaoVinculoMeta(db);
    const guarnicao = pmTableGet
      ? await db(`${pmTableGet} as pm`)
          .join('militares as m', 'pm.militar_id', 'm.id')
          .select(
            'pm.militar_id',
            hasFuncaoGet ? 'pm.funcao' : db.raw('NULL as funcao'),
            'm.nome_guerra',
            'm.posto_graduacao',
            'm.nome_completo',
            db.raw("COALESCE(NULLIF(TRIM(m.nome_guerra), ''), m.nome_completo) as nome_exibicao"),
            'm.telefone'
          )
          .where('pm.plantao_id', id)
      : [];
      
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
      
      const { table: pmTableUpd, hasFuncao: hasFuncaoUpd } = await resolvePlantaoVinculoMeta(trx);
      if (pmTableUpd) {
        await trx(pmTableUpd).where({ plantao_id: id }).del();
      }
      if (pmTableUpd && guarnicao && guarnicao.length > 0) {
        const guarnicaoParaInserir = guarnicao.map((militar) => {
          const row = {
            plantao_id: id,
            militar_id: militar.militar_id,
          };
          if (hasFuncaoUpd) row.funcao = militar.funcao;
          return row;
        });
        await trx(pmTableUpd).insert(guarnicaoParaInserir);

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

      const { table: pmTableTotal } = await resolvePlantaoVinculoMeta(db);
      const query = db(`${pmTableTotal} as pm`)
        .join('plantoes as p', 'pm.plantao_id', 'p.id');

      // Apply OBM filter if present
      if (parsedObmId) {
        query.where('p.obm_id', parsedObmId);
      }

      // Apply date filters
      const dateExpr = await resolvePlantoesDateExpr(db, 'p.');
      if (dateExpr) {
        if (parsedDataInicio && parsedDataFim) {
          query.whereRaw(`${dateExpr} BETWEEN ? AND ?`, [parsedDataInicio, parsedDataFim]);
        } else if (parsedDataInicio) {
          query.whereRaw(`${dateExpr} >= ?`, [parsedDataInicio]);
        } else if (parsedDataFim) {
          query.whereRaw(`${dateExpr} <= ?`, [parsedDataFim]);
        } else {
          // Fallback to current day if no date filters are provided
          const hoje = new Date().toISOString().split('T')[0];
          query.whereRaw(`${dateExpr} BETWEEN ? AND ?`, [hoje, hoje]);
        }
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
