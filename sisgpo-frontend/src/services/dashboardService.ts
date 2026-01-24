import {
    DashboardStats,
    ChartStat,
    ViaturaStatAgrupada,
    ViaturaPorObmStat,
    ServicoInfo,
    Aeronave,
    PlantonistaCodec,
} from '@/types/dashboard';
import {
    Obm,
} from '@/types/entities';

import api from './api';

export const dashboardService = {
    async getStats(selectedObm?: string): Promise<DashboardStats> {
        try {
            const { data } = await api.get('/api/public/dashboard/stats', { params: { obm_id: selectedObm } });
            return data;
        } catch (error) {
            console.error('Error fetching stats:', error);
            return { total_militares_ativos: 0, total_viaturas_disponiveis: 0, total_obms: 0 };
        }
    },

    async getViaturaStatsPorTipo(selectedObm?: string): Promise<ChartStat[]> {
        try {
            const { data } = await api.get('/api/public/dashboard/viatura-stats-por-tipo', { params: { obm_id: selectedObm } });
            return data;
        } catch (error) {
            console.error('Error fetching viatura stats by type:', error);
            return [];
        }
    },

    async getMilitarStats(selectedObm?: string): Promise<ChartStat[]> {
        try {
            const { data } = await api.get('/api/public/dashboard/militar-stats', { params: { obm_id: selectedObm } });
            return data;
        } catch (error) {
            console.error('Error fetching militar stats:', error);
            return [];
        }
    },

    async getMilitarStatsPorCrbm(selectedObm?: string): Promise<ChartStat[]> {
        try {
            const { data } = await api.get('/api/public/dashboard/militar-stats-por-crbm', { params: { obm_id: selectedObm } });
            return data;
        } catch (error) {
            console.error('Error fetching militar stats por CRBM:', error);
            return [];
        }
    },

    async getViaturaStatsDetalhado(selectedObm?: string): Promise<ViaturaStatAgrupada[]> {
        try {
            const { data } = await api.get('/api/public/dashboard/viatura-stats-detalhado', { params: { obm_id: selectedObm } });
            return data;
        } catch (error) {
            console.error('Error fetching detailed viatura stats:', error);
            return [];
        }
    },

    async getViaturaStatsPorObm(selectedObm?: string): Promise<ViaturaPorObmStat[]> {
        try {
            const { data } = await api.get('/api/public/dashboard/viatura-stats-por-obm', { params: { obm_id: selectedObm } });
            return data;
        } catch (error) {
            console.error('Error fetching viatura stats per OBM:', error);
            return [];
        }
    },

    async getServicoDia(selectedObm?: string): Promise<ServicoInfo[]> {
        try {
            const { data } = await api.get('/api/public/dashboard/servico-dia', { params: { obm_id: selectedObm } });
            return data;
        } catch (error) {
            console.error('Error fetching Service of the Day:', error);
            return [];
        }
    },

    async getEscalaAeronaves(): Promise<Aeronave[]> {
        try {
            const { data } = await api.get('/api/public/dashboard/escala-aeronaves');
            return data;
        } catch (error) {
            console.error('Error fetching Aircraft Schedule:', error);
            return [];
        }
    },

    async getEscalaCodec(): Promise<PlantonistaCodec[]> {
        try {
            const { data } = await api.get('/api/public/dashboard/escala-codec');
            return data;
        } catch (error) {
            console.error('Error fetching CODEC Schedule:', error);
            return [];
        }
    },

    async getMilitaresEscaladosCount(selectedObm?: string): Promise<number> {
        try {
            // Backend endpoint for count
            const { data } = await api.get('/api/public/dashboard/militares-escalados-count', { params: { obm_id: selectedObm } });
            return data?.count || 0;
        } catch (error) {
            console.error('Error counting scheduled personnel:', error);
            return 0;
        }
    },

    async getViaturasEmpenhadasCount(): Promise<{ count: number, engagedSet: Set<string> }> {
        try {
            const { data } = await api.get('/api/public/dashboard/viaturas-empenhadas-count');
            // Backend returns { count, engagedSet: string[] }
            // Convert array back to Set
            return {
                count: data.count,
                engagedSet: new Set(data.engagedSet)
            };
        } catch (error) {
            console.error('Error fetching engaged vehicles:', error);
            return { count: 0, engagedSet: new Set() };
        }
    },

    async getViaturasAtivasCount(): Promise<number> {
        try {
            const stats = await this.getStats();
            return stats.total_viaturas_disponiveis;
        } catch (error) {
            return 0;
        }
    },

    async getObms(): Promise<Obm[]> {
        try {
            // OBM list might require auth, relying on default axios config
            const { data } = await api.get('/api/dashboard/obms'); // Protected route usually
            if (data && Array.isArray(data.data)) {
                return data.data;
            }
            if (Array.isArray(data)) {
                return data;
            }
            return [];
        } catch (error) {
            console.error('Error fetching OBMs:', error);
            return [];
        }
    }
};
