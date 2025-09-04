const db = require('../config/database');
const AppError = require('../utils/AppError');

// A função auxiliar getTipoViatura permanece a mesma
const getTipoViatura = (prefixo) => {
  const partes = prefixo.split('-');
  if (partes.length > 1) {
    return partes[0].toUpperCase();
  }
  if (prefixo.toUpperCase().startsWith('UR')) return 'UR';
  if (prefixo.toUpperCase().startsWith('ABT')) return 'ABT';
  if (prefixo.toUpperCase().startsWith('ASA')) return 'ASA';
  return 'OUTROS';
};

const dashboardController = {
  // ... outros métodos (getStats, getMilitarStats, etc.) permanecem os mesmos ...
  getStats: async (req, res) => {
    const { obm_id } = req.query;
    try {
      const militaresQuery = db('militares').where({ ativo: true });
      if (obm_id) militaresQuery.where({ obm_id });
      const totalMilitaresAtivos = militaresQuery.count({ count: '*' }).first();

      const viaturasQuery = db('viaturas').where({ ativa: true });
      if (obm_id) {
        const obm = await db('obms').where({ id: obm_id }).first();
        if (obm) viaturasQuery.where({ obm: obm.nome });
      }
      const totalViaturasDisponiveis = viaturasQuery.count({ count: '*' }).first();

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
      if (obm_id) query.andWhere({ obm_id });
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
      if (obm_id) {
        const obm = await db('obms').where({ id: obm_id }).first();
        if (obm) query.andWhere({ obm: obm.nome });
      }
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

  // --- MÉTODO ATUALIZADO PARA AGRUPAR OS DADOS ---
  getViaturaStatsDetalhado: async (req, res) => {
    const { obm_id } = req.query;
    try {
      const query = db('viaturas')
        .select('prefixo', 'obm')
        .where('ativa', true)
        .orderBy('obm', 'asc')
        .orderBy('prefixo', 'asc');

      if (obm_id) {
        const obm = await db('obms').where({ id: obm_id }).first();
        if (obm) {
          query.andWhere({ obm: obm.nome });
        }
      }

      const viaturasAtivas = await query;

      // Agrupa os resultados em um mapa aninhado
      const stats = viaturasAtivas.reduce((acc, vtr) => {
        const tipo = getTipoViatura(vtr.prefixo);
        const nomeObm = vtr.obm || 'OBM Não Informada';

        if (!acc[tipo]) {
          acc[tipo] = {
            tipo: tipo,
            quantidade: 0,
            obms: {} // Objeto para agrupar por OBM
          };
        }
        
        acc[tipo].quantidade++;

        if (!acc[tipo].obms[nomeObm]) {
          acc[tipo].obms[nomeObm] = []; // Array para os prefixos
        }
        
        acc[tipo].obms[nomeObm].push(vtr.prefixo);
        
        return acc;
      }, {});

      // Converte o mapa em um array e ordena
      const resultadoFinal = Object.values(stats).map(item => ({
        ...item,
        // Converte o objeto de OBMs em um array para facilitar a iteração no frontend
        obms: Object.entries(item.obms).map(([nome, prefixos]) => ({
          nome,
          prefixos
        }))
      })).sort((a, b) => a.tipo.localeCompare(b.tipo));

      res.status(200).json(resultadoFinal);

    } catch (error) {
      console.error("ERRO AO BUSCAR ESTATÍSTICAS DETALHADAS DE VIATURAS:", error);
      throw new AppError("Não foi possível carregar as estatísticas detalhadas de viaturas.", 500);
    }
  },
  // --- FIM DA ATUALIZAÇÃO ---

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
