import { supabase } from '../config/supabase';
import {
    DashboardStats,
    ChartStat,
    ViaturaStatAgrupada,
    ViaturaPorObmStat,
    ServicoInfo,
    Aeronave,
    PlantonistaCodec,
    ObmGrupo
} from '@/types/dashboard';
import {
    Viatura,
    Militar,
    ServicoDia,
    Obm,
    EscalaAeronave
} from '@/types/entities';

import api from './api';

export const dashboardService = {
    // ... (getStats implementation remains, or can be updated separately) ...

    async getStats(selectedObm?: string): Promise<DashboardStats> {
        try {
            // Get selected OBM name if needed
            let selectedObmNome: string | null = null;
            if (selectedObm) {
                const { data: obmData } = await supabase
                    .from('obms')
                    .select('nome')
                    .eq('id', selectedObm)
                    .single();
                selectedObmNome = obmData?.nome || null;
            }

            // Count active militares
            let militaresQuery = supabase
                .from('militares')
                .select('*', { count: 'exact', head: true })
                .eq('ativo', true);

            if (selectedObmNome) {
                militaresQuery = militaresQuery.eq('obm_nome', selectedObmNome);
            }

            const { count: total_militares_ativos } = await militaresQuery;

            // Count available viaturas
            let viaturasQuery = supabase
                .from('viaturas')
                .select('*', { count: 'exact', head: true })
                .eq('ativa', true);

            if (selectedObmNome) {
                viaturasQuery = viaturasQuery.eq('obm', selectedObmNome);
            }

            const { count: total_viaturas_disponiveis } = await viaturasQuery;

            // Count OBMs
            const { count: total_obms } = await supabase
                .from('obms')
                .select('*', { count: 'exact', head: true });

            return {
                total_militares_ativos: total_militares_ativos || 0,
                total_viaturas_disponiveis: total_viaturas_disponiveis || 0,
                total_obms: total_obms || 0
            };
        } catch (error) {
            console.error('Error fetching stats:', error);
            return { total_militares_ativos: 0, total_viaturas_disponiveis: 0, total_obms: 0 };
        }
    },

    async getViaturaStatsPorTipo(selectedObm?: string): Promise<ChartStat[]> {
        try {
            // Get selected OBM name if needed
            let selectedObmNome: string | null = null;
            if (selectedObm) {
                const { data: obmData } = await supabase
                    .from('obms')
                    .select('nome')
                    .eq('id', selectedObm)
                    .single();
                selectedObmNome = obmData?.nome || null;
            }

            let query = supabase
                .from('viaturas')
                .select('tipo')
                .eq('ativa', true);

            if (selectedObmNome) {
                query = query.eq('obm', selectedObmNome);
            }

            const { data, error } = await query;

            if (error) throw error;

            // Group by tipo
            const grouped = (data || []).reduce((acc: Record<string, number>, viatura: any) => {
                const tipo = viatura.tipo || 'Não especificado';
                acc[tipo] = (acc[tipo] || 0) + 1;
                return acc;
            }, {});

            return Object.entries(grouped).map(([name, value]) => ({
                name,
                value: value as number
            }));
        } catch (error) {
            console.error('Error fetching viatura stats by type:', error);
            return [];
        }
    },

    async getMilitarStats(selectedObm?: string): Promise<ChartStat[]> {
        try {
            // Get selected OBM name if needed
            let selectedObmNome: string | null = null;
            if (selectedObm) {
                const { data: obmData } = await supabase
                    .from('obms')
                    .select('nome')
                    .eq('id', selectedObm)
                    .single();
                selectedObmNome = obmData?.nome || null;
            }

            let query = supabase
                .from('militares')
                .select('posto_graduacao')
                .eq('ativo', true);

            if (selectedObmNome) {
                query = query.eq('obm_nome', selectedObmNome);
            }

            // Busca paginada para contornar o limite de 1000 registros do Supabase
            let allData: any[] = [];
            let configRange = 0;
            const pageSize = 1000;
            let fetchMore = true;

            while (fetchMore) {
                const { data, error } = await query.range(configRange, configRange + pageSize - 1);

                if (error) throw error;

                if (data && data.length > 0) {
                    allData = [...allData, ...data];
                    configRange += pageSize;
                    // Se veio menos que o tamanho da página, acabaram os registros
                    if (data.length < pageSize) fetchMore = false;
                } else {
                    fetchMore = false;
                }
            }

            const data = allData;

            // Group by posto_graduacao (Normalizado)
            const grouped = (data || []).reduce((acc: Record<string, number>, militar: any) => {
                let posto = militar.posto_graduacao || 'Não especificado';

                // Normaliza: Remove espaços extras e padroniza para evitar duplicatas (2º SGT vs 2º Sgt)
                posto = posto.trim();

                // Tenta converter para Title Case (primeira letra maiúscula) se estiver tudo maiúsculo
                // Ex: "2º SGT" -> "2º Sgt" (manual simples para casos comuns)
                if (posto === '2º SGT') posto = '2º Sgt';
                if (posto === '3º SGT') posto = '3º Sgt';
                if (posto === '1º SGT') posto = '1º Sgt';
                if (posto === 'SD 1ª CLASSE') posto = 'Sd 1ª Classe';
                if (posto === 'SD 2ª CLASSE') posto = 'Sd 2ª Classe';

                // Ou podemos fazer um toUpperCase() para garantir, mas Title Case fica mais bonito no gráfico.
                // Vou usar o valor do banco, mas corrigindo os casos específicos detectados na imagem.

                acc[posto] = (acc[posto] || 0) + 1;
                return acc;
            }, {});

            return Object.entries(grouped)
                .map(([name, value]) => ({
                    name,
                    value: value as number
                }))
                .sort((a, b) => b.value - a.value);
        } catch (error) {
            console.error('Error fetching militar stats:', error);
            return [];
        }
    },

    async getMilitarStatsPorCrbm(selectedObm?: string): Promise<ChartStat[]> {
        try {
            // Se houver filtro por OBM, não faz sentido mostrar gráfico por CRBM geral, 
            // mas vamos manter a lógica: se filtrar OBM, vai mostrar só o CRBM daquela OBM.

            // 1. Busca todas as OBMs para mapear Nome -> CRBM
            const { data: obmsData, error: obmsError } = await supabase
                .from('obms')
                .select('nome, crbm');

            if (obmsError) throw obmsError;

            // Cria um mapa: '1º BBM' -> '1º CRBM'
            const obmToCrbmMap = new Map<string, string>();
            obmsData?.forEach((o) => {
                if (o.nome && o.crbm) {
                    obmToCrbmMap.set(o.nome, o.crbm);
                }
            });

            // 2. Busca militares (paginado)
            let query = supabase
                .from('militares')
                .select('obm_nome')
                .eq('ativo', true);

            // Filtro opcional
            if (selectedObm) {
                const { data: obmInfo } = await supabase.from('obms').select('nome').eq('id', selectedObm).single();
                if (obmInfo) query = query.eq('obm_nome', obmInfo.nome);
            }

            let allData: any[] = [];
            let configRange = 0;
            const pageSize = 1000;
            let fetchMore = true;

            while (fetchMore) {
                const { data, error } = await query.range(configRange, configRange + pageSize - 1);
                if (error) throw error;
                if (data && data.length > 0) {
                    allData = [...allData, ...data];
                    configRange += pageSize;
                    if (data.length < pageSize) fetchMore = false;
                } else {
                    fetchMore = false;
                }
            }

            // 3. Agrupa por CRBM usando o mapa
            const grouped = allData.reduce((acc: Record<string, number>, militar: any) => {
                const obmNome = militar.obm_nome;
                // Busca o CRBM correspondente à OBM do militar
                const crbm = obmToCrbmMap.get(obmNome) || 'Sem CRBM';
                acc[crbm] = (acc[crbm] || 0) + 1;
                return acc;
            }, {});

            return Object.entries(grouped)
                .map(([name, value]) => ({
                    name,
                    value: value as number
                }))
                .sort((a, b) => b.value - a.value);

        } catch (error) {
            console.error('Error fetching militar stats por CRBM:', error);
            return [];
        }
    },

    async getMilitarStatsPorObm(selectedObm?: string): Promise<ChartStat[]> {
        try {
            // 1. Fetch OBMs for abbreviation mapping
            const { data: obmsData } = await supabase
                .from('obms')
                .select('nome, abreviatura');

            const obmMap = new Map<string, string>();
            if (obmsData) {
                obmsData.forEach(o => {
                    if (o.nome) obmMap.set(o.nome, o.abreviatura || o.nome);
                });
            }

            let query = supabase
                .from('militares')
                .select('obm_nome')
                .eq('ativo', true);

            if (selectedObm) {
                const { data: obmData } = await supabase
                    .from('obms')
                    .select('nome')
                    .eq('id', selectedObm)
                    .single();
                if (obmData) query = query.eq('obm_nome', obmData.nome);
            }

            // 2. Busca militares (paginado)
            let allData: any[] = [];
            let configRange = 0;
            const pageSize = 1000;
            let fetchMore = true;

            while (fetchMore) {
                const { data, error } = await query.range(configRange, configRange + pageSize - 1);
                if (error) throw error;
                if (data && data.length > 0) {
                    allData = [...allData, ...data];
                    configRange += pageSize;
                    if (data.length < pageSize) fetchMore = false;
                } else {
                    fetchMore = false;
                }
            }

            // 3. Agrupa por OBM (usando abreviatura)
            const grouped = allData.reduce((acc: Record<string, number>, militar: any) => {
                const rawName = militar.obm_nome || 'Sem OBM';
                const label = obmMap.get(rawName) || rawName;
                acc[label] = (acc[label] || 0) + 1;
                return acc;
            }, {});

            return Object.entries(grouped)
                .map(([name, value]) => ({
                    name,
                    value: value as number
                }))
                .sort((a, b) => b.value - a.value);

        } catch (error) {
            console.error('Error fetching militar stats por OBM:', error);
            return [];
        }
    },

    async getViaturaStatsDetalhado(selectedObm?: string): Promise<ViaturaStatAgrupada[]> {
        try {
            // Get selected OBM name if needed
            let selectedObmNome: string | null = null;
            if (selectedObm) {
                const { data: obmData } = await supabase
                    .from('obms')
                    .select('nome')
                    .eq('id', selectedObm)
                    .single();
                selectedObmNome = obmData?.nome || null;
            }

            let query = supabase
                .from('viaturas')
                .select('tipo, prefixo, obm')
                .eq('ativa', true);

            if (selectedObmNome) {
                query = query.eq('obm', selectedObmNome);
            }

            const { data, error } = await query;

            if (error) throw error;

            // Group by tipo
            const grouped = (data || []).reduce((acc: Record<string, { tipo: string; quantidade: number; obms: Map<string, string[]> }>, item: any) => {
                const tipo = item.tipo || 'Não especificado';
                const obmNome = item.obm || 'Não especificado';

                if (!acc[tipo]) {
                    acc[tipo] = {
                        tipo,
                        quantidade: 0,
                        obms: new Map()
                    };
                }

                acc[tipo].quantidade += 1;

                if (!acc[tipo].obms.has(obmNome)) {
                    acc[tipo].obms.set(obmNome, []);
                }
                acc[tipo].obms.get(obmNome)!.push(item.prefixo);

                return acc;
            }, {});

            // Convert Map to ObmGrupo array
            return Object.values(grouped).map(({ tipo, quantidade, obms }) => ({
                tipo,
                quantidade,
                obms: Array.from(obms.entries()).map(([nome, prefixos]) => ({
                    nome,
                    prefixos
                }))
            }));
        } catch (error) {
            console.error('Error fetching detailed viatura stats:', error);
            return [];
        }
    },

    async getViaturaStatsPorObm(selectedObm?: string): Promise<ViaturaPorObmStat[]> {
        try {
            // Get selected OBM name if needed
            let selectedObmNome: string | null = null;
            if (selectedObm) {
                const { data: obmData } = await supabase
                    .from('obms')
                    .select('nome')
                    .eq('id', selectedObm)
                    .single();
                selectedObmNome = obmData?.nome || null;
            }

            // Get all OBMs for mapping
            const { data: obmsData, error: obmsError } = await supabase
                .from('obms')
                .select('id, nome, abreviatura, crbm');

            if (obmsError) throw obmsError;

            const obmsMap = new Map((obmsData || []).map((obm: any) => [obm.nome, obm]));

            // Get viaturas
            let query = supabase
                .from('viaturas')
                .select('prefixo, obm')
                .eq('ativa', true);

            if (selectedObmNome) {
                query = query.eq('obm', selectedObmNome);
            }

            const { data, error } = await query;

            if (error) throw error;

            // Group by OBM
            const grouped = (data || []).reduce((acc: Record<string, ViaturaPorObmStat>, item: any) => {
                const obmNome = item.obm || 'Não especificado';
                const obmInfo = obmsMap.get(obmNome);



                if (!acc[obmNome]) {
                    acc[obmNome] = {
                        id: obmInfo?.id || null,
                        nome: obmNome,
                        quantidade: 0,
                        prefixos: [],
                        crbm: obmInfo?.crbm || null,
                        abreviatura: obmInfo?.abreviatura || null
                    };
                }

                acc[obmNome].quantidade += 1;
                acc[obmNome].prefixos.push(item.prefixo);

                return acc;
            }, {});

            return Object.values(grouped);
        } catch (error) {
            console.error('Error fetching viatura stats per OBM:', error);
            return [];
        }
    },

    async getServicoDia(selectedObm?: string): Promise<ServicoInfo[]> {
        try {
            const now = new Date().toISOString();

            // 1. Fetch servico_dia items
            const { data: servicoData, error: servicoError } = await supabase
                .from('servico_dia')
                .select('funcao, pessoa_id, pessoa_type')
                .lte('data_inicio', now)
                .gte('data_fim', now);

            if (servicoError) throw servicoError;
            if (!servicoData || servicoData.length === 0) return [];

            // 2. Separate types (militar vs civil) - for now assuming mostly military but handling structure
            // Note: The Dashboard interface ServicoInfo only supports militar-like fields (nome_guerra, posto).
            // We'll filter for military only or try to adapt if needed.

            const servicos = servicoData as unknown as ServicoDia[];

            const militarIds = servicos
                .filter(s => s.pessoa_type === 'militar' && s.pessoa_id)
                .map(s => s.pessoa_id);

            if (militarIds.length === 0) {
                return servicoData.map((s: any) => ({
                    funcao: s.funcao,
                    nome_guerra: 'N/A',
                    posto_graduacao: '',
                    telefone: null
                }));
            }

            const { data: militaresData, error: militaresError } = await supabase
                .from('militares')
                .select('id, nome_guerra, posto_graduacao, telefone, obm_nome')
                .in('id', militarIds);

            if (militaresError) throw militaresError;

            const militaresMap = new Map((militaresData as Militar[])?.map(m => [m.id, m]));

            // 3. Merge and filter
            let result = servicos.map(item => {
                // Skip if not militar (or handle civils if requirements change)
                if (item.pessoa_type !== 'militar') return null;

                const militar = militaresMap.get(item.pessoa_id);
                return {
                    funcao: item.funcao,
                    nome_guerra: militar?.nome_guerra || 'N/A',
                    posto_graduacao: militar?.posto_graduacao || '',
                    telefone: militar?.telefone || null,
                    obm_nome: militar?.obm_nome
                };
            }).filter(item => item !== null) as unknown as (ServicoInfo & { obm_nome?: string | null })[];

            // Filter by OBM if selected
            if (selectedObm) {
                const { data: obm } = await supabase.from('obms').select('nome').eq('id', selectedObm).single();
                if (obm) {
                    result = result.filter(item => item.obm_nome === obm.nome);
                }
            }

            return result.map(({ funcao, nome_guerra, posto_graduacao, telefone }) => ({
                funcao,
                nome_guerra,
                posto_graduacao,
                telefone
            }));

        } catch (error) {
            console.error('Error fetching Service of the Day:', error);
            return [];
        }
    },

    async getEscalaAeronaves(): Promise<Aeronave[]> {
        try {
            const today = new Date().toISOString().split('T')[0];

            // Join with aeronaves table
            const { data, error } = await supabase
                .from('escala_aeronaves')
                .select(`
                status,
                aeronaves (prefixo, tipo_asa),
                primeiro_piloto:militares!primeiro_piloto_id (nome_guerra),
                segundo_piloto:militares!segundo_piloto_id (nome_guerra)
            `)
                .eq('data', today);

            if (error) throw error;

            return data?.map((item: any) => ({
                prefixo: item.aeronaves?.prefixo || 'N/A',
                tipo_asa: item.aeronaves?.tipo_asa || 'rotativa',
                status: item.status,
                primeiro_piloto: item.primeiro_piloto?.nome_guerra || null,
                segundo_piloto: item.segundo_piloto?.nome_guerra || null
            })) as unknown as Aeronave[] || [];

        } catch (error) {
            console.error('Error fetching Aircraft Schedule:', error);
            return [];
        }
    },

    async getEscalaCodec(): Promise<PlantonistaCodec[]> {
        try {
            const today = new Date().toISOString().split('T')[0];

            const { data, error } = await supabase
                .from('escala_codec')
                .select(`
                turno,
                ordem_plantonista,
                militares (nome_guerra)
            `)
                .eq('data', today);

            if (error) {
                // If table doesn't exist yet, return empty to avoid crash
                if (error.code === '42P01') return [];
                throw error;
            }

            return data?.map((item: any) => ({
                turno: item.turno,
                ordem_plantonista: item.ordem_plantonista,
                nome_plantonista: item.militares?.nome_guerra || 'N/A'
            })) || [];

        } catch (error) {
            console.error('Error fetching CODEC Schedule:', error);
            return [];
        }
    },

    async getMilitaresEscaladosCount(selectedObm?: string): Promise<number> {
        try {
            const today = new Date().toISOString().split('T')[0];

            // Busca militares escalados em plantões vigentes (data >= hoje)
            const { count, error } = await supabase
                .from('militar_plantao')
                .select('plantoes!inner(data_plantao)', { count: 'exact', head: true })
                .gte('plantoes.data_plantao', today);

            if (error) throw error;

            return count || 0;
        } catch (error) {
            console.error('Error counting scheduled personnel:', error);
            return 0;
        }
    },

    async getViaturasEmpenhadasCount(): Promise<{ count: number, engagedSet: Set<string> }> {
        try {
            const today = new Date().toISOString().split('T')[0];

            // Busca plantões vigentes (data >= hoje) com viaturas
            const { data, error } = await supabase
                .from('plantoes')
                .select(`
                    viatura_id,
                    viaturas!inner (prefixo)
                `)
                .gte('data_plantao', today)
                .not('viatura_id', 'is', null);

            if (error) throw error;

            const engagedSet = new Set<string>();
            data?.forEach((item: any) => {
                if (item.viaturas?.prefixo) {
                    engagedSet.add(item.viaturas.prefixo);
                }
            });

            return { count: engagedSet.size, engagedSet };
        } catch (error) {
            console.error('Error fetching engaged vehicles:', error);
            return { count: 0, engagedSet: new Set() };
        }
    },

    async getViaturasAtivasCount(): Promise<number> {
        try {
            const { count, error } = await supabase
                .from('viaturas')
                .select('*', { count: 'exact', head: true })
                .eq('ativa', true);

            if (error) throw error;
            return count || 0;
        } catch (error) {
            return 0;
        }
    },

    async getObms(): Promise<Obm[]> {
        try {
            const { data, error } = await supabase
                .from('obms')
                .select('*')
                .order('nome');

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error fetching OBMs:', error);
            return [];
        }
    }
};
