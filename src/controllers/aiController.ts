
import { Request, Response } from 'express';
import aiAssistedValidationService from '../services/aiAssistedValidationService';
import { supabaseAdmin } from '../config/supabase';

// Helper de busca via Supabase HTTP API (bypassing Knex port 5432 issues)
const searchTools = {
    async findMilitares(term: string) {
        // Tenta buscar por nome ou matrícula
        const isMatricula = /^\d+$/.test(term);
        const query = supabaseAdmin.from('militares').select('*').limit(5);

        if (isMatricula) {
            query.ilike('matricula', `%${term}%`);
        } else {
            query.ilike('nome', `%${term}%`);
        }
        const { data } = await query;
        return data || [];
    },

    async findViatura(prefixo: string) {
        const { data } = await supabaseAdmin.from('viaturas').select('*').ilike('prefixo', `%${prefixo}%`).limit(5);
        return data || [];
    },

    async findObm(term: string) {
        const { data } = await supabaseAdmin.from('obms').select('*')
            .or(`abreviatura.ilike.%${term}%,nome.ilike.%${term}%`)
            .limit(5);
        return data || [];
    }
};

const aiController = {
    chat: async (req: Request, res: Response) => {
        try {
            const { question, history } = req.body;
            if (!question) {
                return res.status(400).json({ message: 'Pergunta obrigatória.' });
            }

            console.log(`[AI Controller] Processing via HTTP Strategy: "${question}"`);

            // 1. Coleta de Contexto Leve (Counts)
            const [mil, vtr, obmCount] = await Promise.all([
                supabaseAdmin.from('militares').select('count', { count: 'exact', head: true }).eq('ativo', true),
                supabaseAdmin.from('viaturas').select('count', { count: 'exact', head: true }).eq('ativa', true),
                supabaseAdmin.from('obms').select('count', { count: 'exact', head: true })
            ]);

            const contextData: any = {
                resumo_sistema: {
                    militares_ativos: mil.count,
                    viaturas_ativas: vtr.count,
                    unidades_obm: obmCount.count
                },
                resultados_busca: []
            };

            // 2. Busca Inteligente baseada na pergunta
            const qLower = question.toLowerCase();
            const words = qLower.split(' ');

            // Detecção de Intenção Simplificada
            if (words.some((w: string) => ['busca', 'procure', 'quem', 'militar', 'soldado', 'cabo', 'sargento', 'tenente', 'coronel'].includes(w))) {
                // Tenta extrair nomes (heurística simples: palavras com mais de 3 letras que não sejam stop words)
                const potentialNames = words.filter((w: string) => w.length > 3 && !['qual', 'quem', 'onde', 'para', 'como'].includes(w));
                for (const name of potentialNames.slice(0, 2)) {
                    const res = await searchTools.findMilitares(name);
                    if (res.length > 0) contextData.resultados_busca.push({ termo: name, tipo: 'militar', dados: res });
                }
            }

            if (words.some((w: string) => ['viatura', 'vtr', 'carro', 'caminhao', 'ur', 'abt', 'asa'].includes(w))) {
                const potentialPrefix = words.find((w: string) => w.toUpperCase().includes('UR-') || w.toUpperCase().includes('ABT-') || w.toUpperCase().includes('ASA-') || /\d{2,}/.test(w));
                if (potentialPrefix) {
                    const res = await searchTools.findViatura(potentialPrefix);
                    if (res.length > 0) contextData.resultados_busca.push({ termo: potentialPrefix, tipo: 'viatura', dados: res });
                }
            }

            if (words.some((w: string) => ['obm', 'unidade', 'quartel', 'batalhao', 'bbm'].includes(w))) {
                const potentialObm = words.find((w: string) => w.length <= 4 && /\d/.test(w)) || words.find((w: string) => ['cob', 'bopar', 'cmd'].includes(w));
                if (potentialObm) {
                    const res = await searchTools.findObm(potentialObm);
                    if (res.length > 0) contextData.resultados_busca.push({ termo: potentialObm, tipo: 'obm', dados: res });
                }
            }

            // 3. Resposta da IA
            // Usamos o método antigo (answerSystemQuery) que já sabe lidar com JSON
            const answer = await aiAssistedValidationService.answerSystemQuery(question, contextData, history);

            return res.status(200).json({ answer });

        } catch (error: any) {
            console.error('AI Chat Error:', error);
            // Fallback gracioso
            return res.status(500).json({
                message: 'O assistente está temporariamente indisponível.',
                detail: error?.message
            });
        }
    }
};

export default aiController;
