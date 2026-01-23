
import { useState, useCallback, useEffect } from 'react';
import { dashboardService } from '@/services/dashboardService';
import {
    DashboardStats,
    ChartStat,
    ViaturaStatAgrupada,
    ViaturaPorObmStat,
    ServicoInfo,
    Aeronave,
    PlantonistaCodec
} from '@/types/dashboard';

export function useDashboardData(selectedObm: string) {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [viaturaTipoStats, setViaturaTipoStats] = useState<ChartStat[]>([]);
    const [militarStats, setMilitarStats] = useState<ChartStat[]>([]);
    const [militarByCrbmStats, setMilitarByCrbmStats] = useState<ChartStat[]>([]);
    const [viaturaDetailStats, setViaturaDetailStats] = useState<ViaturaStatAgrupada[]>([]);
    const [viaturaPorObmStats, setViaturaPorObmStats] = useState<ViaturaPorObmStat[]>([]);
    const [servicoDia, setServicoDia] = useState<ServicoInfo[]>([]);
    const [escalaAeronaves, setEscalaAeronaves] = useState<Aeronave[]>([]);
    const [escalaCodec, setEscalaCodec] = useState<PlantonistaCodec[]>([]);
    const [militaresEscaladosCount, setMilitaresEscaladosCount] = useState<number | null>(null);

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchDashboardData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const [
                statsData,
                viaturaTipoData,
                militarStatsData,
                militarByCrbmStatsData,
                viaturaDetailData,
                viaturaPorObmData,
                servicoDiaData,
                escalaAeronavesData,
                escalaCodecData,
                militaresEscaladosCountVal
            ] = await Promise.all([
                dashboardService.getStats(selectedObm),
                dashboardService.getViaturaStatsPorTipo(selectedObm),
                dashboardService.getMilitarStats(selectedObm),
                dashboardService.getMilitarStatsPorCrbm(selectedObm),
                dashboardService.getViaturaStatsDetalhado(selectedObm),
                dashboardService.getViaturaStatsPorObm(selectedObm),
                dashboardService.getServicoDia(selectedObm),
                dashboardService.getEscalaAeronaves(),
                dashboardService.getEscalaCodec(),
                dashboardService.getMilitaresEscaladosCount(selectedObm)
            ]);

            setStats(statsData);
            setViaturaTipoStats(viaturaTipoData);
            setMilitarStats(militarStatsData);
            setMilitarByCrbmStats(militarByCrbmStatsData);
            setViaturaDetailStats(viaturaDetailData);
            setViaturaPorObmStats(viaturaPorObmData);
            setServicoDia(servicoDiaData);
            setEscalaAeronaves(escalaAeronavesData);
            setEscalaCodec(escalaCodecData);
            setMilitaresEscaladosCount(militaresEscaladosCountVal);
        } catch (err) {
            console.error(err);
            setError('Não foi possível carregar os dados do dashboard.');
        } finally {
            setIsLoading(false);
        }
    }, [selectedObm]);

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    return {
        stats,
        viaturaTipoStats,
        militarStats,
        militarByCrbmStats,
        viaturaDetailStats,
        viaturaPorObmStats,
        servicoDia,
        escalaAeronaves,
        escalaCodec,
        militaresEscaladosCount,
        isLoading,
        error,
        refresh: fetchDashboardData
    };
}
