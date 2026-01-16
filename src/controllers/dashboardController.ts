import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';
import AppError from '../utils/AppError';
import { normalizeText } from '../utils/textUtils';

const normalize = (value: string | null | undefined) => (value ? String(value).trim().toUpperCase() : '');

const dashboardController = {
  getMetadataByKey: async (req: Request, res: Response) => {
    const { key } = req.params;
    const { data } = await supabaseAdmin.from('metadata').select('*').eq('key', key).single();
    if (!data) return res.status(200).json({ key, value: null });
    return res.status(200).json(data);
  },

  getStats: async (_req: Request, res: Response) => {
    try {
      const [mil, vtr, obm] = await Promise.all([
        supabaseAdmin.from('militares').select('id', { count: 'exact', head: true }).eq('ativo', true),
        supabaseAdmin.from('viaturas').select('id', { count: 'exact', head: true }).eq('ativa', true),
        supabaseAdmin.from('obms').select('id', { count: 'exact', head: true }),
      ]);
      return res.status(200).json({
        total_militares_ativos: mil.count || 0,
        total_viaturas_disponiveis: vtr.count || 0,
        total_obms: obm.count || 0,
      });
    } catch (error) {
      console.error('ERRO AO BUSCAR ESTATISTICAS GERAIS:', error);
      throw new AppError('Nao foi possivel carregar as estatisticas do dashboard.', 500);
    }
  },

  getViaturaStatsPorTipo: async (_req: Request, res: Response) => {
    try {
      let allViaturas: any[] = [];
      let page = 0;
      const pageSize = 1000;
      while (true) {
        const { data, error } = await supabaseAdmin
          .from('viaturas')
          .select('prefixo')
          .eq('ativa', true)
          .range(page * pageSize, (page + 1) * pageSize - 1);

        if (error) throw error;
        if (!data || data.length === 0) break;
        allViaturas = allViaturas.concat(data);
        if (data.length < pageSize) break;
        page++;
      }

      const stats = (allViaturas || []).reduce((acc: any, v: any) => {
        const p = normalize(v.prefixo);
        let tipo = 'OUTROS';
        if (p.startsWith('UR')) tipo = 'UR';
        else if (p.startsWith('ABT')) tipo = 'ABT';
        else if (p.startsWith('ASA')) tipo = 'ASA';
        else if (p.includes('-')) tipo = p.split('-')[0];
        if (!acc[tipo]) acc[tipo] = { name: tipo, value: 0 };
        acc[tipo].value += 1;
        return acc;
      }, {});
      return res.status(200).json(Object.values(stats).sort((a: any, b: any) => b.value - a.value));
    } catch (error) {
      console.error('ERRO AO BUSCAR ESTATISTICAS DE VIATURAS POR TIPO:', error);
      throw new AppError('Nao foi possivel carregar as estatisticas de viaturas por tipo.', 500);
    }
  },

  getMilitarStats: async (_req: Request, res: Response) => {
    try {
      // Fetch com paginação para garantir todos os registros (>1000)
      let allMilitares: any[] = [];
      let page = 0;
      const pageSize = 500; // Reduzido para evitar timeouts ou limites ocultos

      // Check count first
      const { count } = await supabaseAdmin
        .from('militares')
        .select('*', { count: 'exact', head: true })
        .eq('ativo', true);

      let lastId = 0;
      let totalFetched = 0;

      console.log(`[Dashboard] Total de militares ativos no DB (count): ${count}`);
      console.log('[Dashboard] Iniciando busca via KEYSET PAGINATION (ID > lastId)...');

      while (true) {
        const { data, error } = await supabaseAdmin
          .from('militares')
          .select('id, posto_graduacao') // ID is required for keyset
          .eq('ativo', true)
          .gt('id', lastId)
          .order('id', { ascending: true })
          .limit(pageSize);

        if (error) {
          console.error('[Dashboard] Erro na paginação de militares:', error);
          throw error;
        }

        if (!data || data.length === 0) break;

        allMilitares = allMilitares.concat(data);
        const batchSize = data.length;
        totalFetched += batchSize;
        lastId = data[batchSize - 1].id; // Update cursor

        console.log(`[Dashboard] Batch carregado. LastId: ${lastId}. Itens: ${batchSize}. Total: ${totalFetched}`);

        if (batchSize < pageSize) break;
      }

      console.log(`[Dashboard] Total de militares ativos recuperados: ${allMilitares.length}`);

      const normalizePosto = (str: string) => {
        if (!str) return 'N/A';
        // Caso especial para normalizar "SGT" -> "Sgt", "PEL" -> "Pel", etc.
        // Mantém "2º", "1º", "CB", "SD" se for padrão, ou converte tudo para Title Case.
        // Title Case simples:
        return str.toLowerCase().split(' ').map(word => {
          // Preserva numerais ordinais como estão se já estiverem ok, ou normaliza se precisar
          // Mas o toLowerCase já resolveu SGT -> sgt. Agora capitalize.
          if (word.length > 2 && word.includes('º')) return word; // 2º, 1º pode manter minúsculo se quiser ou não.
          // Melhor forçar Title Case em tudo
          return word.charAt(0).toUpperCase() + word.slice(1);
        }).join(' ');
      };

      const stats: Record<string, number> = {};
      (allMilitares || []).forEach((m: any) => {
        let pg = m.posto_graduacao || 'N/A';
        // Normalização forçada para evitar duplicatas por Case Sensitivity
        pg = normalizePosto(pg);
        stats[pg] = (stats[pg] || 0) + 1;
      });

      const data = Object.entries(stats)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

      return res.status(200).json(data);
    } catch (error) {
      console.error('ERRO AO BUSCAR ESTATISTICAS DE MILITARES:', error);
      throw new AppError('Nao foi possivel carregar as estatisticas dos militares.', 500);
    }
  },

  getViaturaStatsDetalhado: async (_req: Request, res: Response) => {
    try {
      // Buscar todas as viaturas com paginação
      let allViaturas: any[] = [];
      let pageV = 0;
      const pageSize = 1000;
      while (true) {
        const { data, error } = await supabaseAdmin
          .from('viaturas')
          .select('prefixo, obm') // obm aqui é string denormalizada
          .eq('ativa', true)
          .order('prefixo') // Order ajuda na paginação consistente
          .range(pageV * pageSize, (pageV + 1) * pageSize - 1);

        if (error) throw error;
        if (!data || data.length === 0) break;
        allViaturas = allViaturas.concat(data);
        if (data.length < pageSize) break;
        pageV++;
      }

      const { data: obms } = await supabaseAdmin.from('obms').select('nome, abreviatura').limit(2000);

      const obmMap = new Map<string, string>(); // nome -> abreviatura
      (obms || []).forEach((o: any) => {
        if (o.nome) obmMap.set(o.nome.toLowerCase(), o.abreviatura);
      });

      const stats = (allViaturas || []).reduce((acc: any, vtr: any) => {
        // Tenta resolver abreviatura da OBM
        let localFinal = vtr.obm;
        if (vtr.obm && obmMap.has(vtr.obm.toLowerCase())) {
          localFinal = obmMap.get(vtr.obm.toLowerCase());
        }
        const nomeLocal = localFinal || 'OBM Nao Informada';

        const p = normalize(vtr.prefixo);
        let tipo = 'OUTROS';
        if (p.startsWith('UR')) tipo = 'UR';
        else if (p.startsWith('ABT')) tipo = 'ABT';
        else if (p.startsWith('ASA')) tipo = 'ASA';
        else if (p.includes('-')) tipo = p.split('-')[0];

        if (!acc[tipo]) acc[tipo] = { tipo, quantidade: 0, obms: {} as Record<string, string[]> };
        acc[tipo].quantidade += 1;
        if (!acc[tipo].obms[nomeLocal]) acc[tipo].obms[nomeLocal] = [];
        acc[tipo].obms[nomeLocal].push(vtr.prefixo);
        return acc;
      }, {});

      const result = Object.values(stats)
        .map((item: any) => ({
          ...item,
          obms: Object.entries(item.obms).map(([nome, prefixos]) => ({ nome, prefixos })),
        }))
        .sort((a: any, b: any) => a.tipo.localeCompare(b.tipo));

      return res.status(200).json(result);
    } catch (error) {
      console.error('ERRO AO BUSCAR ESTATISTICAS DETALHADAS VTR:', error);
      throw new AppError('Nao foi possivel carregar detalhes de viaturas.', 500);
    }
  },

  getViaturaStatsPorObm: async (_req: Request, res: Response) => {
    try {
      // Buscar viaturas com paginação
      let allViaturas: any[] = [];
      let pageV = 0;
      const pageSize = 1000;
      while (true) {
        const { data, error } = await supabaseAdmin
          .from('viaturas')
          .select('prefixo, obm')
          .eq('ativa', true)
          .range(pageV * pageSize, (pageV + 1) * pageSize - 1);

        if (error) throw error;
        if (!data || data.length === 0) break;
        allViaturas = allViaturas.concat(data);
        if (data.length < pageSize) break;
        pageV++;
      }

      const { data: obms } = await supabaseAdmin.from('obms').select('id, nome, abreviatura, crbm').limit(2000);

      const resultStats: Record<string, any> = {};

      // Helper simples para achar OBM do array
      const findObm = (nomeOrAbrev: string) => {
        if (!nomeOrAbrev) return null;
        const target = normalizeText(nomeOrAbrev);
        return (obms || []).find((o: any) =>
          normalizeText(o.nome) === target || normalizeText(o.abreviatura) === target
        );
      };

      (allViaturas || []).forEach((v: any) => {
        const obmMatch = findObm(v.obm);
        // Usa o nome da OBM encontrada ou o valor da string v.obm ou 'Sem OBM'
        const key = obmMatch ? (obmMatch.abreviatura || obmMatch.nome) : (v.obm || 'Sem OBM');

        if (!resultStats[key]) {
          resultStats[key] = {
            id: obmMatch?.id || null,
            nome: key,
            prefixos: [],
            crbm: obmMatch?.crbm || null,
            abreviatura: obmMatch?.abreviatura || null
          };
        }
        resultStats[key].prefixos.push(v.prefixo);
      });

      const result = Object.values(resultStats).map((entry: any) => ({
        id: entry.id,
        nome: entry.nome,
        quantidade: entry.prefixos.length,
        prefixos: entry.prefixos,
        crbm: entry.crbm,
        abreviatura: entry.abreviatura,
      }));

      return res.status(200).json(result);
    } catch (error) {
      console.error('ERRO AO ESTATISTICAS DE VIATURAS POR OBM:', error);
      throw new AppError('Erro ao carregar estatisticas por OBM.', 500);
    }
  },

  getServicoDia: async (_req: Request, res: Response) => {
    try {
      const today = new Date().toISOString().split('T')[0];

      const { data, error } = await supabaseAdmin
        .from('servico_dia')
        .select('*')
        .lte('data_inicio', today) // Assumindo lógica <= hoje e >= hoje para pegar vigente?
        .gte('data_fim', today)    // ou apenas data = hoje se for diário. O original usava intervalos.
        .limit(10); // Segurança

      if (error) return res.status(200).json([]); // Retorna vazio se der erro ou tabela nao existir
      return res.status(200).json(data || []);
    } catch (error) {
      return res.status(200).json([]);
    }
  },

  getEscalaAeronaves: async (_req: Request, res: Response) => res.status(200).json([]),
  getEscalaCodec: async (_req: Request, res: Response) => res.status(200).json([]),

  getMilitaresEscaladosCount: async (_req: Request, res: Response) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      // Count distinct via JS (puxa tabela de relação filtrada por data)
      // Query original faz join.
      // supabase: militar_plantao join plantoes
      const { data, error } = await supabaseAdmin
        .from('militar_plantao')
        .select('militar_id, plantoes!inner(data_plantao)')
        .gte('plantoes.data_plantao', today);

      if (error || !data) return res.status(200).json({ count: 0 });

      const uniqueIds = new Set(data.map((r: any) => r.militar_id));
      return res.status(200).json({ count: uniqueIds.size });

    } catch (error) {
      console.error('ERRO CONTAGEM ESCALADOS:', error);
      return res.status(200).json({ count: 0 });
    }
  },
};

export = dashboardController;
