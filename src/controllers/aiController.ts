
import { Request, Response } from 'express';
import aiAssistedValidationService from '../services/aiAssistedValidationService';
import { supabaseAdmin } from '../config/supabase';

const aiController = {
    chat: async (req: Request, res: Response) => {
        try {
            const { question, history } = req.body;
            if (!question) {
                return res.status(400).json({ message: 'Pergunta (question) é obrigatória.' });
            }

            // 1. Intelligent Context Gathering
            const contextResults: any = {
                stats: {},
                searchResults: []
            };

            // A. Global Stats - Comprehensive Data Fetch
            const hoje = new Date().toISOString().split('T')[0];

            const [mil, vtr, obm, ranks, vtrTypes, aeronaves, plantoesHoje, escaladosHoje] = await Promise.all([
                // Core counts
                supabaseAdmin.from('militares').select('count', { count: 'exact', head: true }).eq('ativo', true),
                supabaseAdmin.from('viaturas').select('count', { count: 'exact', head: true }).eq('ativa', true),
                supabaseAdmin.from('obms').select('nome, abreviatura, crbm, telefone, cidade'),
                // Rank breakdown
                supabaseAdmin.from('militares').select('posto_graduacao').eq('ativo', true),
                // Viatura Types
                supabaseAdmin.from('viaturas').select('tipo, obm').eq('ativa', true),
                // Aeronaves
                supabaseAdmin.from('aeronaves').select('count', { count: 'exact', head: true }).eq('ativa', true),
                // Plantoes today
                supabaseAdmin.from('plantoes').select('id').eq('data_plantao', hoje),
                // Militares escalados hoje (join)
                supabaseAdmin.from('militar_plantao').select('militar_id, plantoes!inner(data_plantao)').eq('plantoes.data_plantao', hoje)
            ]);

            // Aggregate Ranks in Memory
            const rankCounts: Record<string, number> = {};
            ranks.data?.forEach(m => {
                const p = m.posto_graduacao || 'Não Informado';
                rankCounts[p] = (rankCounts[p] || 0) + 1;
            });

            // Aggregate Viatura Types
            const tipoViaturaCounts: Record<string, number> = {};
            const vtrPorObm: Record<string, number> = {};
            vtrTypes.data?.forEach(v => {
                const t = v.tipo || 'Não Informado';
                tipoViaturaCounts[t] = (tipoViaturaCounts[t] || 0) + 1;
                const o = v.obm || 'Sem OBM';
                vtrPorObm[o] = (vtrPorObm[o] || 0) + 1;
            });

            // Unique escalados hoje
            const uniqueEscalados = new Set(escaladosHoje.data?.map((e: any) => e.militar_id) || []);

            contextResults.stats = {
                total_militares_ativos: mil.count || 0,
                militares_por_patente: rankCounts,
                total_viaturas_ativas: vtr.count || 0,
                viaturas_por_tipo: tipoViaturaCounts,
                viaturas_por_obm: vtrPorObm,
                total_aeronaves_ativas: aeronaves.count || 0,
                total_obms: obm.data?.length || 0,
                plantoes_hoje: plantoesHoje.data?.length || 0,
                militares_escalados_hoje: uniqueEscalados.size
            };

            // B. Contextual Search Query Construction
            // If the user asks a follow-up like "Qual a obm dele?", we combine with previous context
            let searchQuery = question.trim();
            if (history && history.length > 0) {
                const lastUserMsg = history.reverse().find((h: any) => h.role === 'user');
                if (lastUserMsg && searchQuery.length < 15) { // Only if current query is short/ambiguous
                    searchQuery = `${lastUserMsg.content} ${searchQuery}`;
                    console.log(`[AI Controller] Contexto expandido para busca: "${searchQuery}"`);
                }
            }

            const numbersInQuery = searchQuery.match(/\d+/g);
            const words = searchQuery.split(' ');

            // Search Militar by Matricula (if numbers present)
            if (numbersInQuery) {
                for (const num of numbersInQuery) {
                    if (num.length >= 3) {
                        console.log(`[AI Controller] Buscando matricula: ${num}`);
                        const { data: milData, error } = await supabaseAdmin
                            .from('militares')
                            .select('*') // Get all fields to be helpful
                            .ilike('matricula', `%${num}%`)
                            .limit(1)
                            .maybeSingle();

                        if (milData) {
                            console.log(`[AI Controller] Militar encontrado: ${milData.nome}`);
                            contextResults.searchResults.push({
                                tipo: 'REGISTRO DE MILITAR (Resultados de Busca do Banco de Dados)',
                                dados: milData
                            });

                            // Enrich with OBM details if militar has OBM info
                            if (milData.obm_nome) {
                                console.log(`[AI Controller] Buscando OBM do militar: ${milData.obm_nome}`);
                                const { data: obmData } = await supabaseAdmin
                                    .from('obms')
                                    .select('*')
                                    .or(`abreviatura.ilike.%${milData.obm_nome}%,nome.ilike.%${milData.obm_nome}%`)
                                    .limit(1);

                                if (obmData && obmData.length > 0) {
                                    contextResults.searchResults.push({
                                        tipo: 'OBM DE LOTAÇÃO DO MILITAR',
                                        dados: obmData[0]
                                    });
                                }
                            }
                        } else if (error) {
                            console.log('[AI Controller] Erro busca matricula:', error.message);
                        }
                    }
                }
            }

            // Search OBM Details (Specific Search)
            // If query mentions "telefone", "contato", "onde fica", "endereco" + OBM name
            const isObmSearch = /telefone|contato|endereço|localiza|onde|fica|email/i.test(searchQuery);
            if (isObmSearch || words.length < 5) {
                // Clean query to find potential OBM name (e.g. "telefone do COB" -> "COB")
                const obmQuery = searchQuery.replace(/telefone|celular|contato|do|da|de|qual|o|a|é|onde|fica|endereco|email/gi, '').trim();
                if (obmQuery.length >= 2) {
                    console.log(`[AI Controller] Buscando dados de OBM: ${obmQuery}`);
                    const { data: obmData } = await supabaseAdmin
                        .from('obms')
                        .select('*')
                        .or(`abreviatura.ilike.%${obmQuery}%,nome.ilike.%${obmQuery}%`)
                        .limit(3);

                    if (obmData && obmData.length > 0) {
                        console.log(`[AI Controller] OBMs encontradas: ${obmData.length}`);
                        contextResults.searchResults.push({
                            tipo: 'DETALHES DA UNIDADE (OBM)',
                            dados: obmData
                        });
                    }
                }
            }

            // Search Militar by Name (if query is text-heavy)
            // Heuristic: If valid text and looks like a name search
            if (words.length >= 2 && !searchQuery.toLowerCase().includes('quant')) {
                const potentialName = searchQuery.replace(/qual|quem|o|a|é|nome|do|da|militar|com|matricula|número|id|telefone|celular|contato/gi, '').trim();
                if (potentialName.length > 3) {
                    console.log(`[AI Controller] Buscando por nome potencial: ${potentialName}`);
                    const { data: milNameData } = await supabaseAdmin
                        .from('militares')
                        .select('*') // Get all fields including phone
                        .ilike('nome', `%${potentialName.replace(/ /g, '%')}%`)
                        .limit(3);

                    if (milNameData && milNameData.length > 0) {
                        console.log(`[AI Controller] Militares encontrados por nome: ${milNameData.length}`);
                        contextResults.searchResults.push({
                            tipo: 'POSSIVEIS MILITARES (Busca por Nome)',
                            dados: milNameData
                        });
                    }
                }
            }

            // Create a rich OBM list including phones and cities for context
            const obmRichList = obm.data?.map(o => {
                const tel = o.telefone ? ` | Tel: ${o.telefone}` : '';
                const cid = o.cidade ? ` - ${o.cidade}` : '';
                return `${o.abreviatura} (${o.nome})${cid}${tel}`;
            }).join('\n');

            const contextData = {
                ...contextResults,
                // Passing full list with phones+cities so AI can answer contact/location questions
                lista_completa_obms: obmRichList?.slice(0, 5000)
            };

            // 2. Ask AI
            const answer = await aiAssistedValidationService.answerSystemQuery(question, contextData, history);

            return res.status(200).json({ answer });

        } catch (error) {
            console.error('AI Chat Error:', error);
            return res.status(500).json({ message: 'Erro ao processar chat.' });
        }
    }
};

export default aiController;
