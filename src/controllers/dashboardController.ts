import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';
import AppError from '../utils/AppError';
import { normalizeText } from '../utils/textUtils';
import { fetchAll, fetchAllKeyset } from '../utils/supabasePagination';

const normalize = (value: string | null | undefined) => (value ? String(value).trim().toUpperCase() : '');

const dashboardController = {
  getMetadataByKey: async (req: Request, res: Response) => {
    const { key } = req.params;
    const { data } = await supabaseAdmin.from('metadata').select('*').eq('key', key).single();
    if (!data) return res.status(200).json({ key, value: null });
    return res.status(200).json(data);
  },

  getStats: async (req: Request, res: Response) => {
    try {
      const FORCE_REFRESH = req.query.refresh === 'true';
      const obm_id = req.query.obm_id as string;

      const CACHE_KEY = obm_id ? `dashboard_stats_${obm_id}` : 'dashboard_stats';
      const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

      // 1. Try Cache
      if (!FORCE_REFRESH) {
        const { data: cached } = await supabaseAdmin
          .from('dashboard_cache')
          .select('*')
          .eq('key', CACHE_KEY)
          .single();

        if (cached && cached.data) {
          const updatedAt = new Date(cached.updated_at).getTime();
          const now = Date.now();
          if (now - updatedAt < CACHE_TTL_MS) {
            return res.status(200).json(cached.data);
          }
        }
      }

      // Resolve OBM Name if filtering
      let obmName: string | null = null;
      if (obm_id) {
        const { data } = await supabaseAdmin.from('obms').select('nome').eq('id', obm_id).single();
        obmName = data?.nome || null;
      }

      // 2. Calculate Fresh
      // Separate queries to apply filters
      let qMil = supabaseAdmin.from('militares').select('id', { count: 'exact', head: true }).eq('ativo', true);
      let qVtr = supabaseAdmin.from('viaturas').select('id', { count: 'exact', head: true }).eq('ativa', true);

      if (obmName) {
        qMil = qMil.eq('obm_nome', obmName);
        qVtr = qVtr.eq('obm', obmName);
      }

      const [mil, vtr, obm] = await Promise.all([
        qMil,
        qVtr,
        supabaseAdmin.from('obms').select('id', { count: 'exact', head: true }),
      ]);

      const freshData = {
        total_militares_ativos: mil.count || 0,
        total_viaturas_disponiveis: vtr.count || 0,
        total_obms: obm.count || 0,
        cache_timestamp: new Date().toISOString()
      };

      // 3. Update Cache
      await supabaseAdmin
        .from('dashboard_cache')
        .upsert({
          key: CACHE_KEY,
          data: freshData,
          updated_at: new Date().toISOString()
        });

      return res.status(200).json(freshData);
    } catch (error) {
      console.error('ERRO AO BUSCAR ESTATISTICAS GERAIS:', error);
      throw new AppError('Nao foi possivel carregar as estatisticas do dashboard.', 500);
    }
  },

  getViaturaStatsPorTipo: async (req: Request, res: Response) => {
    try {
      const obm_id = req.query.obm_id as string;
      let obmName: string | null = null;
      if (obm_id) {
        const { data } = await supabaseAdmin.from('obms').select('nome').eq('id', obm_id).single();
        obmName = data?.nome || null;
      }

      const allViaturas = await fetchAll<any>((from, to) => {
        let q = supabaseAdmin.from('viaturas').select('prefixo').eq('ativa', true);
        if (obmName) q = q.eq('obm', obmName);
        return q.range(from, to);
      });

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

  getMilitarStats: async (req: Request, res: Response) => {
    try {
      const obm_id = req.query.obm_id as string;
      let obmName: string | null = null;
      if (obm_id) {
        const { data } = await supabaseAdmin.from('obms').select('nome').eq('id', obm_id).single();
        obmName = data?.nome || null;
      }

      const allMilitares = await fetchAllKeyset<any>(
        supabaseAdmin,
        'militares',
        'id, posto_graduacao',
        (q) => {
          let query = q.eq('ativo', true);
          if (obmName) query = query.eq('obm_nome', obmName);
          return query;
        }
      );

      const normalizePosto = (str: string) => {
        if (!str) return 'N/A';
        return str.toLowerCase().split(' ').map(word => {
          if (word.length > 2 && word.includes('º')) return word;
          return word.charAt(0).toUpperCase() + word.slice(1);
        }).join(' ');
      };

      const stats: Record<string, number> = {};
      (allMilitares || []).forEach((m: any) => {
        let pg = m.posto_graduacao || 'N/A';
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

  getViaturaStatsDetalhado: async (req: Request, res: Response) => {
    try {
      const obm_id = req.query.obm_id as string;
      let obmName: string | null = null;
      if (obm_id) {
        const { data } = await supabaseAdmin.from('obms').select('nome').eq('id', obm_id).single();
        obmName = data?.nome || null;
      }

      // Parallel fetch: Viaturas + OBMs
      const [allViaturas, { data: obms }] = await Promise.all([
        fetchAll<any>((from, to) => {
          let q = supabaseAdmin.from('viaturas').select('prefixo, obm').eq('ativa', true).order('prefixo');
          if (obmName) q = q.eq('obm', obmName);
          return q.range(from, to);
        }),
        supabaseAdmin.from('obms').select('nome, abreviatura').limit(2000)
      ]);

      const obmMap = new Map<string, string>();
      (obms || []).forEach((o: any) => {
        if (o.nome) obmMap.set(o.nome.toLowerCase(), o.abreviatura);
      });

      const stats = (allViaturas || []).reduce((acc: any, vtr: any) => {
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

  getViaturaStatsPorObm: async (req: Request, res: Response) => {
    try {
      const obm_id = req.query.obm_id as string;
      let obmName: string | null = null;
      if (obm_id) {
        const { data } = await supabaseAdmin.from('obms').select('nome').eq('id', obm_id).single();
        obmName = data?.nome || null;
      }

      const [allViaturas, { data: obms }] = await Promise.all([
        fetchAll<any>((from, to) => {
          let q = supabaseAdmin.from('viaturas').select('prefixo, obm').eq('ativa', true);
          if (obmName) q = q.eq('obm', obmName);
          return q.range(from, to);
        }),
        supabaseAdmin.from('obms').select('id, nome, abreviatura, crbm').limit(2000)
      ]);

      const resultStats: Record<string, any> = {};

      const findObm = (nomeOrAbrev: string) => {
        if (!nomeOrAbrev) return null;
        const target = normalizeText(nomeOrAbrev);
        return (obms || []).find((o: any) =>
          normalizeText(o.nome) === target || normalizeText(o.abreviatura) === target
        );
      };

      (allViaturas || []).forEach((v: any) => {
        const obmMatch = findObm(v.obm);
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
      const now = new Date().toISOString();
      // Busca servicos que estao ativos AGORA (start <= now <= end)
      // OU servicos que comecam hoje (para garantir que aparecam antes de comecar tambem)

      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      // 1. Fetch Serviço - Lógica Corrigida para Overlap
      const { data: servicos, error } = await supabaseAdmin
        .from('servico_dia')
        .select('*')
        // Lógica de "Sobreposição com o dia de hoje"
        // (Start < TodayEnd) AND (End > TodayStart)
        .lt('data_inicio', todayEnd.toISOString())
        .gt('data_fim', todayStart.toISOString())
        .order('data_inicio', { ascending: false })
        .limit(50); // Aumentei limite para garantir

      if (error || !servicos) {
        console.error('Erro ao buscar servico_dia:', error);
        return res.status(200).json([]);
      }

      // Se houver duplicatas por funcao (ex: plantao acabando e outro comecando), pegar o mais recente
      // Mas o frontend ja deve filtrar. Vamos mandar todos que batem com hoje.

      // 2. Fetch Detalhes (Join Manual)
      const militarIds = servicos
        .filter((s: any) => s.pessoa_type === 'militar' && s.pessoa_id)
        .map((s: any) => s.pessoa_id);

      const militaresMap = new Map<number, any>();
      if (militarIds.length > 0) {
        const { data: militares, error: milError } = await supabaseAdmin
          .from('militares')
          .select('id, nome_guerra, nome_completo, posto_graduacao, telefone')
          .in('id', militarIds);

        if (milError) console.error('[getServicoDia] Error fetching militares:', milError);

        militares?.forEach((m: any) => {
          militaresMap.set(Number(m.id), m);
        });
      }

      // 3. Montar Resposta Enriquecida
      const result = servicos.map((s: any) => {
        let det = null;
        if (s.pessoa_type === 'militar') {
          const lookupId = Number(s.pessoa_id);
          det = militaresMap.get(lookupId);
        }
        return {
          ...s,
          nome_guerra: det?.nome_guerra || det?.nome_completo || 'N/A',
          posto_graduacao: det?.posto_graduacao || '',
          telefone: det?.telefone
        };
      });

      return res.status(200).json(result);
    } catch (error) {
      console.error('Erro critico servico_dia:', error);
      return res.status(200).json([]);
    }
  },

  getEscalaAeronaves: async (_req: Request, res: Response) => res.status(200).json([]),
  getEscalaCodec: async (_req: Request, res: Response) => res.status(200).json([]),

  getMilitaresEscaladosCount: async (_req: Request, res: Response) => {
    try {
      const today = new Date().toISOString().split('T')[0];
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

  getMilitarStatsPorCrbm: async (req: Request, res: Response) => {
    try {
      const obm_id = req.query.obm_id as string;
      let obmName: string | null = null;
      if (obm_id) {
        const { data } = await supabaseAdmin.from('obms').select('nome').eq('id', obm_id).single();
        obmName = data?.nome || null;
      }

      const allMilitares = await fetchAllKeyset<any>(
        supabaseAdmin,
        'militares',
        'id, crbm',
        (q) => {
          let query = q.eq('ativo', true);
          if (obmName) query = query.eq('obm_nome', obmName);
          return query;
        }
      );

      const stats: Record<string, number> = {};
      (allMilitares || []).forEach((m: any) => {
        const crbm = m.crbm || 'Sem CRBM';
        stats[crbm] = (stats[crbm] || 0) + 1;
      });

      const data = Object.entries(stats)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => {
          const numA = parseInt(a.name.match(/\d+/)?.[0] || '99');
          const numB = parseInt(b.name.match(/\d+/)?.[0] || '99');
          return numA - numB;
        });

      return res.status(200).json(data);
    } catch (error) {
      console.error('ERRO ESTATISTICAS CRBM:', error);
      throw new AppError('Erro ao buscar estatisticas por CRBM.', 500);
    }
  },

  getViaturasEmpenhadasCount: async (_req: Request, res: Response) => {
    try {
      const today = new Date().toISOString().split('T')[0];

      // Plantoes validos de hoje com viatura
      // Usando fetchAll para garantir que pegamos todos se houver muitos
      const allPlantoes = await fetchAll<any>((from, to) =>
        supabaseAdmin
          .from('plantoes')
          .select('viatura_id, viaturas!inner(prefixo)')
          .gte('data_plantao', today)
          .not('viatura_id', 'is', null)
          .range(from, to)
      );

      const engagedSet = new Set<string>();
      allPlantoes.forEach((p: any) => {
        if (p.viaturas?.prefixo) {
          engagedSet.add(p.viaturas.prefixo);
        }
      });

      return res.status(200).json({
        count: engagedSet.size,
        engagedSet: Array.from(engagedSet)
      });
    } catch (error) {
      console.error('ERRO VIATURAS EMPENHADAS:', error);
      return res.status(200).json({ count: 0, engagedSet: [] });
    }
  },
};

export = dashboardController;
