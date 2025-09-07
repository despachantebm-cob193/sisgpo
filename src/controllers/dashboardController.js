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

  /**
   * =======================================================================
   * FUNÇÃO PRINCIPAL REFATORADA
   * =======================================================================
   */
  getViaturaStatsDetalhado: async (req, res) => {
    const { obm_id } = req.query;
    try {
      // 1. CONSTRUÇÃO DA QUERY COM LEFT JOIN E COALESCE
      const query = db('viaturas as v')
        // Junta a tabela de viaturas (v) com a de obms (o) pela coluna de nome completo.
        .leftJoin('obms as o', 'v.obm', 'o.nome')
        .select(
          'v.prefixo',
          // Usa a abreviatura se existir (o.abreviatura não for nula), senão, usa o nome completo (v.obm) como fallback.
          // O resultado é apelidado de 'local_final' para facilitar o uso no JavaScript.
          db.raw('COALESCE(o.abreviatura, v.obm) as local_final')
        )
        .where('v.ativa', true) // Considera apenas viaturas ativas
        .orderBy('local_final', 'asc') // Ordena pelo nome do local (abreviatura ou nome completo)
        .orderBy('v.prefixo', 'asc');  // Ordenação secundária pelo prefixo

      // Filtro opcional por OBM (se um ID for passado na query string)
      if (obm_id) {
        const obm = await db('obms').where({ id: obm_id }).first();
        if (obm) {
          query.andWhere('v.obm', obm.nome);
        }
      }

      // 2. EXECUÇÃO DA CONSULTA
      const viaturasAtivas = await query;

      // 3. LÓGICA DE AGRUPAMENTO (REDUCE)
      // Esta lógica agora trabalha com o campo 'local_final', que já contém a abreviatura ou o fallback.
      const stats = viaturasAtivas.reduce((acc, vtr) => {
        const tipo = getTipoViatura(vtr.prefixo);
        const nomeLocal = vtr.local_final || 'OBM Não Informada';

        // Cria o grupo do tipo de viatura se ainda não existir
        if (!acc[tipo]) {
          acc[tipo] = {
            tipo: tipo,
            quantidade: 0,
            obms: {} // Usamos um objeto para agrupar por OBM/local de forma eficiente
          };
        }
        
        acc[tipo].quantidade++;

        // Cria o subgrupo da OBM (usando a abreviatura/fallback) se não existir
        if (!acc[tipo].obms[nomeLocal]) {
          acc[tipo].obms[nomeLocal] = [];
        }
        
        // Adiciona o prefixo da viatura ao seu respectivo grupo de OBM
        acc[tipo].obms[nomeLocal].push(vtr.prefixo);
        
        return acc;
      }, {});

      // 4. FORMATAÇÃO FINAL DO RESULTADO
      // Converte o objeto de OBMs em um array, como o frontend espera.
      const resultadoFinal = Object.values(stats).map(item => ({
        ...item,
        obms: Object.entries(item.obms).map(([nome, prefixos]) => ({
          nome,
          prefixos
        }))
      })).sort((a, b) => a.tipo.localeCompare(b.tipo)); // Ordena por tipo alfabeticamente

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
