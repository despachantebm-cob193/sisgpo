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
  /**
   * Busca um metadado pela chave.
   * CORREÇÃO: Retorna null com status 200 se a chave não for encontrada,
   * em vez de lançar um erro 404.
   */
  getMetadataByKey: async (req, res) => {
    const { key } = req.params;
    const metadata = await db('metadata').where({ key }).first();
    
    // Se não encontrar, retorna uma resposta de sucesso com dados nulos.
    if (!metadata) {
      return res.status(200).json(null);
    }
    
    res.status(200).json(metadata);
  },

  /**
   * CORRIGIDO: data_plantao -> data_inicio (Assumindo a coluna correta)
   */
  getStats: async (req, res) => {
    try {
      const totalMilitaresAtivos = await db('militares').where({ ativo: true }).count({ count: '*' }).first();
      const totalViaturasDisponiveis = await db('viaturas').where({ ativa: true }).count({ count: '*' }).first();
      const totalObms = await db('obms').count({ count: '*' }).first();
      // CRÍTICO: data_plantao NÃO EXISTE. Substituído por data_inicio
      const totalPlantoesMesResult = await db.raw("SELECT COUNT(*) FROM plantoes WHERE date_trunc('month', data_inicio) = date_trunc('month', CURRENT_DATE)");
      const totalPlantoesMes = totalPlantoesMesResult.rows[0];

      res.status(200).json({
        total_militares_ativos: parseInt(totalMilitaresAtivos.count, 10),
        total_viaturas_disponiveis: parseInt(totalViaturasDisponiveis.count, 10),
        total_obms: parseInt(totalObms.count, 10),
        total_plantoes_mes: parseInt(totalPlantoesMes.count, 10),
      });
    } catch (error) {
      console.error("ERRO AO BUSCAR ESTATÍSTICAS GERAIS:", error);
      throw new AppError("Não foi possível carregar as estatísticas do dashboard.", 500);
    }
  },

  getViaturaStatsPorTipo: async (req, res) => {
    try {
      const viaturasAtivas = await db('viaturas').select('prefixo').where('ativa', true);
      const stats = viaturasAtivas.reduce((acc, vtr) => {
        const tipo = getTipoViatura(vtr.prefixo);
        if (!acc[tipo]) { acc[tipo] = { name: tipo, value: 0 }; }
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

  getMilitarStats: async (req, res) => {
    try {
      const militaresPorPosto = await db('militares').select('posto_graduacao').count('id as count').where('ativo', true).groupBy('posto_graduacao').orderBy('count', 'desc');
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

  /**
   * CORRIGIDO: o.sigla -> o.abreviatura (Assumindo que 'abreviatura' é a coluna que existe no DB)
   */
  getViaturaStatsDetalhado: async (req, res) => {
    try {
      const viaturasAtivas = await db('viaturas as v')
        .leftJoin('obms as o', 'v.obm', 'o.nome')
        // CRÍTICO: sigla NÃO EXISTE. Revertendo para abreviatura
        .select('v.prefixo', db.raw('COALESCE(o.abreviatura, v.obm) as local_final'))
        .where('v.ativa', true)
        .orderBy('local_final', 'asc')
        .orderBy('v.prefixo', 'asc');
      
      const stats = viaturasAtivas.reduce((acc, vtr) => {
        const tipo = getTipoViatura(vtr.prefixo);
        const nomeLocal = vtr.local_final || 'OBM Não Informada';
        if (!acc[tipo]) { acc[tipo] = { tipo: tipo, quantidade: 0, obms: {} }; }
        acc[tipo].quantidade++;
        if (!acc[tipo].obms[nomeLocal]) { acc[tipo].obms[nomeLocal] = []; }
        acc[tipo].obms[nomeLocal].push(vtr.prefixo);
        return acc;
      }, {});
      
      const resultadoFinal = Object.values(stats).map(item => ({ ...item, obms: Object.entries(item.obms).map(([nome, prefixos]) => ({ nome, prefixos })) })).sort((a, b) => a.tipo.localeCompare(b.tipo));
      res.status(200).json(resultadoFinal);
    } catch (error) {
      console.error("ERRO AO BUSCAR ESTATÍSTICAS DETALHADAS DE VIATURAS:", error);
      throw new AppError("Não foi possível carregar as estatísticas detalhadas de viaturas.", 500);
    }
  },

  /**
   * CORRIGIDO: Seleção e ordenação por 'abreviatura' em vez de 'sigla'
   */
  getViaturaStatsPorObm: async (req, res) => {
    try {
      const [obms, viaturas] = await Promise.all([
        // CRÍTICO: sigla NÃO EXISTE. Selecionando e ordenando por abreviatura
        db('obms').select('id', 'nome', 'abreviatura').orderBy('abreviatura', 'asc'),
        db('viaturas').select('prefixo', 'obm as nome_obm').where('ativa', true)
      ]);
      
      const viaturasPorNomeObm = viaturas.reduce((acc, vtr) => {
        const nomeObm = vtr.nome_obm || 'Sem OBM';
        if (!acc[nomeObm]) { acc[nomeObm] = []; }
        acc[nomeObm].push(vtr.prefixo);
        return acc;
      }, {});
      
      const resultadoFinal = obms.map(obm => {
        const prefixos = viaturasPorNomeObm[obm.nome] || [];
        // CRÍTICO: obm.sigla -> obm.abreviatura
        return { id: obm.id, nome: obm.abreviatura, quantidade: prefixos.length, prefixos: prefixos.sort() };
      });
      res.status(200).json(resultadoFinal);
    } catch (error) {
      console.error("ERRO AO BUSCAR ESTATÍSTICAS DE VIATURAS POR OBM:", error);
      throw new AppError("Não foi possível carregar as estatísticas de viaturas por OBM.", 500);
    }
  },

  getServicoDia: async (req, res) => {
    const dataBusca = new Date().toISOString(); 

    try {
      const servicosAtivos = await db('servico_dia as sd')
        .where('sd.data_inicio', '<=', dataBusca)
        .andWhere('sd.data_fim', '>=', dataBusca);

      const militarIds = servicosAtivos.filter(s => s.pessoa_type === 'militar').map(s => s.pessoa_id);
      const civilIds = servicosAtivos.filter(s => s.pessoa_type === 'civil').map(s => s.pessoa_id);

      let militaresData = [];
      if (militarIds.length > 0) {
        militaresData = await db('militares as m')
          .select('m.id', 'm.posto_graduacao', db.raw("COALESCE(NULLIF(TRIM(m.nome_guerra), ''), m.nome_completo) as nome_guerra"))
          .whereIn('m.id', militarIds);
      }
      
      let civisData = [];
      if (civilIds.length > 0) {
        civisData = await db('civis as c')
          .select('c.id', 'c.nome_completo as nome_guerra', db.raw("'' as posto_graduacao"))
          .whereIn('c.id', civilIds);
      }
      
      const resultadoFinal = servicosAtivos.map(servico => {
        const pessoaData = servico.pessoa_type === 'militar'
          ? militaresData.find(m => m.id === servico.pessoa_id)
          : civisData.find(c => c.id === servico.pessoa_id);
        
        return {
          funcao: servico.funcao,
          nome_guerra: pessoaData?.nome_guerra || null,
          posto_graduacao: pessoaData?.posto_graduacao || null,
        };
      });
      
      res.status(200).json(resultadoFinal);
    } catch (error) {
      console.error("ERRO AO BUSCAR SERVIÇO DO DIA:", error);
      throw new AppError("Não foi possível carregar os dados do serviço de dia.", 500);
    }
  },

  getEscalaAeronaves: async (req, res) => {
    try {
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
          db.raw("COALESCE(p2.posto_graduacao || ' ' || NULLIF(TRIM(p2.nome_guerra), ''), p2.posto_graduacao || ' ' || p2.nome_completo, 'N/A') as segundo_piloto")
        )
        .orderBy('a.prefixo', 'asc');
      res.status(200).json(escala);
    } catch (error) {
      console.error("ERRO AO BUSCAR ESCALA DE AERONAVES:", error);
      throw new AppError("Não foi possível carregar a escala de aeronaves.", 500);
    }
  },

  getEscalaCodec: async (req, res) => {
    try {
      const dataBusca = new Date().toISOString().split('T')[0];
      const escala = await db('escala_codec as ec')
        .join('militares as m', 'ec.militar_id', 'm.id')
        .where('ec.data', dataBusca)
        .select(
          'ec.turno', 
          'ec.ordem_plantonista', 
          db.raw("m.posto_graduacao || ' ' || COALESCE(NULLIF(TRIM(m.nome_guerra), ''), m.nome_completo) as nome_plantonista")
        )
        .orderBy('ec.turno', 'asc')
        .orderBy('ec.ordem_plantonista', 'asc');
      res.status(200).json(escala);
    } catch (error) {
      console.error("ERRO AO BUSCAR ESCALA DO CODEC:", error);
      throw new AppError("Não foi possível carregar a escala do CODEC.", 500);
    }
  },
};

module.exports = dashboardController;