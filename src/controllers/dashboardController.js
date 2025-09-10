// Arquivo: backend/src/controllers/dashboardController.js (VERSÃO CORRIGIDA)

const db = require('../config/database');
const AppError = require('../utils/AppError');

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
  getStats: async (req, res) => {
    const { obm_id } = req.query;
    try {
      // --- CORREÇÃO APLICADA AQUI ---
      // Inicia as queries sem aplicar o filtro ainda
      const militaresQuery = db('militares').where({ ativo: true });
      const viaturasQuery = db('viaturas').where({ ativa: true });

      // Se um obm_id for fornecido, busca o nome da OBM e aplica o filtro correto
      if (obm_id) {
        const obm = await db('obms').where({ id: obm_id }).first();
        if (obm) {
          // Filtra 'militares' pela coluna 'obm_nome'
          militaresQuery.where({ obm_nome: obm.nome });
          // Filtra 'viaturas' pela coluna 'obm' (que também é o nome)
          viaturasQuery.where({ obm: obm.nome });
        }
      }
      // --- FIM DA CORREÇÃO ---

      const totalMilitaresAtivos = militaresQuery.count({ count: '*' }).first();
      const totalViaturasDisponiveis = viaturasQuery.count({ count: '*' }).first();

      // Queries que não dependem do filtro de OBM
      const totalObms = db('obms').count({ count: '*' }).first();
      const totalPlantoesMes = db.raw(
        "SELECT COUNT(*) FROM plantoes WHERE date_trunc('month', data_plantao) = date_trunc('month', CURRENT_DATE)"
      ).then(res => res.rows[0]);

      const [militaresResult, viaturasResult, obmsResult, plantoesResult] = await Promise.all([
        totalMilitaresAtivos,
        totalViaturasDisponiveis,
        totalObms,
        totalPlantoesMes
      ]);

      const formattedStats = {
        total_militares_ativos: parseInt(militaresResult.count, 10),
        total_viaturas_disponiveis: parseInt(viaturasResult.count, 10),
        total_obms: parseInt(obmsResult.count, 10),
        total_plantoes_mes: parseInt(plantoesResult.count, 10),
      };
      res.status(200).json(formattedStats);
    } catch (error) {
      console.error("ERRO AO BUSCAR ESTATÍSTICAS GERAIS:", error);
      throw new AppError("Não foi possível carregar as estatísticas do dashboard.", 500);
    }
  },

  getMilitarStats: async (req, res) => {
    const { obm_id } = req.query;
    try {
      const query = db('militares')
        .select('posto_graduacao')
        .count('id as count')
        .where('ativo', true)
        .groupBy('posto_graduacao')
        .orderBy('count', 'desc');

      // --- CORREÇÃO APLICADA AQUI ---
      if (obm_id) {
        const obm = await db('obms').where({ id: obm_id }).first();
        if (obm) {
          // Filtra pela coluna de texto 'obm_nome'
          query.andWhere({ obm_nome: obm.nome });
        }
      }
      // --- FIM DA CORREÇÃO ---

      const militaresPorPosto = await query;
      const formattedData = militaresPorPosto.map(item => ({
        name: item.posto_graduacao,
        value: parseInt(item.count, 10),
      }));
      res.status(200).json(formattedData);
    } catch (error) {
      console.error("ERRO AO BUSCAR ESTATÍSTICAS DE MILITARES:", error);
      throw new AppError("Não foi possível carregar as estatísticas dos militares.", 500);
    }
  },

  getViaturaStatsPorTipo: async (req, res) => {
    const { obm_id } = req.query;
    try {
      const query = db('viaturas').select('prefixo').where('ativa', true);
      
      // --- CORREÇÃO APLICADA AQUI ---
      if (obm_id) {
        const obm = await db('obms').where({ id: obm_id }).first();
        if (obm) {
          // Filtra pela coluna de texto 'obm'
          query.andWhere({ obm: obm.nome });
        }
      }
      // --- FIM DA CORREÇÃO ---

      const viaturasAtivas = await query;

      const stats = viaturasAtivas.reduce((acc, vtr) => {
        const tipo = getTipoViatura(vtr.prefixo);
        if (!acc[tipo]) {
          acc[tipo] = { name: tipo, value: 0 };
        }
        acc[tipo].value++;
        return acc;
      }, {});

      const chartData = Object.values(stats).sort((a, b) => b.value - a.value);
      res.status(200).json(chartData);
    } catch (error) {
      console.error("ERRO AO BUSCAR ESTATÍSTICAS DE VIATURAS POR TIPO:", error);
      throw new AppError("Não foi possível carregar as estatísticas de viaturas por tipo.", 500);
    }
  },

  // As outras funções (getViaturaStatsDetalhado, getViaturaStatsPorObm, getMetadataByKey) não precisam de alteração,
  // pois já usam a coluna de texto ou não são afetadas pelo filtro.
  
  getViaturaStatsDetalhado: async (req, res) => {
    const { obm_id } = req.query;
    try {
      const query = db('viaturas as v')
        .leftJoin('obms as o', 'v.obm', 'o.nome')
        .select(
          'v.prefixo',
          db.raw('COALESCE(o.abreviatura, v.obm) as local_final')
        )
        .where('v.ativa', true)
        .orderBy('local_final', 'asc')
        .orderBy('v.prefixo', 'asc');

      if (obm_id) {
        const obm = await db('obms').where({ id: obm_id }).first();
        if (obm) {
          query.andWhere('v.obm', obm.nome);
        }
      }

      const viaturasAtivas = await query;

      const stats = viaturasAtivas.reduce((acc, vtr) => {
        const tipo = getTipoViatura(vtr.prefixo);
        const nomeLocal = vtr.local_final || 'OBM Não Informada';

        if (!acc[tipo]) {
          acc[tipo] = { tipo: tipo, quantidade: 0, obms: {} };
        }
        
        acc[tipo].quantidade++;

        if (!acc[tipo].obms[nomeLocal]) {
          acc[tipo].obms[nomeLocal] = [];
        }
        
        acc[tipo].obms[nomeLocal].push(vtr.prefixo);
        
        return acc;
      }, {});

      const resultadoFinal = Object.values(stats).map(item => ({
        ...item,
        obms: Object.entries(item.obms).map(([nome, prefixos]) => ({ nome, prefixos }))
      })).sort((a, b) => a.tipo.localeCompare(b.tipo));

      res.status(200).json(resultadoFinal);

    } catch (error) {
      console.error("ERRO AO BUSCAR ESTATÍSTICAS DETALHADAS DE VIATURAS:", error);
      throw new AppError("Não foi possível carregar as estatísticas detalhadas de viaturas.", 500);
    }
  },

  getViaturaStatsPorObm: async (req, res) => {
    try {
      const [obms, viaturas] = await Promise.all([
        db('obms').select('id', 'nome', 'abreviatura').orderBy('abreviatura', 'asc'),
        db('viaturas').select('prefixo', 'obm as nome_obm').where('ativa', true)
      ]);
  
      const viaturasPorNomeObm = viaturas.reduce((acc, vtr) => {
        const nomeObm = vtr.nome_obm || 'Sem OBM';
        if (!acc[nomeObm]) {
          acc[nomeObm] = [];
        }
        acc[nomeObm].push(vtr.prefixo);
        return acc;
      }, {});
  
      const resultadoFinal = obms.map(obm => {
        const prefixos = viaturasPorNomeObm[obm.nome] || [];
        return {
          id: obm.id,
          nome: obm.abreviatura,
          quantidade: prefixos.length,
          prefixos: prefixos.sort(),
        };
      });
  
      res.status(200).json(resultadoFinal);
  
    } catch (error) {
      console.error("ERRO AO BUSCAR ESTATÍSTICAS DE VIATURAS POR OBM:", error);
      throw new AppError("Não foi possível carregar as estatísticas de viaturas por OBM.", 500);
    }
  },

  getMetadataByKey: async (req, res) => {
    const { key } = req.params;
    try {
      const metadata = await db('metadata').where({ key }).first();
      if (!metadata) {
        return res.status(404).json({ message: 'Metadado não encontrado.' });
      }
      res.status(200).json(metadata);
    } catch (error) {
      console.error(`ERRO AO BUSCAR METADADO '${key}':`, error);
      throw new AppError('Não foi possível buscar a informação de metadados.', 500);
    }
  },
};

module.exports = dashboardController;
