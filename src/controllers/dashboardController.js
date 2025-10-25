// sisgpo/src/controllers/dashboardController.js

const db = require('../config/database');
const AppError = require('../utils/AppError');
const { normalizeText } = require('../utils/textUtils');

// Função auxiliar para extrair o tipo da viatura a partir do prefixo
const getTipoViatura = (prefixo) => {
  if (!prefixo) return 'OUTROS';
  const partes = prefixo.split('-');
  if (partes.length > 1 && isNaN(parseInt(partes[0], 10))) {
    return partes[0].toUpperCase();
  }
  if (prefixo.toUpperCase().startsWith('UR')) return 'UR';
  if (prefixo.toUpperCase().startsWith('ABT')) return 'ABT';
  if (prefixo.toUpperCase().startsWith('ASA')) return 'ASA';
  return 'OUTROS';
};

const dashboardController = {
  /**
   * Busca um metadado pela chave.
   */
  getMetadataByKey: async (req, res) => {
    const { key } = req.params;
    const metadata = await db('metadata').where({ key }).first();
    if (!metadata) {
      return res.status(200).json({ key, value: null });
    }
    return res.status(200).json(metadata);
  },

  /**
   * Estatísticas gerais do dashboard.
   */
  getStats: async (req, res) => {
    try {
      const today = new Date();
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

      const totalMilitaresAtivos = await db('militares').where({ ativo: true }).count({ count: '*' }).first();
      const totalViaturasDisponiveis = await db('viaturas').where({ ativa: true }).count({ count: '*' }).first();
      const totalObms = await db('obms').count({ count: '*' }).first();
      let totalMilitaresEmViaturasMesCount = 0;

      try {
        const dateColumnChoices = [
          { table: 'servico_dia', column: 'data_servico' },
          { table: 'servico_dia', column: 'data_plantao' },
          { table: 'servico_dia', column: 'data_inicio' },
        ];

        let availableDateColumn = null;
        for (const { table, column } of dateColumnChoices) {
          // eslint-disable-next-line no-await-in-loop
          const exists = await db.schema.hasColumn(table, column);
          if (exists) {
            availableDateColumn = column;
            break;
          }
        }

        const totalMilitaresQuery = db('servico_dia').whereNotNull('viatura_id');

        if (availableDateColumn) {
          totalMilitaresQuery.whereBetween(availableDateColumn, [firstDayOfMonth, lastDayOfMonth]);
        } else {
          console.warn('[Dashboard] Coluna de data não encontrada em servico_dia; usando contagem total sem filtro de período.');
        }

        const totalMilitaresEmViaturasMes = await totalMilitaresQuery
          .count('id as total')
          .first();
        totalMilitaresEmViaturasMesCount = parseInt(totalMilitaresEmViaturasMes?.total ?? 0, 10);
      } catch (servicoDiaError) {
        console.warn('[Dashboard] Falha ao calcular total_militares_em_viaturas_mes.', servicoDiaError?.message);
      }

      res.status(200).json({
        total_militares_ativos: parseInt(totalMilitaresAtivos.count, 10),
        total_viaturas_disponiveis: parseInt(totalViaturasDisponiveis.count, 10),
        total_obms: parseInt(totalObms.count, 10),
        total_militares_em_viaturas_mes: totalMilitaresEmViaturasMesCount,
      });
    } catch (error) {
      console.error('ERRO AO BUSCAR ESTATÍSTICAS GERAIS:', error);
      throw new AppError('Não foi possível carregar as estatísticas do dashboard.', 500);
    }
  },

  getViaturaStatsPorTipo: async (req, res) => {
    try {
      const viaturasAtivas = await db('viaturas').select('prefixo').where('ativa', true);
      const stats = viaturasAtivas.reduce((acc, vtr) => {
        const tipo = getTipoViatura(vtr.prefixo);
        if (!acc[tipo]) {
          acc[tipo] = { name: tipo, value: 0 };
        }
        acc[tipo].value += 1;
        return acc;
      }, {});
      const chartData = Object.values(stats).sort((a, b) => b.value - a.value);
      res.status(200).json(chartData);
    } catch (error) {
      console.error('ERRO AO BUSCAR ESTATÍSTICAS DE VIATURAS POR TIPO:', error);
      throw new AppError('Não foi possível carregar as estatísticas de viaturas por tipo.', 500);
    }
  },

  getMilitarStats: async (req, res) => {
    try {
      const militaresPorPosto = await db('militares')
        .select('posto_graduacao')
        .count('id as count')
        .where('ativo', true)
        .groupBy('posto_graduacao')
        .orderBy('count', 'desc');

      const formattedData = militaresPorPosto.map((item) => ({
        name: item.posto_graduacao,
        value: parseInt(item.count, 10),
      }));

      res.status(200).json(formattedData);
    } catch (error) {
      console.error('ERRO AO BUSCAR ESTATÍSTICAS DE MILITARES:', error);
      throw new AppError('Não foi possível carregar as estatísticas dos militares.', 500);
    }
  },

  getViaturaStatsDetalhado: async (req, res) => {
    try {
      const viaturasAtivas = await db('viaturas as v')
        .leftJoin('obms as o', 'v.obm', 'o.nome')
        .select('v.prefixo', db.raw('COALESCE(o.abreviatura, v.obm) as local_final'))
        .where('v.ativa', true)
        .orderBy('local_final', 'asc')
        .orderBy('v.prefixo', 'asc');

      const stats = viaturasAtivas.reduce((acc, vtr) => {
        const tipo = getTipoViatura(vtr.prefixo);
        const nomeLocal = vtr.local_final || 'OBM Não Informada';

        if (!acc[tipo]) {
          acc[tipo] = { tipo, quantidade: 0, obms: {} };
        }

        acc[tipo].quantidade += 1;
        if (!acc[tipo].obms[nomeLocal]) {
          acc[tipo].obms[nomeLocal] = [];
        }
        acc[tipo].obms[nomeLocal].push(vtr.prefixo);
        return acc;
      }, {});

      const resultadoFinal = Object.values(stats)
        .map((item) => ({
          ...item,
          obms: Object.entries(item.obms).map(([nome, prefixos]) => ({ nome, prefixos })),
        }))
        .sort((a, b) => a.tipo.localeCompare(b.tipo));

      res.status(200).json(resultadoFinal);
    } catch (error) {
      console.error('ERRO AO BUSCAR ESTATÍSTICAS DETALHADAS DE VIATURAS:', error);
      throw new AppError('Não foi possível carregar as estatísticas detalhadas de viaturas.', 500);
    }
  },

  getViaturaStatsPorObm: async (req, res) => {
    try {
      const [obms, viaturas] = await Promise.all([
        db('obms')
          .select('id', 'nome', 'abreviatura')
          .orderBy('abreviatura', 'asc'),
        db('viaturas as v')
          .leftJoin('obms as o', function () {
            this.on(db.raw('LOWER(v.obm)'), '=', db.raw('LOWER(o.nome)'));
          })
          .select(
            'v.prefixo',
            'v.obm',
            'o.id as matched_obm_id',
            'o.nome as matched_obm_nome',
            'o.abreviatura as matched_obm_abreviatura'
          )
          .where('v.ativa', true),
      ]);

      const obmById = new Map();
      const obmByNormalized = new Map();

      obms.forEach((obm) => {
        obmById.set(obm.id, obm);

      const possibleKeys = new Set();

      const pushKey = (value) => {
        if (!value) return;
        const normalized = normalizeText(value);
        if (normalized) {
          possibleKeys.add(normalized);
        }
      };

      pushKey(obm.nome);
      pushKey(obm.abreviatura);

      if (obm.nome && obm.nome.includes('-')) {
        const firstSegment = obm.nome.split('-')[0].trim();
        pushKey(firstSegment);
      }

      possibleKeys.forEach((key) => {
        if (!obmByNormalized.has(key)) {
          obmByNormalized.set(key, obm);
        }
      });
      });

      const viaturasPorObmId = new Map(obms.map((obm) => [obm.id, []]));
      const viaturasSemObm = [];

      viaturas.forEach((viatura) => {
        const prefixo = viatura.prefixo;
        const viaturaObmId = viatura.matched_obm_id;
        const viaturaObmTexto = viatura.obm || viatura.matched_obm_nome || viatura.matched_obm_abreviatura;

        let matchedObm = null;

        if (viaturaObmId && obmById.has(viaturaObmId)) {
          matchedObm = obmById.get(viaturaObmId);
      } else if (viaturaObmTexto) {
        const keysToTry = [];
        const normalized = normalizeText(viaturaObmTexto);
        if (normalized) keysToTry.push(normalized);
        if (viaturaObmTexto.includes('-')) {
          const firstSegment = viaturaObmTexto.split('-')[0].trim();
          const normalizedFirst = normalizeText(firstSegment);
          if (normalizedFirst) keysToTry.push(normalizedFirst);
        }

        for (const key of keysToTry) {
          if (obmByNormalized.has(key)) {
            matchedObm = obmByNormalized.get(key);
            break;
          }
        }
      }

        if (matchedObm) {
          viaturasPorObmId.get(matchedObm.id).push(prefixo);
        } else {
          viaturasSemObm.push(prefixo);
        }
      });

      const resultadoFinal = obms.map((obm) => {
        const prefixos = viaturasPorObmId.get(obm.id) || [];
        return {
          id: obm.id,
          nome: obm.abreviatura || obm.nome,
          quantidade: prefixos.length,
          prefixos: prefixos.sort((a, b) => a.localeCompare(b)),
        };
      });

      if (viaturasSemObm.length > 0) {
        resultadoFinal.push({
          id: -1,
          nome: 'Sem OBM',
          quantidade: viaturasSemObm.length,
          prefixos: viaturasSemObm.sort((a, b) => a.localeCompare(b)),
        });
      }

      res.status(200).json(resultadoFinal);
    } catch (error) {
      console.error('ERRO AO BUSCAR ESTATÍSTICAS DE VIATURAS POR OBM:', error);
      throw new AppError('Não foi possível carregar as estatísticas de viaturas por OBM.', 500);
    }
  },

  getServicoDia: async (req, res) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    try {
      const latestActiveService = await db('servico_dia')
        .where('data_inicio', '<=', tomorrow.toISOString())
        .andWhere('data_fim', '>=', today.toISOString())
        .orderBy('data_inicio', 'desc')
        .first();

      if (!latestActiveService) {
        return res.status(200).json([]);
      }

      const servicosAtivos = await db('servico_dia as sd')
        .where('sd.data_inicio', latestActiveService.data_inicio);

      const militarIds = servicosAtivos
        .filter((s) => s.pessoa_type === 'militar')
        .map((s) => s.pessoa_id);
      const civilIds = servicosAtivos
        .filter((s) => s.pessoa_type === 'civil')
        .map((s) => s.pessoa_id);

      let militaresData = [];
      if (militarIds.length > 0) {
        militaresData = await db('militares as m')
          .select(
            'm.id',
            'm.posto_graduacao',
            db.raw("COALESCE(NULLIF(TRIM(m.nome_guerra), ''), m.nome_completo) as nome_guerra"),
            'm.telefone',
          )
          .whereIn('m.id', militarIds);
      }

      let civisData = [];
      if (civilIds.length > 0) {
        civisData = await db('civis as c')
          .select('c.id', 'c.nome_completo as nome_guerra', db.raw("'' as posto_graduacao"), 'c.telefone')
          .whereIn('c.id', civilIds);
      }

      const resultadoFinal = servicosAtivos.map((servico) => {
        const pessoaData = servico.pessoa_type === 'militar'
          ? militaresData.find((m) => m.id === servico.pessoa_id)
          : civisData.find((c) => c.id === servico.pessoa_id);

        return {
          funcao: servico.funcao,
          nome_guerra: pessoaData?.nome_guerra || null,
          posto_graduacao: pessoaData?.posto_graduacao || null,
          telefone: pessoaData?.telefone || null,
        };
      });

      res.status(200).json(resultadoFinal);
    } catch (error) {
      console.error('ERRO AO BUSCAR SERVIÇO DO DIA:', error);
      throw new AppError('Não foi possível carregar os dados do serviço de dia.', 500);
    }
  },

  getEscalaAeronaves: async (req, res) => {
    try {
      const hasAeronavesTable = await db.schema.hasTable('aeronaves');
      const hasEscalaTable = await db.schema.hasTable('escala_aeronaves');

      if (!hasAeronavesTable || !hasEscalaTable) {
        return res.status(200).json([]);
      }

      const dataBusca = new Date().toISOString().split('T')[0];
      const escala = await db('escala_aeronaves as ea')
        .leftJoin('aeronaves as a', 'ea.aeronave_id', 'a.id')
        .leftJoin('militares as p1', 'ea.primeiro_piloto_id', 'p1.id')
        .leftJoin('militares as p2', 'ea.segundo_piloto_id', 'p2.id')
        .where('ea.data', dataBusca)
        .select(
          'a.prefixo',
          'a.tipo_asa',
          'ea.status',
          db.raw("COALESCE(p1.posto_graduacao || ' ' || NULLIF(TRIM(p1.nome_guerra), ''), p1.posto_graduacao || ' ' || p1.nome_completo, 'N/A') as primeiro_piloto"),
          db.raw("COALESCE(p2.posto_graduacao || ' ' || NULLIF(TRIM(p2.nome_guerra), ''), p2.posto_graduacao || ' ' || p2.nome_completo, 'N/A') as segundo_piloto"),
        )
        .orderBy('a.prefixo', 'asc');

      res.status(200).json(escala);
    } catch (error) {
      console.error('ERRO AO BUSCAR ESCALA DE AERONAVES:', error);
      throw new AppError('Não foi possível carregar a escala de aeronaves.', 500);
    }
  },

  getEscalaCodec: async (req, res) => {
    try {
      const hasEscalaCodecTable = await db.schema.hasTable('escala_codec');

      if (!hasEscalaCodecTable) {
        return res.status(200).json([]);
      }

      const dataBusca = new Date().toISOString().split('T')[0];
      const escala = await db('escala_codec as ec')
        .join('militares as m', 'ec.militar_id', 'm.id')
        .where('ec.data', dataBusca)
        .select(
          'ec.turno',
          'ec.ordem_plantonista',
          db.raw("m.posto_graduacao || ' ' || COALESCE(NULLIF(TRIM(m.nome_guerra), ''), m.nome_completo) as nome_plantonista"),
        )
        .orderBy('ec.turno', 'asc')
        .orderBy('ec.ordem_plantonista', 'asc');

      res.status(200).json(escala);
    } catch (error) {
      console.error('ERRO AO BUSCAR ESCALA DO CODEC:', error);
      throw new AppError('Não foi possível carregar a escala do CODEC.', 500);
    }
  },

  getDashboardData: async (req, res) => {
    try {
      const [totalMilitares] = await db('militares').count('id as total');
      const [totalViaturas] = await db('viaturas').count('id as total');
      const [totalObms] = await db('obms').count('id as total');

      const viaturasPorObm = await db('viaturas')
        .join('obms', 'viaturas.obm_id', 'obms.id')
        .select('obms.abreviatura as obm')
        .count('viaturas.id as total')
        .groupBy('obms.abreviatura')
        .orderBy('total', 'desc');

      const todasViaturas = await db('viaturas').select('prefixo');
      const tiposDeViaturaAgregado = todasViaturas.reduce((acc, vtr) => {
        const tipo = getTipoViatura(vtr.prefixo);
        acc[tipo] = (acc[tipo] || 0) + 1;
        return acc;
      }, {});

      const tiposDeViatura = Object.entries(tiposDeViaturaAgregado)
        .map(([tipo, total]) => ({ tipo, total }))
        .sort((a, b) => b.total - a.total);

      const dashboardData = {
        totalMilitares: parseInt(totalMilitares.total, 10),
        totalViaturas: parseInt(totalViaturas.total, 10),
        totalObms: parseInt(totalObms.total, 10),
        viaturasPorObm,
        tiposDeViatura,
      };

      return res.json(dashboardData);
    } catch (error) {
      console.error('Erro ao buscar dados do dashboard para integração:', error);
      throw new AppError('Erro interno ao buscar dados do dashboard para integração.', 500);
    }
  },
};

module.exports = dashboardController;
