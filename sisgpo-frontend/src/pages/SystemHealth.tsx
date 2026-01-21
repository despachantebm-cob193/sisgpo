
import { useEffect, useState } from 'react';
import { ShieldCheck, AlertTriangle, Bug, BrainCircuit, RefreshCw, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { useUiStore } from '../store/uiStore';

interface TestLog {
    id: string;
    executed_at: string;
    perfil: string;
    success: boolean;
    ai_suggestions: string;
    broken_links_count: number;
    forbidden_access_count: number;
}

export default function SystemHealth() {
    const { setPageTitle } = useUiStore();
    const [logs, setLogs] = useState<TestLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRunning, setIsRunning] = useState(false);

    const fetchLogs = async () => {
        setIsLoading(true);
        try {
            const { data } = await api.get('/api/tests/logs');
            setLogs(data);
        } catch (error) {
            toast.error('Falha ao carregar logs de teste');
        } finally {
            setIsLoading(false);
        }
    };

    const runTests = async () => {
        setIsRunning(true);
        try {
            await api.post('/api/tests/run');
            toast.success('Testes executados com sucesso!');
            await fetchLogs();
        } catch (error) {
            toast.error('Falha ao executar testes');
        } finally {
            setIsRunning(false);
        }
    };

    useEffect(() => {
        setPageTitle('Saúde do Sistema');
        fetchLogs();
    }, [setPageTitle]);

    return (
        <div className="space-y-6 p-4 md:p-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white">Plano de Testes Diário</h1>
                    <p className="text-gray-400">Monitoramento automático de integridade, acessos e permissões.</p>
                </div>
                <Button
                    onClick={runTests}
                    disabled={isRunning}
                    className="bg-tagBlue hover:bg-tagBlue/80 flex items-center gap-2"
                >
                    {isRunning ? <RefreshCw className="h-5 w-5 animate-spin" /> : <ShieldCheck className="h-5 w-5" />}
                    Executar Testes Agora
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-emerald-500/10 border-emerald-500/20 p-6 flex flex-col items-center text-center">
                    <CheckCircle2 className="h-12 w-12 text-emerald-500 mb-2" />
                    <h3 className="text-xl font-semibold text-white">Status Geral</h3>
                    <p className="text-emerald-300 text-sm">Sistema íntegro</p>
                </Card>

                <Card className="bg-amber-500/10 border-amber-500/20 p-6 flex flex-col items-center text-center">
                    <AlertTriangle className="h-12 w-12 text-amber-500 mb-2" />
                    <h3 className="text-xl font-semibold text-white">Links Quebrados</h3>
                    <p className="text-amber-300 text-sm">0 detectados hoje</p>
                </Card>

                <Card className="bg-rose-500/10 border-rose-500/20 p-6 flex flex-col items-center text-center">
                    <Bug className="h-12 w-12 text-rose-500 mb-2" />
                    <h3 className="text-xl font-semibold text-white">Falhas de Permissão</h3>
                    <p className="text-rose-300 text-sm">0 indevidos</p>
                </Card>
            </div>

            <div className="space-y-4">
                <h2 className="text-2xl font-semibold text-white flex items-center gap-2">
                    <RefreshCw className="h-6 w-6 text-tagBlue" />
                    Histórico de Execuções
                </h2>

                {isLoading ? (
                    <div className="text-center py-10 text-gray-400">Carregando histórico...</div>
                ) : (
                    <div className="space-y-4">
                        {logs.map((log) => (
                            <Card key={log.id} className="bg-[#1a1f2e] border-white/5 p-6 border-l-4 overflow-hidden"
                                style={{ borderLeftColor: log.success ? '#10b981' : '#f43f5e' }}>
                                <div className="flex flex-col md:flex-row justify-between gap-4">
                                    <div className="space-y-2 flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${log.success ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                                                {log.success ? 'Sucesso' : 'Falha Detectada'}
                                            </span>
                                            <span className="text-sm text-gray-400">
                                                {new Date(log.executed_at).toLocaleString('pt-BR')}
                                            </span>
                                            <span className="text-xs text-gray-500 italic">Executor: {log.perfil}</span>
                                        </div>

                                        <div className="bg-blue-500/5 border border-blue-500/10 rounded-lg p-4 mt-4">
                                            <div className="flex items-center gap-2 text-tagBlue mb-2">
                                                <BrainCircuit className="h-5 w-5" />
                                                <span className="font-semibold">Análise da IA / Sugestões</span>
                                            </div>
                                            <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
                                                {log.ai_suggestions}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex flex-row md:flex-col gap-4 text-center">
                                        <div className="bg-black/20 rounded-lg p-3 min-w-[100px]">
                                            <span className="block text-2xl font-bold text-white">{log.broken_links_count}</span>
                                            <span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Links Quebrados</span>
                                        </div>
                                        <div className="bg-black/20 rounded-lg p-3 min-w-[100px]">
                                            <span className="block text-2xl font-bold text-white">{log.forbidden_access_count}</span>
                                            <span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Acessos Negados</span>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
