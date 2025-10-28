// Arquivo: src/pages/Relatorio.tsx (CORRIGIDO com Code-Splitting)

import React, { useState, useCallback, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '@/services/api';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Label from '@/components/ui/Label';
import Spinner from '@/components/ui/Spinner';
import { Printer, User, Shield, Stethoscope, Plane, Car } from 'lucide-react';
// import jsPDF from 'jspdf'; <-- REMOVIDO
// import html2canvas from 'html2canvas'; <-- REMOVIDO
import { useUiStore } from '@/store/uiStore';

// --- Interfaces para os dados do relatório ---
interface ServicoDia { funcao: string; posto_graduacao: string; nome: string; }
interface Guarnicao { funcao: string; posto_graduacao: string; nome_guerra: string; }
interface PlantaoVTR { id: number; prefixo: string; observacoes: string; guarnicao: Guarnicao[]; }
interface EscalaAeronave { prefixo: string; status: string; primeiro_piloto: string; segundo_piloto: string; }
interface EscalaCodec { turno: string; ordem_plantonista: number; nome_plantonista: string; }
interface EscalaMedico { nome_completo: string; funcao: string; entrada_servico: string; saida_servico: string; status_servico: string; observacoes: string; }
interface RelatorioData {
  data_relatorio: string;
  servicoDia: ServicoDia[];
  plantoesVTR: PlantaoVTR[];
  escalaAeronaves: EscalaAeronave[];
  escalaCodec: EscalaCodec[];
  escalaMedicos: EscalaMedico[];
}

// --- Componente de Seção reutilizável ---
const Section = ({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) => (
  <div className="mt-6 break-inside-avoid">
    <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2 border-b-2 border-gray-200 pb-2">
      <Icon className="w-5 h-5 text-indigo-600" />
      {title}
    </h2>
    {children}
  </div>
);

export default function Relatorio() {
  const { setPageTitle } = useUiStore();

  useEffect(() => {
    setPageTitle("Relatório Diário Consolidado");
  }, [setPageTitle]);

  const [data, setData] = useState(new Date().toISOString().split('T')[0]);
  const [relatorio, setRelatorio] = useState<RelatorioData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const relatorioRef = useRef<HTMLDivElement>(null);

  const buscarRelatorio = useCallback(async () => {
    if (!data) {
      toast.error('Por favor, selecione uma data.');
      return;
    }
    setIsLoading(true);
    setRelatorio(null);
    try {
      const response = await api.get<RelatorioData>(`/api/admin/relatorio-diario?data=${data}`);
      setRelatorio(response.data);
    } catch (error) {
      toast.error('Não foi possível carregar os dados do relatório.');
    } finally {
      setIsLoading(false);
    }
  }, [data]);

  const handleGeneratePdf = async () => {
    if (!relatorioRef.current) return;
    setIsGeneratingPdf(true);
    toast.loading('Gerando PDF...', { id: 'pdf-toast' });

    try {
      // --- INÍCIO DA CORREÇÃO (Code Splitting) ---
      // Importa as bibliotecas dinamicamente APENAS no momento do clique.
      // Isso move o código de 'jspdf' e 'html2canvas' para arquivos separados
      // que só são baixados quando esta função é executada.
      const { default: jsPDF } = await import('jspdf');
      const { default: html2canvas } = await import('html2canvas');
      // --- FIM DA CORREÇÃO (Code Splitting) ---

      // --- INÍCIO DA CORREÇÃO DEFINITIVA (Preservada do seu código original) ---
      // Usamos "as any" para contornar a verificação de tipo estrita do TypeScript,
      // já que a biblioteca em tempo de execução aceita a propriedade 'scale'.
      const canvas = await html2canvas(relatorioRef.current, {
        scale: 2,
        useCORS: true,
      } as any); // <--- AQUI ESTÁ A CORREÇÃO
      // --- FIM DA CORREÇÃO DEFINITIVA ---
      
      const imgData = canvas.toDataURL('image/png');
      
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgHeight = canvas.height * pdfWidth / canvas.width;
      let heightLeft = imgHeight;
      let position = 10;

      pdf.addImage(imgData, 'PNG', 10, position, pdfWidth - 20, imgHeight);
      heightLeft -= (pdfHeight - 20);

      while (heightLeft > 0) {
        position = heightLeft - imgHeight + 10;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 10, position, pdfWidth - 20, imgHeight);
        heightLeft -= (pdfHeight - 20);
      }

      pdf.save(`relatorio-diario-${data}.pdf`);
      toast.success('PDF gerado com sucesso!', { id: 'pdf-toast' });
    } catch (error) {
      toast.error('Erro ao gerar o PDF.', { id: 'pdf-toast' });
      console.error(error);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const formatDateTime = (isoString: string) => new Date(isoString).toLocaleString('pt-BR', { timeZone: 'UTC', hour: '2-digit', minute: '2-digit' });

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">Relatório Diário Consolidado</h2>
          <p className="text-gray-600 mt-2">Visualize e exporte os dados operacionais de um dia específico.</p>
        </div>
        <Button onClick={handleGeneratePdf} disabled={!relatorio || isGeneratingPdf} className="print:hidden">
          {isGeneratingPdf ? <Spinner /> : <Printer className="w-4 h-4 mr-2" />}
          Gerar PDF
        </Button>
      </div>

      <div className="flex items-end gap-4 mb-6 p-4 bg-gray-50 rounded-lg border print:hidden">
        <div className="flex-grow">
          <Label htmlFor="data-relatorio">Data do Relatório</Label>
          <Input id="data-relatorio" type="date" value={data} onChange={(e) => setData(e.target.value)} />
        </div>
        <Button onClick={buscarRelatorio} disabled={isLoading}>
          {isLoading ? <Spinner /> : 'Buscar Dados'}
        </Button>
      </div>

      {isLoading && <div className="text-center py-10"><Spinner className="h-12 w-12 mx-auto" /></div>}
      
      {relatorio && (
        <div ref={relatorioRef} className="p-6 bg-white border rounded-lg text-sm">
          <div className="text-center mb-6">
            <h1 className="text-xl font-bold">RELATÓRIO OPERACIONAL DIÁRIO</h1>
            <p className="text-md">{new Date(relatorio.data_relatorio + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>

          <Section title="Serviço de Dia" icon={User}>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-2">
              {relatorio.servicoDia.map((s, i) => (
                <div key={i}><strong>{s.funcao}:</strong> {s.posto_graduacao} {s.nome}</div>
              ))}
            </div>
          </Section>

          <Section title="Escala de Médicos" icon={Stethoscope}>
            {relatorio.escalaMedicos.length > 0 ? (
              <ul className="list-disc list-inside space-y-1">
                {relatorio.escalaMedicos.map((m, i) => (
                  <li key={i}>
                    <strong>{m.nome_completo}</strong> ({m.funcao}) - Status: {m.status_servico} | Plantão: {formatDateTime(m.entrada_servico)} às {formatDateTime(m.saida_servico)}
                  </li>
                ))}
              </ul>
            ) : <p className="text-gray-500 italic">Nenhum médico escalado.</p>}
          </Section>

          <Section title="Escala de Aeronaves" icon={Plane}>
            {relatorio.escalaAeronaves.length > 0 ? (
              <ul className="space-y-2">
                {relatorio.escalaAeronaves.map((a, i) => (
                  <li key={i}>
                    <strong>{a.prefixo}</strong> ({a.status}) - 1º Piloto: {a.primeiro_piloto}, 2º Piloto: {a.segundo_piloto}
                  </li>
                ))}
              </ul>
            ) : <p className="text-gray-500 italic">Nenhuma aeronave escalada.</p>}
          </Section>

          <Section title="Escala CODEC" icon={Shield}>
            {relatorio.escalaCodec.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold">Turno Diurno</h4>
                  <ul className="list-disc list-inside">
                    {relatorio.escalaCodec.filter(c => c.turno === 'diurno').map((c, i) => <li key={i}>{c.nome_plantonista}</li>)}
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold">Turno Noturno</h4>
                  <ul className="list-disc list-inside">
                    {relatorio.escalaCodec.filter(c => c.turno === 'noturno').map((c, i) => <li key={i}>{c.nome_plantonista}</li>)}
                  </ul>
                </div>
              </div>
            ) : <p className="text-gray-500 italic">Nenhum plantonista no CODEC.</p>}
          </Section>

          <Section title="Plantões de Viaturas" icon={Car}>
            {relatorio.plantoesVTR.length > 0 ? (
              <div className="space-y-4">
                {relatorio.plantoesVTR.map((p) => (
                  <div key={p.id} className="p-2 border-l-4 border-indigo-200">
                    <h3 className="font-bold">{p.prefixo}</h3>
                    {p.observacoes && <p className="text-xs text-gray-600">Obs: {p.observacoes}</p>}
                    <ul className="text-xs ml-2">
                      {p.guarnicao.map((g, j) => <li key={j}><strong>{g.funcao}:</strong> {g.posto_graduacao} {g.nome_guerra}</li>)}
                    </ul>
                  </div>
                ))}
              </div>
            ) : <p className="text-gray-500 italic">Nenhuma viatura em plantão.</p>}
          </Section>
        </div>
      )}
    </div>
  );
}