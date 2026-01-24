import api from './api';
import { Militar } from '@/types/entities';

interface MilitarListResponse {
    data: Militar[];
    pagination: {
        currentPage: number;
        perPage: number;
        totalPages: number;
        totalRecords: number;
    };
}

interface MilitarListParams {
    page?: number;
    limit?: number;
    q?: string;
    crbm?: string;
    ativo?: boolean;
}

export const militarService = {
    async list(params: MilitarListParams): Promise<MilitarListResponse> {
        try {
            const { data } = await api.get('/api/admin/militares', { params });
            return data;
        } catch (error) {
            console.error('Erro ao listar militares:', error);
            throw new Error('Não foi possível carregar a lista de militares.');
        }
    },

    async getByMatricula(matricula: string): Promise<Militar> {
        try {
            const { data } = await api.get(`/api/admin/militares/${matricula}`); // Adjust if there's a specific public detail endpoint or use list with filtering
            return data;
        } catch (error) {
            console.error('Erro ao buscar militar:', error);
            throw new Error('Militar não encontrado.');
        }
    }
};
