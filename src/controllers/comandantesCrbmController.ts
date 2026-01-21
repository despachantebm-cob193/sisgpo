import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';

const comandantesCrbmController = {
    // Listar todos os comandantes
    async list(req: Request, res: Response) {
        try {
            const { data, error } = await supabaseAdmin
                .from('comandantes_crbm')
                .select('*')
                .order('crbm', { ascending: true });

            if (error) throw error;

            return res.status(200).json(data);
        } catch (error: any) {
            console.error('Erro ao listar comandantes CRBM:', error);
            return res.status(500).json({ message: error.message });
        }
    },

    // Buscar um comandante por ID
    async getById(req: Request, res: Response) {
        try {
            const { id } = req.params;

            const { data, error } = await supabaseAdmin
                .from('comandantes_crbm')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;

            return res.status(200).json(data);
        } catch (error: any) {
            console.error('Erro ao buscar comandante CRBM:', error);
            return res.status(500).json({ message: error.message });
        }
    },

    // Criar novo comandante
    async create(req: Request, res: Response) {
        try {
            console.log('CREATE Comandante - Body:', req.body);
            const {
                crbm, militar_id, nome_comandante, posto_graduacao, telefone, email, data_inicio,
                subcomandante_militar_id, nome_subcomandante, subcomandante_posto, subcomandante_telefone, subcomandante_email,
                observacoes
            } = req.body;

            if (!crbm || !nome_comandante) {
                return res.status(400).json({ message: 'CRBM e Nome do Comandante são obrigatórios.' });
            }

            const payload = {
                crbm,
                militar_id: militar_id || null, // Ensure null if empty/0
                nome_comandante,
                posto_graduacao,
                telefone,
                email,
                data_inicio: data_inicio || null, // Ensure null if empty string
                subcomandante_militar_id: subcomandante_militar_id || null, // Ensure null if empty/0
                nome_subcomandante,
                subcomandante_posto,
                subcomandante_telefone,
                subcomandante_email,
                observacoes
            };

            const { data, error } = await supabaseAdmin
                .from('comandantes_crbm')
                .insert(payload)
                .select()
                .single();

            if (error) {
                console.error('Supabase Error (Create):', error);
                throw error;
            }

            return res.status(201).json(data);
        } catch (error: any) {
            console.error('Erro ao criar comandante CRBM:', error);
            // Return error detail (code, message) for easier debugging
            return res.status(500).json({ message: error.message, code: error.code, details: error.details });
        }
    },

    // Atualizar comandante existente
    async update(req: Request, res: Response) {
        try {
            const { id } = req.params;
            console.log('UPDATE Comandante ID:', id, 'Body:', req.body);

            const {
                crbm, militar_id, nome_comandante, posto_graduacao, telefone, email, data_inicio,
                subcomandante_militar_id, nome_subcomandante, subcomandante_posto, subcomandante_telefone, subcomandante_email,
                observacoes
            } = req.body;

            const payload = {
                crbm,
                militar_id: militar_id || null,
                nome_comandante,
                posto_graduacao,
                telefone,
                email,
                data_inicio: data_inicio || null,
                subcomandante_militar_id: subcomandante_militar_id || null,
                nome_subcomandante,
                subcomandante_posto,
                subcomandante_telefone,
                subcomandante_email,
                observacoes,
                updated_at: new Date()
            };

            const { data, error } = await supabaseAdmin
                .from('comandantes_crbm')
                .update(payload)
                .eq('id', id)
                .select()
                .single();

            if (error) {
                console.error('Supabase Error (Update):', error);
                throw error;
            }

            return res.status(200).json(data);
        } catch (error: any) {
            console.error('Erro ao atualizar comandante CRBM:', error);
            return res.status(500).json({ message: error.message, code: error.code, details: error.details });
        }
    },

    // Deletar comandante
    async delete(req: Request, res: Response) {
        try {
            const { id } = req.params;

            const { error } = await supabaseAdmin
                .from('comandantes_crbm')
                .delete()
                .eq('id', id);

            if (error) throw error;

            return res.status(200).json({ message: 'Comandante removido com sucesso.' });
        } catch (error: any) {
            console.error('Erro ao deletar comandante CRBM:', error);
            return res.status(500).json({ message: error.message });
        }
    },

    // Buscar militares para autocomplete (por nome ou matrícula)
    async searchMilitares(req: Request, res: Response) {
        try {
            const { q } = req.query;

            if (!q || (q as string).length < 2) {
                return res.status(200).json([]);
            }

            const { data, error } = await supabaseAdmin
                .from('militares')
                .select('id, matricula, nome_completo, nome_guerra, posto_graduacao, telefone')
                .eq('ativo', true)
                .or(`nome_completo.ilike.%${q}%,nome_guerra.ilike.%${q}%,matricula.ilike.%${q}%`)
                .limit(15);

            if (error) throw error;

            return res.status(200).json(data);
        } catch (error: any) {
            console.error('Erro ao buscar militares:', error);
            return res.status(500).json({ message: error.message });
        }
    }
};

export default comandantesCrbmController;
