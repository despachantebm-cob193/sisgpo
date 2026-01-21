
import React, { useState } from 'react';
import Modal from './Modal';
import { subHours, subDays, startOfHour, endOfHour } from 'date-fns';
import { FileText, Calendar, Clock } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';

interface MetricsReportModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type Period = '1h' | '6h' | '1d' | '7d' | '15d' | '30d' | 'custom';

const MetricsReportModal: React.FC<MetricsReportModalProps> = ({ isOpen, onClose }) => {
    const [period, setPeriod] = useState<Period>('1d');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    const handleGenerate = async () => {
        let start: Date;
        let end = new Date();

        if (period === 'custom') {
            if (!startDate || !endDate) {
                toast.error('Informe as datas inicial e final.');
                return;
            }
            start = new Date(startDate);
            end = new Date(endDate);
        } else {
            switch (period) {
                case '1h': start = subHours(end, 1); break;
                case '6h': start = subHours(end, 6); break;
                case '1d': start = subDays(end, 1); break;
                case '7d': start = subDays(end, 7); break;
                case '15d': start = subDays(end, 15); break;
                case '30d': start = subDays(end, 30); break;
                default: start = subDays(end, 1);
            }
        }

        setIsGenerating(true);
        const toastId = toast.loading('Analisando dados e gerando relatório...');

        try {
            const response = await api.get('/api/admin/metrics/report', {
                params: {
                    startDate: start.toISOString(),
                    endDate: end.toISOString(),
                }
            });

            const { summary, stats, period: resPeriod } = response.data;

            // Generate PDF
            const doc = jsPDF();
            const pageWidth = doc.internal.pageSize.getWidth();

            // Theme colors
            const primaryColor = [31, 38, 88]; // #1f2658

            // Header
            doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
            doc.rect(0, 0, pageWidth, 40, 'F');

            doc.setTextColor(255, 255, 255);
            doc.setFontSize(22);
            doc.text('SISGPO - Relatório de Performance', 15, 20);
            doc.setFontSize(10);
            doc.text(`Período: ${new Date(resPeriod.startDate).toLocaleString()} até ${new Date(resPeriod.endDate).toLocaleString()}`, 15, 30);
            doc.text(`Gerado em: ${new Date().toLocaleString()}`, 15, 35);

            // 1. Resumo da IA
            doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
            doc.setFontSize(16);
            doc.text('1. Resumo Executivo (Análise IA)', 15, 55);

            doc.setTextColor(60, 60, 60);
            doc.setFontSize(11);
            const splitSummary = doc.splitTextToSize(summary, pageWidth - 30);
            doc.text(splitSummary, 15, 65);

            let currentY = 65 + (splitSummary.length * 6) + 10;

            // 2. Estatísticas Web Vitals
            if (currentY > 240) { doc.addPage(); currentY = 20; }
            doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
            doc.setFontSize(16);
            doc.text('2. Métricas de Experiência (Web Vitals)', 15, currentY);
            currentY += 10;

            doc.setTextColor(60, 60, 60);
            doc.setFontSize(11);
            doc.text(`- LCP (Largest Contentful Paint): ${stats.wv.LCP}s`, 20, currentY); currentY += 7;
            doc.text(`- CLS (Cumulative Layout Shift): ${stats.wv.CLS}`, 20, currentY); currentY += 7;
            doc.text(`- FID (First Input Delay): ${stats.wv.FID}ms`, 20, currentY); currentY += 7;
            doc.text(`- INP (Interaction to Next Paint): ${stats.wv.INP}ms`, 20, currentY); currentY += 7;
            doc.text(`- Total de Amostras: ${stats.wv.totalSamples}`, 20, currentY); currentY += 10;

            // 3. Estatísticas de API
            if (currentY > 240) { doc.addPage(); currentY = 20; }
            doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
            doc.setFontSize(16);
            doc.text('3. Performance da API e Backend', 15, currentY);
            currentY += 10;

            doc.setTextColor(60, 60, 60);
            doc.setFontSize(11);
            doc.text(`- Total de Requisições: ${stats.api.totalRequests}`, 20, currentY); currentY += 7;
            doc.text(`- Latência Média: ${stats.api.avgLatency}`, 20, currentY); currentY += 7;
            doc.text(`- Taxa de Erro: ${stats.api.errorRate}`, 20, currentY); currentY += 12;

            doc.setFontSize(13);
            doc.text('Rotas mais lentas:', 20, currentY);
            currentY += 8;
            doc.setFontSize(10);
            stats.api.topSlowRoutes.forEach((route: any) => {
                doc.text(`${route.route}: ${route.avg}ms (${route.count} chamadas)`, 25, currentY);
                currentY += 6;
            });

            // Footer message
            doc.setFontSize(8);
            doc.setTextColor(150, 150, 150);
            doc.text('Este relatório é gerado automaticamente pelo SISGPO utilizando inteligência artificial para análise de dados.', 15, 285);

            doc.save(`relatorio-performance-${period}-${Date.now()}.pdf`);
            toast.success('Relatório gerado com sucesso!', { id: toastId });
            onClose();
        } catch (err: any) {
            console.error(err);
            toast.error('Erro ao gerar relatório: ' + (err.response?.data?.message || err.message), { id: toastId });
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Gerar Relatório de Performance" maxWidth="max-w-md">
            <div className="space-y-6 py-2">
                <p className="text-sm text-textSecondary">
                    Selecione o período dos dados que deseja analisar. A IA processará os registros e gerará um relatório técnico descritivo em PDF.
                </p>

                <div className="grid grid-cols-2 gap-3">
                    {[
                        { id: '1h', label: 'Última Hora', icon: <Clock size={16} /> },
                        { id: '6h', label: 'Últimas 6h', icon: <Clock size={16} /> },
                        { id: '1d', label: 'Último Dia', icon: <Calendar size={16} /> },
                        { id: '7d', label: 'Última Semana', icon: <Calendar size={16} /> },
                        { id: '15d', label: 'Últimos 15 dias', icon: <Calendar size={16} /> },
                        { id: '30d', label: 'Últimos 30 dias', icon: <Calendar size={16} /> },
                        { id: 'custom', label: 'Personalizado', icon: <Calendar size={16} /> },
                    ].map((opt) => (
                        <button
                            key={opt.id}
                            onClick={() => setPeriod(opt.id as Period)}
                            className={`flex items-center gap-2 rounded-lg border p-3 text-sm transition-all focus:outline-none ${period === opt.id
                                    ? 'border-tagBlue bg-tagBlue/10 text-tagBlue'
                                    : 'border-borderDark bg-searchbar/40 text-textSecondary hover:bg-searchbar'
                                }`}
                        >
                            {opt.icon}
                            {opt.label}
                        </button>
                    ))}
                </div>

                {period === 'custom' && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-textSecondary uppercase">Data Inicial</label>
                                <input
                                    type="datetime-local"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="w-full rounded-md border border-borderDark bg-searchbar px-3 py-2 text-sm text-textMain focus:border-tagBlue focus:outline-none"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-textSecondary uppercase">Data Final</label>
                                <input
                                    type="datetime-local"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="w-full rounded-md border border-borderDark bg-searchbar px-3 py-2 text-sm text-textMain focus:border-tagBlue focus:outline-none"
                                />
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex gap-3 pt-4">
                    <button
                        onClick={onClose}
                        className="flex-1 rounded-md border border-borderDark px-4 py-2 text-sm font-medium text-textMain transition-colors hover:bg-searchbar"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleGenerate}
                        disabled={isGenerating}
                        className="flex-1 flex items-center justify-center gap-2 rounded-md bg-tagBlue px-4 py-2 text-sm font-bold text-white shadow-md transition-all hover:bg-tagBlue/90 active:scale-95 disabled:opacity-50"
                    >
                        {isGenerating ? (
                            <>
                                <Clock className="animate-spin" size={18} />
                                Gerando...
                            </>
                        ) : (
                            <>
                                <FileText size={18} />
                                Gerar PDF
                            </>
                        )}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default MetricsReportModal;
