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

export const dashboardService = {
    async getStats(selectedObm?: string): Promise<DashboardStats> {
        try {
            // 1. Total Militares Ativos
            let queryMilitares = supabase
                .from('militares')
                .select('*', { count: 'exact', head: true })
                .eq('ativo', true);

            if (selectedObm) {
                // Encontrar o nome da OBM pelo ID
                const { data: obm } = await supabase.from('obms').select('nome').eq('id', selectedObm).single();
                if (obm) {
                    queryMilitares = queryMilitares.eq('obm_nome', obm.nome);
                }
            }

            const { count: militaresCount } = await queryMilitares;

            // 2. Total Viaturas Disponíveis (Ativas)
            let queryViaturas = supabase
                .from('viaturas')
                .select('*', { count: 'exact', head: true })
                .eq('ativa', true);

            if (selectedObm) {
                const { data: obm } = await supabase.from('obms').select('nome').eq('id', selectedObm).single();
                if (obm) {
                    queryViaturas = queryViaturas.ilike('obm', `%${obm.nome}%`);
                }
            }

            const { count: viaturasCount } = await queryViaturas;

            // 3. Total OBMs
            const { count: obmsCount } = await supabase
                .from('obms')
                .select('*', { count: 'exact', head: true });

            return {
                total_militares_ativos: militaresCount || 0,
                total_viaturas_disponiveis: viaturasCount || 0,
                total_obms: obmsCount || 0
            };
        } catch (error) {
            console.error('Error fetching stats:', error);
            return { total_militares_ativos: 0, total_viaturas_disponiveis: 0, total_obms: 0 };
        }
    },

    async getViaturaStatsPorTipo(selectedObm?: string): Promise<ChartStat[]> {
        try {
            let query = supabase.from('viaturas').select('tipo, obm').eq('ativa', true);

            if (selectedObm) {
                const { data: obm } = await supabase.from('obms').select('nome').eq('id', selectedObm).single();
                if (obm) {
                    query = query.ilike('obm', `%${obm.nome}%`);
                }
            }

            const { data, error } = await query;
            if (error) throw error;

            const stats: Record<string, number> = {};
            // Cast as unknown then Viatura[] or just partial if full type matches DB response
            const viaturas = data as unknown as Pick<Viatura, 'tipo' | 'obm'>[];

            viaturas?.forEach((v) => {
                const tipo = v.tipo || 'Outros';
                stats[tipo] = (stats[tipo] || 0) + 1;
            });

            return Object.entries(stats).map(([name, value]) => ({ name, value }));
        } catch (error) {
            console.error('Error fetching viatura stats by type:', error);
            return [];
        }
    },

    async getMilitarStats(selectedObm?: string): Promise<ChartStat[]> {
        try {
            let query = supabase.from('militares').select('posto_graduacao, obm_nome').eq('ativo', true);

            if (selectedObm) {
                const { data: obm } = await supabase.from('obms').select('nome').eq('id', selectedObm).single();
                if (obm) {
                    query = query.eq('obm_nome', obm.nome);
                }
            }

            const { data, error } = await query;
            if (error) throw error;

            const stats: Record<string, number> = {};
            const militares = data as unknown as Pick<Militar, 'posto_graduacao' | 'obm_nome'>[];

            militares?.forEach((m) => {
                const posto = m.posto_graduacao || 'Outros';
                stats[posto] = (stats[posto] || 0) + 1;
            });

            return Object.entries(stats).map(([name, value]) => ({ name, value }));
        } catch (error) {
            console.error('Error fetching militar stats:', error);
            return [];
        }
    },

    async getViaturaStatsDetalhado(selectedObm?: string): Promise<ViaturaStatAgrupada[]> {
        try {
            let query = supabase.from('viaturas').select('prefixo, tipo, obm').eq('ativa', true);

            if (selectedObm) {
                const { data: obm } = await supabase.from('obms').select('nome').eq('id', selectedObm).single();
                if (obm) {
                    query = query.ilike('obm', `%${obm.nome}%`);
                }
            }

            const { data, error } = await query;
            if (error) throw error;

            // Group by Tipo -> OBM -> Prefixos
            const grouped: Record<string, Record<string, string[]>> = {};
            const viaturas = data as unknown as Pick<Viatura, 'prefixo' | 'tipo' | 'obm'>[];

            viaturas?.forEach((v) => {
                const tipo = v.tipo || 'Outros';
                const obmName = v.obm || 'Sem OBM';

                if (!grouped[tipo]) grouped[tipo] = {};
                if (!grouped[tipo][obmName]) grouped[tipo][obmName] = [];

                grouped[tipo][obmName].push(v.prefixo);
            });

            return Object.entries(grouped).map(([tipo, obmsMap]) => {
                const obms: ObmGrupo[] = Object.entries(obmsMap).map(([nome, prefixos]) => ({
                    nome,
                    prefixos
                }));

                const quantidade = obms.reduce((acc, curr) => acc + curr.prefixos.length, 0);

                return { tipo, quantidade, obms };
            });
        } catch (error) {
            console.error('Error fetching detailed viatura stats:', error);
            return [];
        }
    },

    async getViaturaStatsPorObm(selectedObm?: string): Promise<ViaturaPorObmStat[]> {
        try {
            // Obter todas as OBMs para ter a referência de CRBM e abreviatura
            const { data: allObms } = await supabase.from('obms').select('*');
            const obmMap = new Map((allObms as unknown as Obm[])?.map(o => [o.nome, o]));

            let query = supabase.from('viaturas').select('prefixo, obm').eq('ativa', true);

            if (selectedObm) {
                const { data: obm } = await supabase.from('obms').select('nome').eq('id', selectedObm).single();
                if (obm) {
                    query = query.ilike('obm', `%${obm.nome}%`);
                }
            }

            const { data, error } = await query;
            if (error) throw error;

            const grouped: Record<string, { prefixos: string[], obmRef: any }> = {};
            const viaturas = data as unknown as Pick<Viatura, 'prefixo' | 'obm'>[];

            viaturas?.forEach((v) => {
                const obmName = v.obm || 'Sem OBM';
                if (!grouped[obmName]) {
                    grouped[obmName] = {
                        prefixos: [],
                        obmRef: obmMap.get(obmName)
                    };
                }
                grouped[obmName].prefixos.push(v.prefixo);
            });

            return Object.entries(grouped).map(([nome, info], index) => ({
                id: info.obmRef?.id || index,
                nome,
                quantidade: info.prefixos.length,
                prefixos: info.prefixos,
                crbm: info.obmRef?.crbm || 'Outros', // Campo CRBM na tabela OBMs
                abreviatura: info.obmRef?.abreviatura
            }));
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
